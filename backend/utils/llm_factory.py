import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend dir
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True) # Ensure it takes precedence over shell vars

def get_llm(temperature=0.1):
    """
    Factory function to get the configured LLM based on .env.

    Ollama-only configuration.
    """
    from langchain_ollama import ChatOllama

    model = (os.getenv("OLLAMA_MODEL") or "llama3.1:8b").strip().strip('"').strip("'")
    base_url = (os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").strip().strip('"').strip("'").rstrip("/")
    print(f"[LLM LOG] Loaded Model: {model} from URL: {base_url}")
    return ChatOllama(model=model, temperature=temperature, base_url=base_url, format="json")

def get_embeddings():
    """
    Factory function to get the configured Embeddings based on .env.

    Ollama-only configuration.
    """
    from langchain_ollama import OllamaEmbeddings

    model = (os.getenv("OLLAMA_EMBED_MODEL") or "nomic-embed-text").strip().strip('"').strip("'")
    base_url = (os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").strip().strip('"').strip("'").rstrip("/")
    print(f"[LLM LOG] Loaded Embed: {model} from URL: {base_url}")
    return OllamaEmbeddings(model=model, base_url=base_url)
