import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
project_root = Path(__file__).resolve().parent.parent.parent
env_path = project_root / ".env"
load_dotenv(env_path)

# Config values
LLM_MODEL = os.getenv("LLM_MODEL", "qwen3:8b")
ROUTER_MODEL = os.getenv("ROUTER_MODEL", "qwen3:1.7b")
DOC_GEN_MODEL = os.getenv("DOC_GEN_MODEL", "qwen2.5-coder:7b")

LLM_REASONING = os.getenv("LLM_REASONING", "false").lower() == "true"

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
