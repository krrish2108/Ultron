from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, BaseMessage
llm = ChatOllama(model="qwen2.5-coder:3b", temperature=0.3, num_ctx=1024)


prompts: list[BaseMessage] = [
    SystemMessage(content="You are a helpful assistant that helps in python code generation"),
    SystemMessage(content="dont give me text response only give me code response"),
]

prompt = HumanMessage(content="Write a python function to calculate the factorial of a number using recursion.")

print(llm.invoke(prompts + [prompt]).content)