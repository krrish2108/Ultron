from pydantic import BaseModel
from typing import Optional, TypedDict
from typing_extensions import Literal
from pydantic import Field


class AgentResponse(BaseModel):
    agent: Literal["rag", "doc_gen", "chat"]
    status: Literal["success", "error", "no_results"]
    content: str
    error: Optional[str] = None
    search_results: Optional[str] = None
    file_path: Optional[str] = None
    needs_followup: bool = False
    followup_hint: Optional[str] = None


# ── Document Generation Models ────────────────────────────────────────────────────────

class Section(BaseModel):
    type: Literal["Title", "Heading", "Subtitle", "Paragraph", "BulletList", "NumberedList", "Table", "BlockQuote", "CodeBlock", "Section"]
    content: str

class Sections(BaseModel):
    sections: list[Section]

class PlaceholderValues(BaseModel):
    """LLM's fill-in values for each detected {{placeholder}} in the template."""
    values: dict[str, str] = Field(
        default_factory=dict,
        description="Map of placeholder name (without braces) to the text that should replace it."
    )

class BlockContent(BaseModel):
    """LLM-generated markdown content for each {{block:name}} section in the template."""
    blocks: dict[str, str] = Field(
        default_factory=dict,
        description=(
            "Map of block name to generated markdown content (may span multiple "
            "paragraphs, a bullet list, or a markdown table) for that section."
        )
    )

class DocGenState(TypedDict):
    message: str
    context_md: str
    template_path: Optional[str]
    template_outline: Optional[str]
    template_placeholders: Optional[list[str]]   # simple {{name}} fields
    template_blocks: Optional[list[str]]          # {{block:name}} sections
    template_block_placements: Optional[dict[str, str]]  # name -> "standalone" | "inline"
    placeholder_values: Optional[dict[str, str]]
    block_content: Optional[dict[str, str]]
    structured_document: Optional[Sections]
    final_output: str
