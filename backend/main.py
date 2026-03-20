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

# CORS for frontend (React + Vite on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5181",
        "http://127.0.0.1:5181",
    ],
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
