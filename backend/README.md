# Recrux.AI Backend - AI Agent Orchestration

This is the AI-driven core of Recrux.AI. It uses a **Multi-Agent Architecture** built on **LangGraph** to automate the process of resume evaluation and job matching.

## 🤖 Agent Architecture

The system is split into three primary agents that can operate independently or as part of a structured graph.

### 1. Resume Agent (`agents/resume_agent.py`)
- **Input**: Raw text from PDF or DOCX.
- **Processing**: Uses **Gemini 3 Flash Preview** to perform deep semantic analysis.
- **Output**: 
  - `skills`: A refined list of technical/soft skills.
  - `ats_score`: A calculated score indicating how well the resume is optimized for parsing systems.
- **Standalone usage**: Accessible via `/api/resume/parse`.

### 2. Job Search Agent (`agents/job_search_agent.py`)
- **Input**: Skills list and desired Role Name.
- **Processing**: Currently simulates a web search by retrieving high-quality job listings from `utils/dummy_jobs.json`.
- **Output**: A list of recently matching jobs with titles, descriptions, and direct links.
- **Standalone usage**: Accessible via `/api/jobs/search`.

### 3. Job Match Score Agent (`agents/job_match_agent.py`)
- **Input**: Parsed resume text and specific Job Descriptions.
- **Processing**: Performs an LLM comparison (Gemini) between the candidate's profile and the JD requirements.
- **Output**: A percentage score (0-100) and specific human-readable reasoning for the match.
- **Standalone usage**: Accessible via `/api/jobs/score`.

---

## ⛓️ Orchestration (LangGraph)
The agents are wired together using **LangGraph** in `agents/graph.py`. The graph defines a stateful workflow:
1. **Node 1**: Parse Resume -> 2. **Node 2**: Search for matching Jobs -> 3. **Node 3**: Score each job.

This ensures a seamless flow of data where the output of the Resume Agent directly informs the Search and Scoring agents.

---

## 🛠️ Installation & Setup

### Requirements
- Python 3.10+
- `pip install -r requirements.txt`

### Environment Variables
Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_google_ai_studio_key
```

### Running the Server
```bash
uvicorn main:app --reload
```
The server will start at `http://127.0.0.1:8000`.

---

## 📡 API Documentation
Once the server is running, visit:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 📦 Core Dependencies
- **FastAPI**: High-performance web framework.
- **LangGraph & LangChain**: For agent coordination and LLM management.
- **Google Generative AI**: Access to Gemini 3 Flash.
- **PyMuPDF & python-docx**: Robust document parsing.
