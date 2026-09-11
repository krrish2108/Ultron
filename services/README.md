# Services — Backend Architecture

## Overview

The `services/` package is the Python backend for the Sovereign AI Workbench. It exposes a FastAPI server that accepts user messages, classifies intent via an LLM-based supervisor, and dispatches work to specialized LangGraph agents (RAG retrieval or document generation). All LLM inference runs locally through Ollama.

## Directory Structure

```
services/
  .env                        # Model names, Qdrant connection, feature flags
  __init__.py

  app/                        # FastAPI application layer
    main.py                   # Lifespan, CORS, Docling GPU warm-up, uvicorn entry
    routes.py                 # HTTP/WS endpoints: /chat, /ingest, /upload-template, etc.
    context.md                # Accumulated ingested document text (append-mode)
    assets/warmup.pdf         # Trivial PDF used to force-load Docling GPU weights at startup
    __init__.py

  agents/                     # LangGraph agent definitions
    models.py                 # Shared Pydantic models: AgentResponse, DocGenState, Section, etc.
    supervisor.py             # Intent router — classifies messages → rag | doc_gen | chat
    rag_agent.py              # RAG agent — Qdrant hybrid search + cross-encoder reranking + LLM answer
    doc_gen_agent.py          # Doc Gen agent — context.md → structured sections → DOCX via pypandoc
    app.py                    # Standalone scratch/test script (NOT part of the pipeline)
    __init__.py

  utils/                      # Shared utilities
    config.py                 # Loads .env; exports LLM_MODEL, ROUTER_MODEL, DOC_GEN_MODEL, etc.
    broadcaster.py            # WebSocket fan-out singleton for real-time UI transparency events
    ingest.py                 # Docling-based document conversion (PDF/DOCX/XLSX/PPTX → DoclingDocument)
    chunking.py               # Markdown-aware text chunking that preserves tables, fences, headings
    template_utils.py         # DOCX template inspection, placeholder/block fill, render nodes
    vector_db.py              # QdrantStorage — hybrid dense+sparse search with cross-encoder reranking
    sandbox_docker.py         # Docker-isolated code execution sandbox
    __init__.py
```

## Request Flow

```
Frontend POST /chat { message, context?, template_path? }
        │
        ▼
    routes.py  ──►  Supervisor._classify(message)
                        │
                        │  LLM structured output → RouteDecision { intent, reasoning }
                        │
                ┌───────┼───────────┐
                ▼       ▼           ▼
              "rag"   "doc_gen"   "chat"

  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐
  │   RAG Agent      │  │  Doc Gen Agent   │  │  Direct LLM  │
  │                   │  │                  │  │  (no agent)  │
  │ search_node       │  │ read_context     │  └──────────────┘
  │  → Qdrant hybrid  │  │  → data/context.md
  │  → cross-encoder  │  │ read_template
  │ write_context     │  │  → DOCX inspection
  │  → pass-through   │  │ route_after_template
  │ generate_node     │  │  ├─ template_edit_mode
  │  → LLM w/ context │  │  │   fill_placeholders
  │                   │  │  │   fill_blocks
  │  AgentResponse    │  │  │   render_placeholder_docx
  └─────────────────┘  │  ├─ outline_mode
                        │  │   structure (chunked LLM)
                        │  │   generate (md → DOCX)
                        │  └─ default_mode
                        │      structure (chunked LLM)
                        │      generate (md → DOCX)
                        │
                        │  AgentResponse { file_path }
                        └──────────────────┘
```

## Ingestion Flow

```
Frontend file upload
        │
        ▼
  POST /ingest
        │
        ├─ Save raw file → data/uploads/documents/
        ├─ Docling convert → DoclingDocument
        ├─ Export to markdown
        └─ Append to data/context.md (with --- separator and <!-- source: filename --> comment)
```

`context.md` accumulates content from all uploaded files. A `DELETE /context` endpoint clears it for fresh sessions. The doc_gen agent reads this file as its primary source material.

## Key Endpoints

| Method   | Path               | Purpose                                              |
|----------|--------------------|------------------------------------------------------|
| `GET`    | `/`                | Health check                                         |
| `POST`   | `/chat`            | Main chat — routes through Supervisor to agents      |
| `POST`   | `/ingest`          | Ingest any document (PDF/DOCX/XLSX/PPTX) via Docling |
| `POST`   | `/upload-template` | Upload a `.docx` template for styled doc generation  |
| `DELETE` | `/context`         | Clear `context.md` for a fresh session               |
| `GET`    | `/download?path=`  | Download a generated file by absolute path           |
| `WS`     | `/ws/transparency` | Real-time agent trace and routing logic events       |

## Agent Details

### Supervisor (`supervisor.py`)

- Uses `ChatOllama` with structured output to classify messages into `rag`, `doc_gen`, or `chat`.
- Supports one bounded follow-up chain: if RAG returns `needs_followup=True` with `followup_hint="doc_gen"`, the supervisor automatically chains a doc_gen call using the RAG search results as context.
- Broadcasts routing decisions and agent traces over WebSocket for UI transparency.

### RAG Agent (`rag_agent.py`)

LangGraph with three nodes: `search → write_context → generate`.

- **search_node**: Queries Qdrant via `QdrantStorage.query()` which performs hybrid dense+sparse retrieval followed by cross-encoder reranking. Formats results as numbered `[1]...[n]` context blocks for citation.
- **write_context_node**: Pass-through. Search results live in graph state only — does not write to `data/context.md` (that file is owned by the `/ingest` endpoint).
- **generate_node**: Feeds the numbered context + user question to `ChatOllama` with a citation-focused system prompt. Returns the answer in `AgentResponse.content`.

Graceful degradation: if Qdrant is unreachable or `QdrantStorage` fails to import, all search functions return empty results instead of crashing.

### Doc Gen Agent (`doc_gen_agent.py`)

LangGraph with conditional branching based on template analysis:

- **read_context_node**: Reads `data/context.md` (the accumulated ingested content).
- **read_template_node** (in `template_utils.py`): Inspects the uploaded DOCX template for:
  - `{{placeholder}}` fields and `{{block:name}}` sections → **template_edit_mode**
  - Heading structure (via pypandoc) → **outline_mode**
  - Neither → **default_mode**

**Template Edit Mode** (`fill_placeholders → fill_blocks → render_placeholder_docx`):
- LLM fills each placeholder/block using the ingested context.
- Standalone blocks are converted to DOCX via pypandoc and spliced into the template XML.
- Inline blocks are flattened to plain text and substituted in-place.

**Outline / Default Mode** (`structure → generate`):
- Context markdown is chunked via `chunk_markdown()` (respects tables, code fences, headings).
- Each chunk is processed concurrently (semaphore-limited to 3) by the LLM into typed `Section` objects.
- Sections are reassembled into markdown and converted to DOCX via pypandoc.
- In outline mode, the template's heading structure guides the LLM; the template DOCX is used as a `--reference-doc` for styling.

## Utilities

### `config.py`
Loads `.env` from project root. Exports: `LLM_MODEL`, `ROUTER_MODEL`, `DOC_GEN_MODEL`, `LLM_REASONING`, `QDRANT_HOST`, `QDRANT_PORT`, `EMBEDDING_MODEL`.

### `broadcaster.py`
WebSocket fan-out singleton. Agents fire `broadcaster.broadcast(event_type, data)` to push real-time trace/routing events to the frontend's `/ws/transparency` connection.

### `ingest.py`
Thin wrapper around Docling's `DocumentConverter`. Accepts a file path and the shared converter instance (initialized at startup with CUDA acceleration). Returns the `DoclingDocument` object whose `.export_to_markdown()` is used by `/ingest`.

### `chunking.py`
Splits raw markdown into LLM-friendly chunks without breaking tables, code fences, or paragraphs. Strategy: split at `#`/`##` headings first, then `###`/`####` if oversized. Single blocks that exceed the budget are kept whole. Default budget: 12,000 chars (~8K tokens for qwen3:8b).

### `template_utils.py`
DOCX template processing for the doc_gen pipeline:
- `read_template_node`: Scans for `{{placeholder}}` and `{{block:name}}` markers using python-docx, falls back to pypandoc heading extraction.
- `fill_placeholders_node` / `fill_blocks_node`: LLM-powered structured output to fill each marker.
- `render_placeholder_docx_node`: Applies placeholder values and block content back into the DOCX, handling both standalone (full paragraph replacement) and inline (text substitution) blocks.

### `vector_db.py`
`QdrantStorage` class wrapping `qdrant_client` with:
- Hybrid retrieval: dense embeddings (`BAAI/bge-small-en-v1.5` via fastembed) + sparse embeddings (`Splade_PP_en_v1`).
- Reciprocal Rank Fusion (RRF) to merge dense and sparse results.
- Cross-encoder reranking (`jina-reranker-v2-base-multilingual`) for final scoring.
- Model singletons: embedding models and cross-encoder are loaded once per process.

### `sandbox_docker.py`
Docker-isolated code execution for Python, JavaScript, C, C++, and Java. Supports both blocking (`execute_code`) and streaming (`execute_code_streaming`) modes. Not currently wired into the main pipeline (stub endpoint at `POST /system/sandbox`).

## Configuration (.env)

```env
LLM_MODEL=qwen3:8b              # RAG generation model
ROUTER_MODEL=qwen3:1.7b         # Supervisor intent classification (small, fast)
DOC_GEN_MODEL=qwen2.5-coder:7b  # Document structuring model
LLM_REASONING=false              # Enable/disable reasoning mode on router LLM
QDRANT_HOST=localhost
QDRANT_PORT=6333
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
```

## Audit Findings (Fixed)

### Critical: `write_context_node` overwrote ingested documents
**File**: `rag_agent.py` — `write_context_node`

The RAG agent's `write_context_node` was calling `context_path.write_text(...)` to dump search results into `data/context.md`. Since the `/ingest` endpoint appends uploaded documents to that same file, every RAG search would wipe all ingested content and replace it with search snippets. The doc_gen agent reads `context.md` as its source material, so this silently destroyed the pipeline's input.

**Fix**: `write_context_node` is now a pass-through. Search results remain in graph state (`state["context"]`, `state["search_results"]`) and are consumed directly by `generate_node`. The file `data/context.md` is owned exclusively by `/ingest`.

### Critical: `from utils.*` import failures
**File**: `doc_gen_agent.py` lines 13-15

Imports used bare `from utils.config import ...` which fails when the process runs from the project root (the standard `uvicorn` invocation). Python's module resolution requires the fully qualified `from services.utils.config import ...`.

**Fix**: All three imports corrected to `from services.utils.*`.

### Critical: `from Services.agents.models` (wrong casing)
**File**: `rag_agent.py` line 12

Used `from Services.agents.models import AgentResponse` — capital `S` doesn't match the filesystem on case-sensitive systems. This caused the fallback `AgentResponse` class to be used instead, which had a different field set than the canonical one in `models.py`, producing type mismatches when the supervisor handled the response.

**Fix**: Changed to `from services.agents.models import AgentResponse` and removed the redundant fallback class definition.

### Critical: `from Services.utils.*` (wrong casing)
**File**: `rag_agent.py` lines 28, 35

Same capital-S casing issue for config and vector_db imports. These were wrapped in try/except so they silently fell back to environment variable defaults, but the fallback masked configuration errors.

**Fix**: Changed to `from services.utils.*`.

### Moderate: `broadcaster.broadcast()` typed `data: dict` but called with `str`
**File**: `broadcaster.py` line 17

The `broadcast` method was typed `data: dict` but `supervisor.py` and `rag_agent.py` pass plain strings for trace events. `json.dumps()` handles both, but the type annotation was wrong.

**Fix**: Changed to `data: Any`.

### Moderate: Unsafe `TypedDict` key access
**File**: `rag_agent.py` lines 250-251

`RagState` is defined with `total=False` (all keys optional), but `generate_node` accessed `state["context"]` and `state["query"]` directly. If the graph is invoked with missing keys, this raises `KeyError`.

**Fix**: Changed to `state.get("context", "")` and `state.get("query", "")`.

### Low: Dead code — `HybridChunker` import and `chunk_document`
**File**: `ingest.py` lines 4-6, 20-25

`HybridChunker` was imported and instantiated at module level, and `chunk_document()` was defined but never called anywhere in the codebase. The pipeline uses `chunk_markdown()` from `chunking.py` instead. The `HybridChunker` import adds startup latency and was the source of previous crashes (it requires a `DoclingDocument` object, not a markdown string).

**Fix**: Removed the unused import, singleton instance, and `chunk_document` function.

### Low: Stale `Services` directory check
**File**: `rag_agent.py` line 206

`write_context_node` checked `(project_root / "Services").exists()` — a leftover from a previous folder naming convention. The folder is `services/` (lowercase). This was dead code inside the now-removed write logic.

**Fix**: Removed along with the `write_context_node` rewrite.

## Remaining Known Issues (Non-blocking)

### `app.py` — type errors (not part of pipeline)
`services/agents/app.py` is a standalone scratch script for testing `ChatOllama` directly. It has two type errors (wrong annotation on `prompts`, misuse of `ChatPromptTemplate`). It is not imported by any pipeline code and does not affect production behavior.

### `sandbox_docker.py` — type narrowing warnings
`subprocess.Popen` with `stdout=PIPE` returns `IO[str] | None` but the code reads `.stdout` without narrowing. Pyright flags this but it cannot be `None` at runtime when `PIPE` is passed. Not a runtime risk.

### `insert_point` — ID collisions
`vector_db.py` `insert_point()` uses `np.random.randint(1, 1000000)` for point IDs. With enough inserts this will collide. `insert_chunks` uses sequential IDs starting from 0 which will collide across different documents. Consider UUIDs.

### Stub endpoints
`/sessions`, `/sessions/{id}`, `/assets`, `/assets/{id}`, `/assets/{id}/scan`, and `/system/sandbox` are all stub implementations returning hardcoded responses.
