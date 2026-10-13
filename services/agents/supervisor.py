from pydantic import BaseModel
from typing_extensions import Literal

from langchain_ollama import ChatOllama

from services.utils.config import LLM_REASONING, ROUTER_MODEL
from services.agents.models import AgentResponse


class RouteDecision(BaseModel):
    intent: Literal["rag", "doc_gen", "chat", "mcp_tool"]
    reasoning: str


_ROUTER_SYSTEM_PROMPT = """\
You are a message router. Classify the user's message into exactly one intent.

Intents:
- "rag": The user asks a question about documents, wants information lookup, or needs facts from uploaded content.
- "doc_gen": The user wants to create, generate, export, or produce a document, report, summary, or presentation.
- "mcp_tool": The user asks to read telemetry, check sensor values (pressure, PSI, RPM, vibration, temperature, SCADA faults, logs), query industrial database, or invoke an MCP connector/tool.
- "chat": General conversation, greetings, or anything not requiring document search or generation.

Respond with your classification. When uncertain between rag and chat, prefer rag."""


class Supervisor:
    """
    Routes user messages to RAG Agent, Doc Gen Agent, MCP Agent, or direct chat
    using LLM-based intent classification.
    """

    def __init__(self):
        self.llm = ChatOllama(
            model=ROUTER_MODEL,
            reasoning=LLM_REASONING,
            keep_alive='30m'
        )
        self.router = self.llm.with_structured_output(RouteDecision)
        self.rag_context = ""


    def _classify(self, message: str) -> RouteDecision:
        """Use the LLM to classify user intent with robust fallback."""
        from langchain_core.messages import SystemMessage, HumanMessage

        msg_lower = message.lower()
        # Fast-path for explicit industrial telemetry & MCP queries
        if any(k in msg_lower for k in ["pressure", "psi", "rpm", "vibration", "scada", "telemetry", "sensor", "mcp", "connector", "plc", "modbus", "opc"]):
            return RouteDecision(intent="mcp_tool", reasoning="Matched industrial sensor telemetry or MCP connector keyword.")

        try:
            response: RouteDecision = self.router.invoke([
                SystemMessage(content=_ROUTER_SYSTEM_PROMPT),
                HumanMessage(content=message),
            ])  # type: ignore[assignment]
            return response
        except Exception as e:
            print(f"[SUPERVISOR] Classification fallback due to: {e}")
            if any(k in msg_lower for k in ["generate", "create doc", "report", "presentation", "summary doc"]):
                return RouteDecision(intent="doc_gen", reasoning="Keyword heuristic matched doc generation")
            if any(k in msg_lower for k in ["search", "find", "what does", "document", "pdf", "file"]):
                return RouteDecision(intent="rag", reasoning="Keyword heuristic matched rag")
            return RouteDecision(intent="chat", reasoning="Default chat fallback")

    async def route(self, message: str, context: str = "", template_path: str | None = None) -> AgentResponse:
        """
        Classify intent via LLM, dispatch to the appropriate agent,
        and optionally chain a single follow-up step.
        """
        decision = self._classify(message)
        intent = decision.intent
        print(f"[SUPERVISOR] Intent: {intent} (reason: {decision.reasoning})")

        from services.utils.broadcaster import broadcaster
        import asyncio

        # Init graph structure
        nodes = [
            {"id": "super", "position": {"x": 250, "y": 0}, "data": {"label": "Supervisor", "status": "active", "detail": "Classifying intent..."}, "type": "ultron"},
            {"id": "rag", "position": {"x": 50, "y": 150}, "data": {"label": "RAG Agent", "status": "pending", "detail": "Pending"}, "type": "ultron"},
            {"id": "doc", "position": {"x": 250, "y": 150}, "data": {"label": "Doc Gen", "status": "pending", "detail": "Pending"}, "type": "ultron"},
            {"id": "mcp", "position": {"x": 450, "y": 150}, "data": {"label": "MCP Gateway", "status": "pending", "detail": "Pending"}, "type": "ultron"}
        ]
        edges = [
            {"id": "e-super-rag", "source": "super", "target": "rag", "animated": True, "style": {"stroke": "#ffffff50"}},
            {"id": "e-super-doc", "source": "super", "target": "doc", "animated": True, "style": {"stroke": "#ffffff50"}},
            {"id": "e-super-mcp", "source": "super", "target": "mcp", "animated": True, "style": {"stroke": "#ffffff50"}}
        ]
        asyncio.create_task(broadcaster.broadcast("graphInit", {"nodes": nodes, "edges": edges}))
        asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "super", "data": {"status": "done", "detail": f"Intent: {intent}"}}))

        from services.utils.broadcaster import broadcaster
        import asyncio
        asyncio.create_task(broadcaster.broadcast("routingLogic", {
            "taskType": intent,
            "selectedModel": getattr(self.llm, "model", "Llama-3-8B"),
            "reasoning": decision.reasoning
        }))
        asyncio.create_task(broadcaster.broadcast("agentTrace", f"> [PLAN] Analyzing intent..."))
        asyncio.create_task(broadcaster.broadcast("agentTrace", f"  Intent classified: {intent}"))

        response = await self._dispatch(intent, message, context, template_path)

        if intent == "rag" and response.status == "success":
            self.rag_context = response.content
            asyncio.create_task(broadcaster.broadcast("agentTrace", f"  Saved RAG summary to Supervisor state for subsequent document generation."))

        # One bounded follow-up: if the agent signals it needs one, honour it.
        if response.needs_followup and response.followup_hint == "doc_gen":
            print("[SUPERVISOR] Chaining follow-up: doc_gen")
            followup_context = response.search_results or ""
            response = await self._dispatch("doc_gen", message, followup_context, template_path)
            # Never chain further — return whatever we got.

        return response

    async def _dispatch(
        self, intent: str, message: str, context: str, template_path: str | None = None,
    ) -> AgentResponse:
        """Run the agent for the given intent and return its AgentResponse."""
        from services.utils.broadcaster import broadcaster
        import asyncio

        if intent == "rag":
            from services.agents.rag_agent import RAGAgent
            agent = RAGAgent()
            asyncio.create_task(broadcaster.broadcast("agentTrace", f"> [EXEC] Handing off to RAG Agent..."))
            asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "rag", "data": {"status": "active", "detail": "Retrieving context..."}}))
            res = await agent.run(message)
            asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "rag", "data": {"status": "done", "detail": "Completed"}}))
            return res

        elif intent == "doc_gen":
            from services.agents.doc_gen_agent import DocGenAgent
            agent = DocGenAgent()
            effective_context = context if context else self.rag_context
            asyncio.create_task(broadcaster.broadcast("agentTrace", f"> [EXEC] Handing off to DocGen Agent (Context len: {len(effective_context)} chars)..."))
            asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "doc", "data": {"status": "active", "detail": "Generating document..."}}))
            res = await agent.run(message, effective_context, template_path=template_path)
            asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "doc", "data": {"status": "done", "detail": "Completed"}}))
        elif intent == "mcp_tool":
            from services.agents.mcp_agent import mcp_agent
            asyncio.create_task(broadcaster.broadcast("agentTrace", f"> [EXEC] Handing off to Industrial MCP Agent..."))
            asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "mcp", "data": {"status": "active", "detail": "Executing MCP Tool..."}}))
            res = await mcp_agent.run(message)
            asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "mcp", "data": {"status": "done", "detail": "Tool Verified"}}))
            return res

        else:
            # General chat — no agent, just the LLM directly.
            try:
                # Fallback graph node if chat is selected
                asyncio.create_task(broadcaster.broadcast("graphInit", {
                    "nodes": [{"id": "chat", "position": {"x": 250, "y": 100}, "data": {"label": "Chat LLM", "status": "active", "detail": "Streaming response..."}, "type": "ultron"}], 
                    "edges": []
                }))
                llm_response = self.llm.invoke(message)
                asyncio.create_task(broadcaster.broadcast("graphNodeUpdate", {"id": "chat", "data": {"status": "done", "detail": "Done"}}))
                return AgentResponse(
                    agent="chat",
                    status="success",
                    content=str(llm_response.content),
                )
            except Exception as e:
                print(f"[SUPERVISOR] Chat error: {e}")
                return AgentResponse(
                    agent="chat",
                    status="error",
                    content="An error occurred during chat.",
                    error=str(e),
                )
