import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from services.agents.models import AgentResponse
try:
    from services.utils.config import LLM_MODEL, QDRANT_HOST, QDRANT_PORT
except ImportError:
    LLM_MODEL = os.environ.get("LLM_MODEL", "qwen3")
    QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
    QDRANT_PORT = int(os.environ.get("QDRANT_PORT", "6333"))

try:
    from services.utils.vector_db import QdrantStorage
except ImportError:
    QdrantStorage = None  # type: ignore[assignment]


# Ollama is expected to run as its own service (see docker-compose.yml) or locally.
def _default_ollama_url() -> str:
    env_url = os.environ.get("OLLAMA_BASE_URL") or os.environ.get("OLLAMA_HOST")
    if env_url:
        return env_url
    if os.path.exists("/.dockerenv") or os.environ.get("IN_DOCKER"):
        return "http://ollama:11434"
    return "http://localhost:11434"


OLLAMA_BASE_URL = _default_ollama_url()
DEFAULT_MODEL = os.environ.get("LLM_MODEL", LLM_MODEL if LLM_MODEL else "qwen3")

SYSTEM_PROMPT = (
    "You are a private, on-premise assistant for the Sovereign AI "
    "Workbench. Answer the user's question using ONLY the provided "
    "context below. "

    "Understand what the user is asking and decide how much information "
    "is needed. For simple questions, give a short and direct answer. "
    "For questions asking for explanation or details, provide a more "
    "complete answer. "

    "Summarize the information in your own words instead of copying "
    "the context word-for-word. Keep the answer clear and easy to "
    "understand. "

    "Do not add information that is not present in the context. "
    "If the context does not contain enough information, say so plainly "
    "instead of guessing. "

    "When you use information from the context, cite it using its "
    "[n] marker."
)


# Retrieval contract: Chunk dataclass & search_documents
try:
    from qdrant import Chunk, search_documents  # type: ignore
except ImportError:
    @dataclass
    class Chunk:
        """A single retrieved, reranked chunk with a clean source reference."""
        text: str
        score: float = 0.0
        rerank_score: float = 0.0
        source: Dict[str, Any] = field(default_factory=dict)
        id: Optional[Any] = None

    def search_documents(
        query: str,
        top_k: int = 5,
        collection: str = "documents",
    ) -> List[Chunk]:
        """
        Search the knowledge base using Qdrant vector database with hybrid
        retrieval (dense + sparse) and Cross-Encoder reranking via QdrantStorage.
        Returns structured Chunk objects conforming to Palak's retrieval contract.
        """
        if QdrantStorage is None:
            print("[RAG] QdrantStorage is not available.")
            return []

        try:
            vector_db = QdrantStorage(host=QDRANT_HOST, port=QDRANT_PORT)
            raw_results = vector_db.query(query, collection=collection, limit=top_k)
            chunks: List[Chunk] = []
            for res in raw_results:
                metadata = dict(res.get("metadata", {}))
                score = float(res.get("score", 0.0))
                if "score" not in metadata:
                    metadata["score"] = score
                if "rerank_score" not in metadata:
                    metadata["rerank_score"] = score
                if "document_id" not in metadata and "id" in res:
                    metadata["document_id"] = res.get("id")

                chunks.append(
                    Chunk(
                        text=res.get("text", ""),
                        source=metadata,
                        score=score,
                        rerank_score=score,
                        id=res.get("id"),
                    )
                )
            return chunks
        except Exception as e:
            print(f"[RAG] Search documents error: {e}")
            return []


def search_knowledge_base(
    query: str,
    collection: str = "documents",
    limit: int = 5,
) -> str:
    """
    Search the knowledge base using Qdrant vector database.
    Returns formatted relevant document chunks.
    """
    chunks = search_documents(query, top_k=limit, collection=collection)
    if not chunks:
        return "No relevant documents found in the knowledge base."

    formatted_results = []
    for i, chunk in enumerate(chunks, 1):
        formatted_results.append(
            f"--- Result {i} (score: {chunk.score:.3f}) ---\n{chunk.text}\n"
        )
    return "\n".join(formatted_results)


class RagState(TypedDict, total=False):
    collection: str
    query: str
    rerank_limit: int
    chunks: List[Chunk]
    context: str
    sources: List[Dict[str, Any]]
    answer: str
    search_results: str
    markdown: str


AgentState = RagState  # Backward compatibility alias


def search_node(state: RagState) -> RagState:
    """
    Retrieval node that queries Qdrant with hybrid retrieval and Cross-Encoder
    reranking, populating chunks, numbered context blocks ([1], [2]), and metadata sources.
    """
    query = state.get("query", "")
    collection = state.get("collection", "documents")
    rerank_limit = state.get("rerank_limit", 5)

    print(f"[RAG] RAG searching for: {query}")
    try:
        chunks = search_documents(
            query=query,
            top_k=rerank_limit,
            collection=collection,
        )
    except Exception as e:
        print(f"[RAG] Search error in search_node: {e}")
        chunks = []

    state["chunks"] = chunks

    context_blocks = []
    sources = []

    for i, chunk in enumerate(chunks, start=1):
        context_blocks.append(f"[{i}] {chunk.text}")
        source_dict = dict(getattr(chunk, "source", {}))
        score_val = getattr(chunk, "score", 0.0)
        rerank_val = getattr(chunk, "rerank_score", score_val)

        sources.append({
            "marker": i,
            "text": chunk.text,
            "score": score_val,
            "rerank_score": rerank_val,
            **source_dict,
        })

    state["context"] = "\n\n".join(context_blocks)
    state["sources"] = sources
    state["search_results"] = state["context"]
    print(f"[RAG] Found {len(chunks)} chunks ({len(state['context'])} chars)")
    return state


def write_context_node(state: RagState) -> RagState:
    """Write search results/context to data/context.md and ./context.md for downstream agents."""
    context_content = state.get("context", "") or state.get("search_results", "")

    # 1. Prototype project layout (data/context.md)
    try:
        project_root = Path(__file__).resolve().parent.parent.parent
        data_dir = project_root / "data"
        if data_dir.exists() or (project_root / "Services").exists():
            data_dir.mkdir(parents=True, exist_ok=True)
            context_path = data_dir / "context.md"
            context_path.write_text(context_content, encoding="utf-8")
            print(f"[RAG] Wrote {len(context_content)} chars to {context_path}")
    except Exception as e:
        print(f"[RAG] Notice: data/context.md write skipped: {e}")

    # 2. Local context.md (for container or root execution)
    try:
        local_context = Path("context.md")
        local_context.write_text(context_content, encoding="utf-8")
    except Exception:
        pass

    return state


def generate_node(state: RagState) -> RagState:
    """Generate answer from context with citations or return clean fallback if empty."""
    if not state.get("chunks"):
        state["answer"] = (
            "I couldn't find anything relevant in the knowledge base "
            "for that question."
        )
        return state

    llm_kwargs: Dict[str, Any] = {
        "model": DEFAULT_MODEL,
        "temperature": 0,
    }
    if OLLAMA_BASE_URL:
        llm_kwargs["base_url"] = OLLAMA_BASE_URL

    context_len = len(state.get("context", ""))
    if context_len > 0:
        llm_kwargs["num_ctx"] = max(2048, context_len + 1000)

    llm = ChatOllama(**llm_kwargs)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Context:\n{state['context']}\n\n" # type: ignore
                f"Question: {state['query']}" # type: ignore
            )
        ),
    ]

    try:
        response = llm.invoke(messages)
        state["answer"] = str(response.content)
    except Exception as e:
        print(f"[RAG] Generation error in generate_node: {e}")
        state["answer"] = f"Unable to generate response from model: {e}"

    print("[RAG] RAG Search END")
    return state


def build_rag_agent():
    """Build and compile the LangGraph RAG workflow."""
    graph = StateGraph(RagState)
    graph.add_node("search", search_node)
    graph.add_node("write_context", write_context_node)
    graph.add_node("generate", generate_node)

    graph.add_edge(START, "search")
    graph.add_edge("search", "write_context")
    graph.add_edge("write_context", "generate")
    graph.add_edge("generate", END)

    return graph.compile()


# Compiled once at import time and reused across requests.
_agent = build_rag_agent()
rag_graph = _agent  # Backward compatibility alias


def create_markdown(
    query: str,
    answer: str,
    sources: List[Dict[str, Any]],
) -> str:
    """Format search results into a clean, comprehensive Markdown report."""
    md = "# Sovereign Search Result\n\n"
    md += f"**Query:** {query}\n\n"
    md += "## Answer\n\n"
    md += f"{answer}\n\n"

    if sources:
        md += "## Sources\n\n"
        for i, source in enumerate(sources, start=1):
            marker = source.get("marker", i)
            md += f"### [{marker}] Result {i}\n\n"

            if "text" in source:
                md += f"**text:** {source['text']}\n\n"

            for field_name in ("document_id", "file_name", "filename", "title", "source"):
                if field_name in source and source[field_name] is not None:
                    md += f"**{field_name}:** {source[field_name]}\n\n"

            if "rerank_score" in source and source["rerank_score"] is not None:
                try:
                    md += f"**rerank_score:** {float(source['rerank_score']):.4f}\n\n"
                except (ValueError, TypeError):
                    md += f"**rerank_score:** {source['rerank_score']}\n\n"
            elif "score" in source and source["score"] is not None:
                try:
                    md += f"**score:** {float(source['score']):.4f}\n\n"
                except (ValueError, TypeError):
                    md += f"**score:** {source['score']}\n\n"

    return md


def run_rag_agent(
    collection: str = "documents",
    query: str = "",
    rerank_limit: int = 5,
) -> Dict[str, Any]:
    """Functional entrypoint for executing the RAG agent pipeline."""
    initial_state: RagState = {
        "collection": collection,
        "query": query,
        "rerank_limit": rerank_limit,
        "chunks": [],
        "context": "",
        "sources": [],
        "answer": "",
        "search_results": "",
        "markdown": "",
    }

    try:
        final_state = _agent.invoke(initial_state)
    except Exception as e:
        print(f"[RAG] Workflow error in run_rag_agent: {e}")
        fallback_answer = "I couldn't find anything relevant in the knowledge base for that question."
        return {
            "answer": fallback_answer,
            "sources": [],
            "markdown": create_markdown(query, fallback_answer, []),
            "context": "",
        }

    markdown = create_markdown(
        final_state.get("query", query),
        final_state.get("answer", ""),
        final_state.get("sources", []),
    )

    return {
        "answer": final_state.get("answer", ""),
        "sources": final_state.get("sources", []),
        "markdown": markdown,
        "context": final_state.get("context", ""),
    }


class RAGAgent:
    """
    RAG Agent: Uses LangGraph with Qdrant vector retrieval and Cross-Encoder reranking
    to search and answer questions with grounded citations.
    """

    def __init__(self, collection: str = "documents", rerank_limit: int = 5):
        self.collection = collection
        self.rerank_limit = rerank_limit
        self.graph = _agent

    async def run(self, query: str) -> AgentResponse:
        """
        Search the knowledge base and return answer using LangGraph.
        Returns an AgentResponse compatible with Supervisor and API routes.
        """
        try:
            initial_state: RagState = {
                "collection": self.collection,
                "query": query,
                "rerank_limit": self.rerank_limit,
                "chunks": [],
                "context": "",
                "sources": [],
                "answer": "",
                "search_results": "",
                "markdown": "",
            }

            from services.utils.broadcaster import broadcaster
            import asyncio
            asyncio.create_task(broadcaster.broadcast("agentTrace", f"> [ACT] Executing RAG Search for '{query}'..."))

            final_state = await self.graph.ainvoke(initial_state)

            chunks = final_state.get("chunks", [])
            asyncio.create_task(broadcaster.broadcast("agentTrace", f"  Retrieved {len(chunks)} chunks from Vector DB."))
            asyncio.create_task(broadcaster.broadcast("agentTrace", "> [PLAN] Synthesizing response..."))
            answer = final_state.get("answer", "")
            context = final_state.get("context", "")
            sources = final_state.get("sources", [])

            markdown = create_markdown(
                final_state.get("query", query),
                answer,
                sources,
            )

            no_results = (
                not chunks
                or not context
                or "couldn't find anything relevant" in answer.lower()
            )

            return AgentResponse(
                agent="rag",
                status="no_results" if no_results else "success",
                content=answer,
                search_results=markdown if markdown else context,
            )
        except Exception as e:
            print(f"[RAG] Error in RAGAgent.run: {e}")
            return AgentResponse(
                agent="rag",
                status="error",
                content="An error occurred while searching the knowledge base.",
                error=str(e),
            )
