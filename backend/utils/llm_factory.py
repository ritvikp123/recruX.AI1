import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend dir so it's found when uvicorn runs from any cwd
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

def get_llm(temperature=0.1):
    """
    Factory function to get the configured LLM based on .env.

    Ollama-only configuration.
    """
    from langchain_ollama import ChatOllama

    model = (os.getenv("OLLAMA_MODEL") or "gemma:2b").strip().strip('"').strip("'")
    base_url = (os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").strip().strip('"').strip("'").rstrip("/")
    # Disable streaming to avoid ngrok/proxy timeouts for resume_agent
    return ChatOllama(model=model, temperature=temperature, base_url=base_url, streaming=False)

def get_embeddings():
    """
    Factory function to get the configured Embeddings based on .env.

    Ollama-only configuration.
    """
    from langchain_ollama import OllamaEmbeddings

    model = (os.getenv("OLLAMA_EMBED_MODEL") or "nomic-embed-text").strip().strip('"').strip("'")
    base_url = (os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").strip().strip('"').strip("'").rstrip("/")
    return OllamaEmbeddings(model=model, base_url=base_url)
