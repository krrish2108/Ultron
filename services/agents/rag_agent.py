import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, START, StateGraph
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from services.agents.models import AgentResponse
from services.utils.config import RAG_MODEL, RAG_REPEAT_PENALTY, RAG_TEMP, RAG_TOP_K, RAG_TOP_P
from services.utils.config import  QDRANT_HOST, QDRANT_PORT

from services.utils.vector_db import QdrantStorage



# Ollama is expected to run as its own service (see docker-compose.yml) or locally.

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

    "You need to generate markdown form answers only not in any other form "
    
    "## Section types"
    """
    - **Title**: The main title of the document. Use exactly one at the top.
    - **Heading**: Major section headings (equivalent to ##).
    - **Subtitle**: Sub-headings (equivalent to ###).
    - **Paragraph**: Standard prose text. Synthesize and write coherent paragraphs answering the user prompt.
    - **BulletList**: A markdown-formatted bullet list (`- item`). Use for key takeaways, extracted rules, or unordered lists.
    - **NumberedList**: A markdown-formatted numbered list (`1. item`). Use for sequential steps or ranked items.
    - **Table**: A markdown table (must include header row and separators). Use for structured data comparison.
    - **BlockQuote**: A markdown quote (`> quote`). Use for citing important rules, legal text, or emphasis.
    - **CodeBlock**: A markdown code block (``` ... ```). Use for code snippets or raw technical data.
    - **Section**: Any other miscellaneous markdown text."""


    "Do not add information that is not present in the context. "
    "If the context does not contain enough information, say so plainly "
    "instead of guessing. "

    "When you use information from the context, cite it using its "
    "[n] marker."
)



class RagState(TypedDict, total=False):
    collection: str
    query: str
    rerank_limit: int
    chunks: List[Dict[str, Any]]
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
        vector_db = QdrantStorage(host=QDRANT_HOST, port=QDRANT_PORT)
        chunks = vector_db.query(query, collection=collection, limit=rerank_limit)
    except Exception as e:
        print(f"[RAG] Search error in search_node: {e}")
        chunks = []

    state["chunks"] = chunks

    context_blocks = []
    sources = []

    for i, chunk in enumerate(chunks, start=1):
        text = chunk.get("text", "")
        context_blocks.append(f"[{i}] {text}")
        metadata = chunk.get("metadata", {})
        score_val = float(chunk.get("score", 0.0))
        
        # Match the old fields
        if "score" not in metadata:
            metadata["score"] = score_val
        if "rerank_score" not in metadata:
            metadata["rerank_score"] = score_val
        if "document_id" not in metadata and "id" in chunk:
            metadata["document_id"] = chunk["id"]

        sources.append({
            "marker": i,
            "text": text,
            "score": score_val,
            "rerank_score": score_val,
            **metadata,
        })

    state["context"] = "\n\n".join(context_blocks)
    state["sources"] = sources

    return state


def generate_node(state: RagState) -> RagState:
    """Generate answer from context with citations or return clean fallback if empty."""
    if not state.get("chunks"):
        state["answer"] = (
            "RAG Agent couldn't find anything relevant in the knowledge base for that question."
        )
        return state
    print("[RAG] Generating Summary")    

    context_len = len(state.get("context", ""))
    if context_len > 0:
        num_ctx = max(2048, (context_len//4) + 1000)

    llm = ChatOllama(model=RAG_MODEL,
                     temperature=RAG_TEMP,
                     top_k=RAG_TOP_K,
                     top_p=RAG_TOP_P,
                     num_ctx=num_ctx,
                     repeat_penalty=RAG_REPEAT_PENALTY)

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
        print(response)
    except Exception as e:
        print(f"[RAG] Generation error in generate_node: {e}")
        state["answer"] = f"Unable to generate response from model: {e}"

    print("[RAG] RAG Search END")
    return state


def build_rag_agent():
    """Build and compile the LangGraph RAG workflow."""
    graph = StateGraph(RagState)
    graph.add_node("search", search_node)
    graph.add_node("generate", generate_node)

    graph.add_edge(START, "search")
    graph.add_edge("search", "generate")
    graph.add_edge("generate", END)

    return graph.compile()


# Compiled once at import time and reused across requests.
_agent = build_rag_agent()
rag_graph = _agent  # Backward compatibility alias




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

            no_results = (
                not chunks
                or not context
                or "couldn't find anything relevant" in answer.lower()
            )

            return AgentResponse(
                agent="rag",
                status="no_results" if no_results else "success",
                content=answer,
                search_results=final_state["answer"] 
            )
        except Exception as e:
            print(f"[RAG] Error in RAGAgent.run: {e}")
            return AgentResponse(
                agent="rag",
                status="error",
                content="An error occurred while searching the knowledge base.",
                error=str(e),
            )
