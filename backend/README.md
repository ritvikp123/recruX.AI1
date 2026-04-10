# Recruix.AI Backend - AI Agent Orchestration (Local Ollama)

This is the AI-driven core of Recruix.AI. It uses a **Multi-Agent Architecture** built on **LangGraph** to automate resume evaluation and job matching using local models.

## 🤖 Agent Architecture

The system is split into three primary agents that can operate independently or as part of a structured graph.

### 1. Resume Agent (`agents/resume_agent.py`)
- **Input**: Raw text from PDF or DOCX.
- **Processing**: Uses **Ollama (gemma:2b)** to perform deep semantic analysis and structured data extraction.
- **Output**: 
  - `skills`: A refined list of technical/soft skills.
  - `ats_score`: A calculated score indicating how well the resume is optimized for parsing systems.
- **Standalone usage**: Accessible via `/api/resume/parse`.

### 2. Job Search Agent (`agents/job_search_agent.py`)
- **Input**: Skills list and desired Role Name.
- **Processing**: Runs local **RAG retrieval** over your own indexed job documents in PostgreSQL + pgvector.
- **Output**: A list of recently matching jobs with titles, descriptions, and direct links.
- **Standalone usage**: Accessible via `/api/jobs/search`.

### 3. Job Match Score Agent (`agents/job_match_agent.py`)
- **Input**: Parsed resume text and specific Job Descriptions.
- **Processing**: Performs an LLM comparison (**Ollama**) between the candidate's profile and the JD requirements.
- **Output**: A percentage score (0-100) and specific human-readable reasoning for the match.
- **Standalone usage**: Accessible via `/api/jobs/score`.

---

## ⛓️ Orchestration (LangGraph)
The agents are wired together using **LangGraph** in `agents/graph.py`. The graph defines a stateful workflow:
1. **Node 1**: Parse Resume -> 2. **Node 2**: Search for matching Jobs -> 3. **Node 3**: Score each job.

---

## 🛠️ Installation & Setup

### Requirements
- Python 3.12+ (tested on 3.14)
- `pip install -r requirements.txt`
- **Ollama** running locally.

### Environment Variables
Create a `.env` file in the `backend/` directory:
```env
OLLAMA_MODEL="gemma:2b"
OLLAMA_EMBED_MODEL="nomic-embed-text"
OLLAMA_BASE_URL="http://localhost:11434"
DATABASE_URL="postgresql://postgres:password@localhost:5432/Recrux_VecDB_Dev"
```

### Running the Server
```bash
python -m uvicorn main:app --reload --port 8001
```

---

## 📡 API Documentation
Once the server is running, visit:
- **Swagger UI**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **ReDoc**: [http://localhost:8001/redoc](http://localhost:8001/redoc)

---

## 📦 Core Dependencies
- **FastAPI**: High-performance web framework.
- **LangGraph & LangChain**: For agent coordination and LLM management.
- **Langchain-Ollama**: Access to local Ollama models.
- **Pgvector**: Vector search extension for PostgreSQL.
- **PyMuPDF & python-docx**: Robust document parsing.
