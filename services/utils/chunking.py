"""Chunk raw markdown into LLM-friendly pieces without breaking tables,
code fences, or paragraphs.

Split strategy (safest → most aggressive):
1. Split at top-level headings (# / ##).
2. If a heading-group still exceeds the budget, split at sub-headings (###/####).
3. If a single block (table, code fence, paragraph) still exceeds the budget,
   keep it whole — truncating mid-structure is worse than a slightly oversized chunk.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# ── defaults ──────────────────────────────────────────────────────────────────
# ~12K chars keeps us safely under 8K tokens for qwen3:8b once the system
# prompt, schema overhead, and output budget are accounted for.
DEFAULT_MAX_CHUNK_CHARS = 12_000


@dataclass
class MarkdownBlock:
    """An atomic markdown block that must not be split."""
    kind: str                       # "heading", "table", "code_fence", "text"
    content: str                    # raw text including delimiters
    heading_level: int | None = None  # 1-6 for headings, None otherwise


def _parse_blocks(md: str) -> list[MarkdownBlock]:
    """Parse markdown into atomic blocks: headings, tables, fenced code, text."""
    lines = md.split("\n")
    blocks: list[MarkdownBlock] = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # ── fenced code block (``` or ~~~) ────────────────────────────────
        fence_match = re.match(r"^(`{3,}|~{3,})", line)
        if fence_match:
            fence = fence_match.group(1)
            fence_char = fence[0]
            fence_len = len(fence)
            block_lines = [line]
            i += 1
            while i < len(lines):
                close_match = re.match(
                    rf"^{re.escape(fence_char)}{{{fence_len},}}\s*$", lines[i]
                )
                block_lines.append(lines[i])
                i += 1
                if close_match:
                    break
            blocks.append(MarkdownBlock(
                kind="code_fence", content="\n".join(block_lines),
            ))
            continue

        # ── heading ───────────────────────────────────────────────────────
        heading_match = re.match(r"^(#{1,6})\s+", line)
        if heading_match:
            blocks.append(MarkdownBlock(
                kind="heading",
                content=line,
                heading_level=len(heading_match.group(1)),
            ))
            i += 1
            continue

        # ── table (starts with |) ────────────────────────────────────────
        if line.lstrip().startswith("|"):
            table_lines = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            blocks.append(MarkdownBlock(
                kind="table", content="\n".join(table_lines),
            ))
            continue

        # ── blank line — skip, we'll rejoin with \n\n later ──────────────
        if not line.strip():
            i += 1
            continue

        # ── text paragraph (everything until blank line or structural) ───
        para_lines = []
        while i < len(lines):
            ln = lines[i]
            if not ln.strip():
                break
            if re.match(r"^(#{1,6})\s+", ln):
                break
            if re.match(r"^(`{3,}|~{3,})", ln):
                break
            if ln.lstrip().startswith("|"):
                break
            para_lines.append(ln)
            i += 1
        if para_lines:
            blocks.append(MarkdownBlock(
                kind="text", content="\n".join(para_lines),
            ))
        continue

    return blocks


@dataclass
class _Chunk:
    blocks: list[MarkdownBlock] = field(default_factory=list)

    @property
    def char_count(self) -> int:
        # +2 per block for the "\n\n" join separator
        return sum(len(b.content) + 2 for b in self.blocks) - 2 if self.blocks else 0

    def text(self) -> str:
        return "\n\n".join(b.content for b in self.blocks)


def chunk_markdown(
    md: str,
    max_chars: int = DEFAULT_MAX_CHUNK_CHARS,
) -> list[str]:
    """Split markdown into chunks that respect block boundaries.

    Returns a list of markdown strings, each ≤ max_chars (unless a single
    atomic block exceeds the limit — those are kept whole).
    """
    if len(md) <= max_chars:
        return [md]

    blocks = _parse_blocks(md)
    if not blocks:
        return [md] if md.strip() else []

    chunks: list[_Chunk] = []
    current = _Chunk()

    for block in blocks:
        block_len = len(block.content)

        # Would adding this block overflow?
        projected = current.char_count + block_len + 2 if current.blocks else block_len
        if projected > max_chars and current.blocks:
            # Flush current chunk
            chunks.append(current)
            current = _Chunk()

        # A level-1/2 heading starts a new chunk only when the current chunk
        # already has meaningful content (≥25% of budget).  This prevents
        # tiny chunks containing just a heading line.
        if (
            block.kind == "heading"
            and block.heading_level is not None
            and block.heading_level <= 2
            and current.blocks
            and current.char_count >= max_chars // 4
        ):
            chunks.append(current)
            current = _Chunk()

        current.blocks.append(block)

    if current.blocks:
        chunks.append(current)

    return [c.text() for c in chunks]
