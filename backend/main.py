from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables FIRST before importing local modules that instantiate LLMs
load_dotenv()

from routers.agent_router import router as agent_router
from routers.auth_router import router as auth_router

app = FastAPI(
    title="Recrux.AI Agents Backend",
    description="Backend AI multi-agent architecture for Recrux.AI to parse resumes, find roles, and score matches.",
    version="1.0.0"
)

# CORS: dev origins + optional CORS_ORIGINS (comma-separated) for production, e.g.
# CORS_ORIGINS=https://www.yoursite.com,https://yoursite.com
def _normalize_cors_origin_token(raw: str) -> str:
    """Strip whitespace and stray quote chars (Cloud Console / .env often adds '...' or \"...\")."""
    o = raw.strip()
    prev = None
    while prev != o:
        prev = o
        o = o.strip().strip("'\"")
    return o


_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5181",
    "http://127.0.0.1:5181",
]
_extra_raw = os.getenv("CORS_ORIGINS", "")
# Whole value may be wrapped in quotes; then comma-separated origins.
_extra = _normalize_cors_origin_token(_extra_raw)
_parsed = [_normalize_cors_origin_token(o) for o in _extra.split(",") if _normalize_cors_origin_token(o)]
_origins = list(dict.fromkeys(_default_origins + _parsed))
if os.getenv("CORS_DEBUG", "").strip().lower() in ("1", "true", "yes"):
    print(f"[CORS] allow_origins={_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth_router, prefix="/api/auth")
app.include_router(agent_router, prefix="/api")

@app.get("/", tags=["Health"])
async def root():
    return {"message": "Recrux.AI Backend is running smoothly."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
