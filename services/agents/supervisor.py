from pydantic import BaseModel
from typing_extensions import Literal

from langchain_ollama import ChatOllama

from services.utils.config import LLM_REASONING, ROUTER_MODEL
from services.agents.models import AgentResponse


class RouteDecision(BaseModel):
    intent: Literal["rag", "doc_gen", "chat"]
    reasoning: str


_ROUTER_SYSTEM_PROMPT = """\
You are a message router. Classify the user's message into exactly one intent.

Intents:
- "rag": The user asks a question about documents, wants information lookup, or needs facts from uploaded content.
- "doc_gen": The user wants to create, generate, export, or produce a document, report, summary, or presentation.
- "chat": General conversation, greetings, or anything not requiring document search or generation.

Respond with your classification. When uncertain between rag and chat, prefer rag."""


class Supervisor:
    """
    Routes user messages to RAG Agent, Doc Gen Agent, or direct chat
    using LLM-based intent classification.
    """

    def __init__(self):
        self.llm = ChatOllama(
            model=ROUTER_MODEL,
            reasoning=LLM_REASONING,
        )
        self.router = self.llm.with_structured_output(RouteDecision)

    def _classify(self, message: str) -> RouteDecision:
        """Use the LLM to classify user intent."""
        from langchain_core.messages import SystemMessage, HumanMessage

        response: RouteDecision = self.router.invoke([
            SystemMessage(content=_ROUTER_SYSTEM_PROMPT),
            HumanMessage(content=message),
        ])  # type: ignore[assignment]
        return response

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
        asyncio.create_task(broadcaster.broadcast("routingLogic", {
            "taskType": intent,
            "selectedModel": getattr(self.llm, "model", "Llama-3-8B"),
            "reasoning": decision.reasoning
        }))
        asyncio.create_task(broadcaster.broadcast("agentTrace", f"> [PLAN] Analyzing intent..."))
        asyncio.create_task(broadcaster.broadcast("agentTrace", f"  Intent classified: {intent}"))

        response = await self._dispatch(intent, message, context, template_path)

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
        if intent == "rag":
            from services.agents.rag_agent import RAGAgent
            agent = RAGAgent()
            return await agent.run(message)

        elif intent == "doc_gen":
            from services.agents.doc_gen_agent import DocGenAgent
            agent = DocGenAgent()
            return await agent.run(message, context, template_path=template_path)

        else:
            # General chat — no agent, just the LLM directly.
            try:
                llm_response = self.llm.invoke(message)
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
