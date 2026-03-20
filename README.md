# Recruix.AI - Local AI-Powered Recruitment Engine 🚀

Recruix.AI is a high-performance recruitment platform that uses **local LLMs** via **Ollama** and **pgvector** to automate the path from resume upload to job matching — with 100% privacy.

---

## 🏗️ Architecture Stack

- **Backend**: Python 3.12+ (FastAPI, LangChain, LangGraph)
- **Frontend**: React 18+ (TypeScript, Tailwind, Vite)
- **AI Local Engine**: [Ollama](https://ollama.com/) (Models: `gemma:2b`, `nomic-embed-text`)
- **Intelligence Layer**: Semantic search via **pgvector** (Postgres)
- **Vector Dimension**: Optimized for **768** dimensions.

---

## 🛠️ Getting Started

### 1. External Prerequisites

#### **Ollama Setup**
1.  **Download & Install**: [Ollama](https://ollama.com/).
2.  **Pull Required Models**:
    Open your terminal and run:
    ```bash
    ollama pull gemma:2b
    ollama pull nomic-embed-text
    ```
3.  Ensure Ollama is running in the background.

#### **PostgreSQL Setup**
- Ensure you have a local PostgreSQL instance running.
- Enable `pgvector` if not already installed (`CREATE EXTENSION IF NOT EXISTS vector;`).
- Create a database called `Recrux_VecDB_Dev`.

---

### 2. Backend Installation (Port 8001)

1.  Navigate to the backend folder:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure `.env`**: Create a file named `.env` in `backend/` and add:
    ```env
    OLLAMA_MODEL="gemma:2b"
    OLLAMA_EMBED_MODEL="nomic-embed-text"
    OLLAMA_BASE_URL="http://localhost:11434"
    DATABASE_URL="postgresql://postgres:password@localhost:5432/Recrux_VecDB_Dev"
    ```
5.  **Initialize Database**: This will create the `Profiles` and `Jobs` tables with the correct vector dimensions (768):
    ```bash
    python reset_db.py
    ```
6.  **Run the Server**:
    ```bash
    python -m uvicorn main:app --reload --port 8001
    ```

---

### 3. Frontend Installation

1.  Navigate to the frontend folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Configure `.env`**: Create a file named `.env` in `frontend/` and add:
    ```env
    VITE_API_URL=http://localhost:8001
    # Add your Supabase keys if needed (for auth)
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    ```
4.  **Launch Dashboard**:
    ```bash
    npm run dev
    ```

---

## 📖 Using the App

1.  Visit **`http://localhost:5173`**.
2.  Upload a resume (`.pdf` or `.docx`). The AI will extract your skills locally.
3.  Search for jobs. The system will calculate match scores using the semantic distance between your profile and job descriptions.
4.  View results in the Dashboard.

---

## 🧪 Verification & Debugging

- **Swagger Documentation**: Explore and test endpoints at [http://localhost:8001/docs](http://localhost:8001/docs).
- **Test Script**: Run `python test_full_agent.py` in the backend folder to verify the connection between LLM and Postgres instantly.
- **Python 3.14 Notes**: If using Python 3.14+, ignore Pydantic V1 warnings. The code uses lazy-loaders to ensure stability on experimental versions.

---

## 📂 Project Structure

- `backend/agents/`: LLM Agent definitions (Resume, Search, Match).
- `backend/routers/`: FastAPI routes and orchestrators.
- `backend/utils/`: Database helpers and file parsers.
- `frontend/src/ui/`: React components and dashboard pages.
