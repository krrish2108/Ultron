from services.agents.models import AgentResponse
from pathlib import Path
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from services.utils.config import QDRANT_HOST, QDRANT_PORT, LLM_MODEL
from services.utils.vector_db import QdrantStorage

# Define the search tool
def search_knowledge_base(query: str) -> str:
    """
    Search the knowledge base using Qdrant vector database.
    Returns relevant document chunks.
    """
    vector_db = QdrantStorage(host=QDRANT_HOST, port=QDRANT_PORT)
    results = vector_db.query(query, collection="documents", limit=5)
    
    if not results:
        return "No relevant documents found in the knowledge base."
    
    formatted_results = []
    for i, result in enumerate(results, 1):
        formatted_results.append(
            f"--- Result {i} (score: {result['score']:.3f}) ---\n{result['text']}\n"
        )
    
    return "\n".join(formatted_results)


class AgentState(TypedDict):
    """State for the RAG agent."""
    query: str
    search_results: str
    answer: str

# Create the graph
workflow = StateGraph(AgentState)

def write_context_node(state: AgentState) -> dict:
    """Write search results to context.md"""
    search_results = state.get("search_results", "")
    project_root = Path(__file__).resolve().parent.parent.parent
    context_path = project_root / "data" / "context.md"
    context_path.write_text(search_results, encoding="utf-8")
    print(f"[RAG] Wrote {len(search_results)} chars to context.md")
    return {}


def search_node(state: AgentState) -> dict:
    """Search node that queries the vector database."""
    query = state.get("query", "")
    print(f"[RAG] RAG searching for: {query}")
    search_results = search_knowledge_base(query)
    print(f"[RAG] Found {len(search_results)} chars of results")
    return {"search_results": search_results}


def agent_node(state: AgentState) -> dict:
    """Agent node that generates answer from search results."""
    query = state.get("query", "")
    search_results = state.get("search_results", "")
    
    llm = ChatOllama(model=LLM_MODEL, num_ctx=int(len(search_results) + 500))
    
    system_prompt = """You are a helpful assistant that answers questions based on the provided search results.
If the search results contain relevant information, use them to answer the question.
If no relevant information is found, say so clearly."""
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Question: {query}\n\nSearch Results:\n{search_results}\n\nProvide a helpful answer based on the search results.")
    ])
    
    print(f"[RAG] RAG Search END")    

    return {"answer": response.content}


# Add nodes to graph
workflow.add_node("search", search_node)
workflow.add_node("write_context", write_context_node)
workflow.add_node("agent", agent_node)

# Set entry point
workflow.set_entry_point("search")

# Add edges
workflow.add_edge("search", "write_context")
workflow.add_edge("write_context", "agent")
workflow.add_edge("agent", END)
# Compile the graph
rag_graph = workflow.compile()


class RAGAgent:
    """
    RAG Agent: Uses LangGraph with VectorDatabase to search and answer questions.
    """
    
    def __init__(self, collection: str = "documents"):
        self.collection = collection
        self.graph = rag_graph
    
    async def run(self, query: str) -> AgentResponse:
        """
        Search the knowledge base and return answer using LangGraph.
        """
        try:
            initial_state: AgentState = {
                "query": query,
                "search_results": "",
                "answer": ""
            }

            result = await self.graph.ainvoke(initial_state)

            search_results = result.get("search_results", "")
            answer = result.get("answer", "")

            no_results = (
                not search_results
                or "No relevant documents found" in search_results
            )

            return AgentResponse(
                agent="rag",
                status="no_results" if no_results else "success",
                content=answer,
                search_results=search_results,
            )
        except Exception as e:
            print(f"[RAG] Error: {e}")
            return AgentResponse(
                agent="rag",
                status="error",
                content="An error occurred while searching the knowledge base.",
                error=str(e),
            )
