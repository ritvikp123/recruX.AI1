import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend dir
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True) # Ensure it takes precedence over shell vars


def _norm_provider(v: str | None, default: str) -> str:
    return (v or default).strip().strip('"').strip("'").lower()


class _DummyEmbeddings:
    """Fallback embeddings to keep pgvector flows alive without a real embed model."""

    def __init__(self, dims: int = 1536):
        self.dims = int(dims)

    def embed_query(self, text: str):
        return [0.0] * self.dims

    def embed_documents(self, texts):
        return [[0.0] * self.dims for _ in (texts or [])]

def get_llm(temperature=0.1, num_predict=None, client_kwargs=None):
    """
    Factory function to get the configured LLM based on .env.

    Supports Ollama (default) or OpenAI.
    num_predict: optional max output tokens (speeds up short responses like scoring).
    client_kwargs: passed to the underlying client (Ollama httpx client via langchain-ollama).
    """
    provider = _norm_provider(os.getenv("LLM_PROVIDER"), "ollama")
    if provider == "openai":
        from langchain_openai import ChatOpenAI

        model = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip().strip('"').strip("'")
        print(f"[LLM LOG] Provider=openai Model={model}")
        kwargs: dict = {"model": model, "temperature": temperature}
        # ChatOpenAI uses max_tokens, not num_predict
        if num_predict is not None:
            kwargs["max_tokens"] = int(num_predict)
        return ChatOpenAI(**kwargs)

    # Default: ollama
    from langchain_ollama import ChatOllama

    model = (os.getenv("OLLAMA_MODEL") or "llama3.1:8b").strip().strip('"').strip("'")
    base_url = (os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").strip().strip('"').strip("'").rstrip("/")
    print(f"[LLM LOG] Loaded Model: {model} from URL: {base_url}")
    kwargs = {"model": model, "temperature": temperature, "base_url": base_url, "format": "json"}
    if num_predict is not None:
        kwargs["num_predict"] = num_predict
    if client_kwargs:
        kwargs["client_kwargs"] = client_kwargs
    return ChatOllama(**kwargs)


def get_llm_prose(temperature=0.35, num_predict=None, client_kwargs=None):
    """
    Plain-text generation (no JSON mode). Use for resume rewrite, gap explanations, narrative chat.
    """
    provider = _norm_provider(os.getenv("LLM_PROVIDER"), "ollama")
    if provider == "openai":
        from langchain_openai import ChatOpenAI

        model = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip().strip('"').strip("'")
        print(f"[LLM LOG] Provider=openai Model={model} (prose)")
        kwargs: dict = {"model": model, "temperature": temperature}
        if num_predict is not None:
            kwargs["max_tokens"] = int(num_predict)
        return ChatOpenAI(**kwargs)

    # Default: ollama
    from langchain_ollama import ChatOllama

    model = (os.getenv("OLLAMA_MODEL") or "llama3.1:8b").strip().strip('"').strip("'")
    base_url = (os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").strip().strip('"').strip("'").rstrip("/")
    print(f"[LLM LOG] Loaded Model (prose): {model} from URL: {base_url}")
    kwargs: dict = {"model": model, "temperature": temperature, "base_url": base_url}
    if num_predict is not None:
        kwargs["num_predict"] = num_predict
    if client_kwargs:
        kwargs["client_kwargs"] = client_kwargs
    return ChatOllama(**kwargs)


def get_embeddings():
    """
    Factory function to get the configured Embeddings based on .env.

    Supports Ollama (default), OpenAI, or dummy (for Railway deploys without embeddings).

    NOTE: Your pgvector columns are `Vector(768)`. If you switch to OpenAI embeddings, you must
    migrate the DB dimensions and re-embed existing rows.
    """
    provider = _norm_provider(os.getenv("EMBEDDINGS_PROVIDER"), "ollama")
    if provider == "dummy":
        print("[LLM LOG] Embeddings=dummy dims=1536")
        return _DummyEmbeddings(dims=1536)
    if provider == "openai":
        from langchain_openai import OpenAIEmbeddings

        model = (os.getenv("OPENAI_EMBED_MODEL") or "text-embedding-3-small").strip().strip('"').strip("'")
        print(f"[LLM LOG] Embeddings=openai model={model}")
        return OpenAIEmbeddings(model=model)

    # Default: ollama
    from langchain_ollama import OllamaEmbeddings

    model = (os.getenv("OLLAMA_EMBED_MODEL") or "nomic-embed-text").strip().strip('"').strip("'")
    base_url = (os.getenv("OLLAMA_BASE_URL") or "http://localhost:11434").strip().strip('"').strip("'").rstrip("/")
    print(f"[LLM LOG] Loaded Embed: {model} from URL: {base_url}")
    return OllamaEmbeddings(model=model, base_url=base_url)
