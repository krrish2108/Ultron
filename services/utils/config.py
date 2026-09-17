import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
project_root = Path(__file__).resolve().parent.parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

# Config values
ROUTER_MODEL = os.getenv("ROUTER_MODEL", "qwen3:1.7b")
ROUTER_TEMP = ...
ROUTER_TOP_K = ...
ROUTER_TOP_P = ...

DOC_GEN_MODEL = os.getenv("DOC_GEN_MODEL", "qwen2.5-coder:7b")
DOC_GEN_TEMP = float(os.getenv("DOC_GEN_TEMP", "0.2"))
DOC_GEN_TOP_K = int(os.getenv("DOC_GEN_TOP_K", "40"))
DOC_GEN_TOP_P = float(os.getenv("DOC_GEN_TOP_P", "0.9"))
DOC_GEN_REPEAT_PENALTY = float(os.getenv("DOC_GEN_REPEAT_PENALTY", "1.1"))

RAG_MODEL = os.getenv("RAG_MODEL", "qwen3:1.7b")
RAG_TEMP = 0.0
RAG_TOP_K = 40
RAG_TOP_P = 0.9
RAG_REPEAT_PENALTY = 1.1
LLM_REASONING = os.getenv("LLM_REASONING", "false").lower() == "true"

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")

class db_Settings():
    URL = os.getenv("DATABASE_URL")
