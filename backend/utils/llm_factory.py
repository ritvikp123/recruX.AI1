import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend dir
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True) # Ensure it takes precedence over shell vars


def _norm_provider(v: str | None, default: str) -> str:
    return (v or default).strip().strip('"').strip("'").lower()

def _gemini_api_key() -> str | None:
    """
    Prefer GEMINI_API_KEY, but also accept GOOGLE_API_KEY for compatibility.
    """
    k = (os.getenv("GEMINI_API_KEY") or "").strip().strip('"').strip("'")
    if k:
        return k
    k = (os.getenv("GOOGLE_API_KEY") or "").strip().strip('"').strip("'")
    return k or None


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

    Supports Gemini, Ollama (default), or OpenAI.
    num_predict: optional max output tokens (speeds up short responses like scoring).
    client_kwargs: passed to the underlying client (Ollama httpx client via langchain-ollama).
    """
    provider = _norm_provider(os.getenv("LLM_PROVIDER"), "ollama")
    if provider in {"vertex", "vertexai", "google-vertex", "google_vertex"}:
        # Vertex AI uses Application Default Credentials (ADC) / service account.
        # No API key is required.
        from langchain_google_vertexai import ChatVertexAI

        project = (os.getenv("VERTEX_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT") or "").strip().strip('"').strip("'")
        location = (os.getenv("VERTEX_LOCATION") or os.getenv("GOOGLE_CLOUD_LOCATION") or "us-central1").strip().strip('"').strip("'")
        model = (os.getenv("VERTEX_MODEL") or "gemini-2.5-flash").strip().strip('"').strip("'")
        print(f"[LLM LOG] Provider=vertex Model={model} Location={location} Project={project or '(adc)'}")
        kwargs: dict = {"model_name": model, "temperature": temperature, "location": location}
        if project:
            kwargs["project"] = project
        # ChatVertexAI uses max_output_tokens
        if num_predict is not None:
            kwargs["max_output_tokens"] = int(num_predict)
        return ChatVertexAI(**kwargs)
    if provider in {"gemini", "google", "google-genai", "google_genai"}:
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = _gemini_api_key()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) is required when LLM_PROVIDER=gemini")
        model = (os.getenv("GEMINI_MODEL") or os.getenv("GOOGLE_MODEL") or "gemini-2.5-flash").strip().strip('"').strip("'")
        print(f"[LLM LOG] Provider=gemini Model={model}")
        kwargs: dict = {"model": model, "temperature": temperature, "google_api_key": api_key}
        # ChatGoogleGenerativeAI uses max_output_tokens
        if num_predict is not None:
            kwargs["max_output_tokens"] = int(num_predict)
        return ChatGoogleGenerativeAI(**kwargs)
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
    if provider in {"vertex", "vertexai", "google-vertex", "google_vertex"}:
        from langchain_google_vertexai import ChatVertexAI

        project = (os.getenv("VERTEX_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT") or "").strip().strip('"').strip("'")
        location = (os.getenv("VERTEX_LOCATION") or os.getenv("GOOGLE_CLOUD_LOCATION") or "us-central1").strip().strip('"').strip("'")
        model = (os.getenv("VERTEX_MODEL") or "gemini-2.5-flash").strip().strip('"').strip("'")
        print(f"[LLM LOG] Provider=vertex Model={model} (prose) Location={location} Project={project or '(adc)'}")
        kwargs: dict = {"model_name": model, "temperature": temperature, "location": location}
        if project:
            kwargs["project"] = project
        if num_predict is not None:
            kwargs["max_output_tokens"] = int(num_predict)
        return ChatVertexAI(**kwargs)
    if provider in {"gemini", "google", "google-genai", "google_genai"}:
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = _gemini_api_key()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) is required when LLM_PROVIDER=gemini")
        model = (os.getenv("GEMINI_MODEL") or os.getenv("GOOGLE_MODEL") or "gemini-2.5-flash").strip().strip('"').strip("'")
        print(f"[LLM LOG] Provider=gemini Model={model} (prose)")
        kwargs: dict = {"model": model, "temperature": temperature, "google_api_key": api_key}
        if num_predict is not None:
            kwargs["max_output_tokens"] = int(num_predict)
        return ChatGoogleGenerativeAI(**kwargs)
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

    NOTE: Your pgvector columns are `Vector(768)` in `utils/database.py`. If you change embedding
    model dimensions, you must migrate the DB and re-embed existing rows.
    """
    provider = _norm_provider(os.getenv("EMBEDDINGS_PROVIDER"), "ollama")
    if provider == "dummy":
        print("[LLM LOG] Embeddings=dummy dims=1536")
        return _DummyEmbeddings(dims=1536)
    if provider in {"vertex", "vertexai", "google-vertex", "google_vertex"}:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        project = (os.getenv("VERTEX_PROJECT") or os.getenv("GOOGLE_CLOUD_PROJECT") or "").strip().strip('"').strip("'")
        location = (os.getenv("VERTEX_LOCATION") or os.getenv("GOOGLE_CLOUD_LOCATION") or "us-central1").strip().strip('"').strip("'")
        model = (os.getenv("VERTEX_EMBED_MODEL") or "text-embedding-004").strip().strip('"').strip("'")
        print(f"[LLM LOG] Embeddings=vertex model={model} Location={location} Project={project or '(adc)'}")
        # GoogleGenerativeAIEmbeddings auto-detects ADC on Cloud Run (no API key needed)
        kwargs: dict = {"model": f"models/{model}"}
        if project:
            kwargs["project"] = project
        return GoogleGenerativeAIEmbeddings(**kwargs)
    if provider in {"gemini", "google", "google-genai", "google_genai"}:
        # Only enable if you explicitly set this; otherwise default stays Ollama/dummy.
        from langchain_google_genai import GoogleGenerativeAIEmbeddings

        api_key = _gemini_api_key()
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY (or GOOGLE_API_KEY) is required when EMBEDDINGS_PROVIDER=gemini")
        model = (os.getenv("GEMINI_EMBED_MODEL") or "text-embedding-004").strip().strip('"').strip("'")
        print(f"[LLM LOG] Embeddings=gemini model={model}")
        return GoogleGenerativeAIEmbeddings(model=model, google_api_key=api_key)
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
