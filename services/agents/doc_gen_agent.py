import time
import uuid

import pypandoc
import asyncio
from pathlib import Path
from typing import Optional, cast
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from services.agents.models import AgentResponse, DocGenState, Section, Sections
from services.utils.config import DOC_GEN_MODEL, LLM_MODEL
from services.utils.chunking import chunk_markdown
from services.utils.template_utils import (
    read_template_node,
    fill_placeholders_node,
    fill_blocks_node,
    render_placeholder_docx_node
)






# ── Nodes ─────────────────────────────────────────────────────────────────────

def read_context_node(state: DocGenState) -> dict:
    """Node 1: Read context.md"""
    project_root = Path(__file__).resolve().parent.parent.parent
    context_path = project_root / "data" / "context.md"

    context_md = context_path.read_text(encoding="utf-8") if context_path.exists() else ""
    print(f"[DOC_GEN] read_context: {len(context_md)} chars from context.md")
    return {"context_md": context_md}


def route_after_template(state: DocGenState) -> str:
    """Conditional edge: decide which structuring/render path to take."""
    if state.get("template_placeholders") or state.get("template_blocks"):
        return "template_edit_mode"
    if state.get("template_outline"):
        return "outline_mode"
    return "default_mode"


STRUCTURING_SYSTEM_PROMPT = """\
You are an expert report writing and document generation assistant. Your job is to fulfill the User Request by drafting a professional, well-structured document using the provided RAW SOURCE CONTENT as your knowledge base.

The User Request will dictate the style and goal of the document (e.g., a high-level summary, a detailed extraction of specific rules, or a comprehensive report). You must output a flat list of typed document sections that forms the final generated document.

## Section types

- **Title**: The main title of the document. Use exactly one at the top.
- **Heading**: Major section headings (equivalent to ##).
- **Subtitle**: Sub-headings (equivalent to ###).
- **Paragraph**: Standard prose text. Synthesize and write coherent paragraphs answering the user prompt.
- **BulletList**: A markdown-formatted bullet list (`- item`). Use for key takeaways, extracted rules, or unordered lists.
- **NumberedList**: A markdown-formatted numbered list (`1. item`). Use for sequential steps or ranked items.
- **Table**: A markdown table (must include header row and separators). Use for structured data comparison.
- **BlockQuote**: A markdown quote (`> quote`). Use for citing important rules, legal text, or emphasis.
- **CodeBlock**: A markdown code block (``` ... ```). Use for code snippets or raw technical data.
- **Section**: Any other miscellaneous markdown text.

## Rules

1. **Follow User Intent**: Read the "User request" carefully. If it asks for a summary, provide a concise, high-level overview. If it asks to extract specific details (e.g., inspection rules), thoroughly hunt for and list ONLY those details. If it asks for a full report, provide a comprehensive document.
2. **Synthesize & Draft**: Do NOT just blindly copy the source document line-by-line unless explicitly asked. You are the author. Write clear, professional prose based on the context.
3. **Structure Logically**: Organize your document with a Title, logical Headings/Subtitles, and cleanly separate ideas into Paragraphs or BulletLists.
4. **No Nesting**: Output a flat list. Represent structure purely through your choice of section type.
5. **Grounding**: Base all factual claims ONLY on the provided source content. Do not hallucinate external information.
"""

TEMPLATE_STRUCTURING_SYSTEM_PROMPT = """\
You are a document structuring assistant. A user has provided a TEMPLATE OUTLINE \
(a required sequence of headings/subheadings) and RAW SOURCE CONTENT. Your job is \
to produce a flat list of typed document sections that FOLLOWS THE TEMPLATE'S \
STRUCTURE AND ORDER, filling each part of the template with the most relevant \
information found in the raw source content.

Each section has a "type" and "content" field.

## Section types

- **Title**: The main document title. Exactly one, usually derived from the template's top heading.
- **Heading**: A major section heading (matches a top-level heading in the template outline).
- **Subtitle**: A sub-heading under a Heading (matches a sub-level heading in the template outline).
- **Paragraph**: A block of prose filling in that part of the template, drawn from the source content.
- **Table**: A markdown table, if the source content contains one relevant to this part of the template.
- **Section**: Any other block (lists, code blocks, quotes) relevant to this part of the template.

## Rules

1. Follow the TEMPLATE OUTLINE headings exactly, in the same order, using the same heading text.
2. For each heading/subheading in the template, find and use the corresponding information \
from the raw source content to write the Paragraph/Table/Section content beneath it.
3. Do NOT fabricate information that has no basis in the source content. If the source has \
nothing relevant for a template heading, still include the heading but write a brief \
Paragraph noting that no information was provided, rather than inventing facts.
4. Do NOT omit any template heading, even if source content for it is thin.
5. Do NOT add headings that are not in the template outline.
6. Keep table formatting intact (pipes, alignment, header separators) where used.
"""

async def generate_structured_document(state: DocGenState) -> dict:
    """Runs for outline_mode and default_mode only (template_edit_mode has its own nodes)."""
    MAX_CONCURRENT = 3
    CHUNK_TIMEOUT = 120

    context_md = state.get("context_md", "")
    message = state.get("message", "")
    template_outline = state.get("template_outline")

    llm = ChatOllama(
        model=DOC_GEN_MODEL,
        num_ctx=8192,
        temperature=0.2,
    )
    structured_llm = llm.with_structured_output(Sections)

    if template_outline:
        print("[DOC_GEN] structuring: template outline mode (single guided call)")
        t0 = time.monotonic()
        try:
            result = cast(Sections, await asyncio.wait_for(
                structured_llm.ainvoke([
                    SystemMessage(content=TEMPLATE_STRUCTURING_SYSTEM_PROMPT),
                    HumanMessage(content=(
                        f"User request: {message}\n\n"
                        f"TEMPLATE OUTLINE (follow this structure and order exactly):\n"
                        f"{template_outline}\n\n"
                        f"RAW SOURCE CONTENT (use this to fill in each template section):\n"
                        f"{context_md}"
                    )),
                ]),
                timeout=CHUNK_TIMEOUT * 2,
            ))
        except asyncio.TimeoutError:
            print(f"[DOC_GEN] structuring: outline mode TIMED OUT")
            result = Sections(sections=[])
        except Exception as e:
            print(f"[DOC_GEN] structuring: outline mode FAILED — {type(e).__name__}: {e}")
            result = Sections(sections=[])
        elapsed = time.monotonic() - t0
        print(f"[DOC_GEN] structured (outline mode): {len(result.sections)} sections in {elapsed:.1f}s")
        return {"structured_document": result}

    # ── Default mode: existing chunked, content-preserving pipeline ─────────
    chunks = chunk_markdown(context_md)
    total = len(chunks)
    print(f"[DOC_GEN] structuring: {len(context_md)} chars → {total} chunk(s), concurrency={MAX_CONCURRENT}")
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def _structure_chunk(idx: int, chunk_text: str) -> list[Section]:
        print(f"[DOC_GEN]   chunk {idx + 1}/{total}: queued, waiting for semaphore")
        async with semaphore:
            t0 = time.monotonic()
            print(f"[DOC_GEN]   chunk {idx + 1}/{total}: {len(chunk_text)} chars (started)")
            try:
                chunk_result = cast(Sections, await asyncio.wait_for(
                    structured_llm.ainvoke([
                        SystemMessage(content=STRUCTURING_SYSTEM_PROMPT),
                        HumanMessage(content=(
                            f"User request: {message}\n\n"
                            f"RAW SOURCE CONTENT (Part {idx + 1} of {total}):\n\n"
                            f"{chunk_text}"
                        )),
                    ]),
                    timeout=CHUNK_TIMEOUT,
                ))
            except asyncio.TimeoutError:
                print(f"[DOC_GEN]   chunk {idx + 1}: TIMED OUT after {CHUNK_TIMEOUT}s")
                raise
            except Exception as e:
                print(f"[DOC_GEN]   chunk {idx + 1}: FAILED — {type(e).__name__}: {e}")
                raise
            elapsed = time.monotonic() - t0
            print(f"[DOC_GEN]   chunk {idx + 1}: {len(chunk_result.sections)} sections in {elapsed:.1f}s (done)")
            return chunk_result.sections

    results = await asyncio.gather(
        *(_structure_chunk(i, text) for i, text in enumerate(chunks)),
        return_exceptions=True,
    )

    all_sections: list[Section] = []
    for i, section_list in enumerate(results):
        if isinstance(section_list, Exception):
            print(f"[DOC_GEN]   chunk {i + 1} errored, skipping: {section_list}")
            continue
        all_sections.extend(cast(list[Section], section_list))

    result = Sections(sections=all_sections)
    print(f"[DOC_GEN] structured: {len(result.sections)} total sections")
    return {"structured_document": result}


# Mapping from Section.type to markdown formatting
_SECTION_TYPE_TO_MD = {
    "Title": "# {content}",
    "Heading": "## {content}",
    "Subtitle": "### {content}",
    "Paragraph": "{content}",
    "BulletList": "{content}",
    "NumberedList": "{content}",
    "BlockQuote": "> {content}",
    "CodeBlock": "```\n{content}\n```",
    "Table": "{content}",
    "Section": "{content}",
}


def generate_node(state: DocGenState) -> dict:
    """Node (outline_mode / default_mode only): Rebuild markdown from
    structured sections, then convert to DOCX. Applies template as a
    pandoc reference-doc for styling if one was supplied (outline mode).
    """
    structured_doc = cast(Sections, state["structured_document"])

    doc_json = structured_doc.model_dump_json(indent=2)
    print(f"[DOC_GEN] generate_node: structured JSON ({len(doc_json)} chars)")

    md_parts: list[str] = []
    for section in structured_doc.sections:
        template = _SECTION_TYPE_TO_MD.get(section.type, "{content}")
        md_parts.append(template.format(content=section.content))

    markdown_content = "\n\n".join(md_parts)
    print(f"[DOC_GEN] generate_node: produced {len(markdown_content)} chars markdown")

    output_path = str(Path(__file__).resolve().parent.parent.parent / f"output_{uuid.uuid4()}.docx")

    template_path = state.get("template_path")
    extra_args: list[str] = []
    if template_path:
        template_file = Path(template_path)
        if template_file.exists() and template_file.suffix.lower() == ".docx":
            extra_args.append(f"--reference-doc={template_file}")
            print(f"[DOC_GEN] applying template styling: {template_file}")

    try:
        pypandoc.convert_text(
            markdown_content,
            "docx",
            format="md",
            outputfile=output_path,
            extra_args=extra_args,
        )
        print(f"[DOC_GEN] saved DOCX to {output_path}")
    except Exception as e:
        print(f"[DOC_GEN] pypandoc FAILED: {e}")

    return {"final_output": f"[DOC_GEN] saved DOCX to {output_path}"}


# ── Graph ─────────────────────────────────────────────────────────────────────

workflow = StateGraph(DocGenState)
workflow.add_node("read_context", read_context_node)
workflow.add_node("read_template", read_template_node)
workflow.add_node("structure", generate_structured_document)
workflow.add_node("generate", generate_node)
workflow.add_node("fill_placeholders", fill_placeholders_node)
workflow.add_node("fill_blocks", fill_blocks_node)
workflow.add_node("render_placeholder_docx", render_placeholder_docx_node)

workflow.set_entry_point("read_context")
workflow.add_edge("read_context", "read_template")

workflow.add_conditional_edges(
    "read_template",
    route_after_template,
    {
        "template_edit_mode": "fill_placeholders",
        "outline_mode": "structure",
        "default_mode": "structure",
    },
)

workflow.add_edge("fill_placeholders", "fill_blocks")
workflow.add_edge("fill_blocks", "render_placeholder_docx")
workflow.add_edge("render_placeholder_docx", END)

workflow.add_edge("structure", "generate")
workflow.add_edge("generate", END)

doc_gen_graph = workflow.compile()


# ── Agent wrapper ─────────────────────────────────────────────────────────────

class DocGenAgent:
    """Document Generation: context.md (+ optional template/placeholders/blocks) → DOCX"""

    def __init__(self, model_name: str = "qwen3:8b"):
        self.graph = doc_gen_graph

    async def run(self, message: str, context: str = "", template_path: Optional[str] = None) -> AgentResponse:
        print(f"[DOC_GEN] run: '{message}'" + (f" (template={template_path})" if template_path else ""))
        try:
            initial_state: DocGenState = {
                "message": message,
                "context_md": "",
                "template_path": template_path,
                "template_outline": None,
                "template_placeholders": None,
                "template_blocks": None,
                "template_block_placements": None,
                "placeholder_values": None,
                "block_content": None,
                "structured_document": None,
                "final_output": "",
            }

            result = await self.graph.ainvoke(initial_state)
            final_output = result.get("final_output", "")

            # Extract file path from "[DOC_GEN] saved DOCX to {path}"
            file_path = None
            if "saved DOCX to" in final_output:
                file_path = final_output.split("saved DOCX to", 1)[1].strip()

            if final_output:
                filename = file_path if file_path else "output"
                return AgentResponse(
                    agent="doc_gen",
                    status="success",
                    content=f"Document generated successfully: {filename}",
                    file_path=file_path,
                )
            else:
                return AgentResponse(
                    agent="doc_gen",
                    status="error",
                    content="Document generation produced no output.",
                    error="Empty final_output from graph",
                )
        except Exception as e:
            print(f"[DOC_GEN] Error: {e}")
            return AgentResponse(
                agent="doc_gen",
                status="error",
                content="An error occurred during document generation.",
                error=str(e),
            )
