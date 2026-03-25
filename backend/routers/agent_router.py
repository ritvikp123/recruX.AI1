import json
import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Response
from typing import List, Optional
from pydantic import BaseModel
from models.schemas import ResumeParseOutput, ResumeExtractOutput, JobSearchOutput, JobMatchScoreOutput, GraphWorkflowOutput, ChatRequest, ChatResponse
from agents.graph import app_graph
from agents.chat_agent import ask_assistant

from agents.resume_agent import process_resume
from agents.job_search_agent import search_jobs
from agents.job_match_agent import score_jobs
from utils.file_parser import extract_text_from_file
from utils.database import save_profile, get_profile
from utils.llm_factory import get_llm

router = APIRouter()


class RoadmapRequest(BaseModel):
    goal: str
    resume_text: str = ""


def _normalize_roadmap_payload(payload: dict, fallback_goal: str) -> dict:
    """
    Normalize LLM JSON into the frontend-expected roadmap shape.
    """
    phases_in = payload.get("phases")
    if not isinstance(phases_in, list):
        phases_in = []

    normalized_phases = []
    for idx, phase in enumerate(phases_in, start=1):
        if not isinstance(phase, dict):
            continue
        status = str(phase.get("status", "upcoming")).lower()
        if status not in {"complete", "active", "upcoming"}:
            status = "upcoming"

        skills_in = phase.get("skills")
        if not isinstance(skills_in, list):
            skills_in = []
        skills = []
        for skill in skills_in:
            if not isinstance(skill, dict):
                continue
            skills.append(
                {
                    "name": str(skill.get("name", "")).strip(),
                    "user_has": bool(skill.get("user_has", False)),
                }
            )
        skills = [s for s in skills if s["name"]]

        resources_in = phase.get("resources")
        if not isinstance(resources_in, list):
            resources_in = []
        resources = []
        for resource in resources_in:
            if not isinstance(resource, dict):
                continue
            label = str(resource.get("label", "")).strip()
            url = str(resource.get("url", "")).strip()
            if label and url:
                resources.append({"label": label, "url": url})

        normalized_phases.append(
            {
                "number": int(phase.get("number", idx)) if str(phase.get("number", "")).strip() else idx,
                "title": str(phase.get("title", f"Phase {idx}")).strip() or f"Phase {idx}",
                "status": status,
                "duration_weeks": int(phase.get("duration_weeks", 4)) if str(phase.get("duration_weeks", "")).strip() else 4,
                "description": str(phase.get("description", "")).strip() or "No description provided.",
                "skills": skills,
                "resources": resources if status == "active" else [],
            }
        )

    readiness = payload.get("readiness_percent", 0)
    skills_matched = payload.get("skills_matched", 0)
    skills_total = payload.get("skills_total", 0)
    estimated_months = payload.get("estimated_months", 0)

    def _as_int(value, default=0):
        try:
            return int(value)
        except Exception:
            return default

    return {
        "goal": str(payload.get("goal", fallback_goal)).strip() or fallback_goal,
        "readiness_percent": max(0, min(100, _as_int(readiness, 0))),
        "skills_matched": max(0, _as_int(skills_matched, 0)),
        "skills_total": max(0, _as_int(skills_total, 0)),
        "estimated_months": max(0, _as_int(estimated_months, 0)),
        "phases": normalized_phases,
    }


def _extract_resume_skill_hits(resume_text: str) -> List[str]:
    """Keyword hits from resume (same lexicon as /resume/extract)."""
    text_lower = (resume_text or "").lower()
    hits = [kw for kw in _SKILL_KEYWORDS if kw in text_lower]
    return list(dict.fromkeys(hits))


def _fallback_roadmap_payload(goal: str, resume_text: str) -> dict:
    """
    Deterministic 3-phase roadmap when the LLM returns no usable phases.
    """
    g = (goal or "").strip() or "your target role"
    has_resume = bool((resume_text or "").strip())
    hits = _extract_resume_skill_hits(resume_text) if has_resume else []
    if len(hits) >= 2:
        statuses = ("complete", "active", "upcoming")
    else:
        statuses = ("active", "upcoming", "upcoming")

    skills_found = [{"name": h.title(), "user_has": True} for h in hits[:8]]
    if not skills_found:
        skills_found = (
            [{"name": "Starting toward this goal", "user_has": True}]
            if not has_resume
            else [{"name": "Transferable experience", "user_has": True}]
        )

    gap = [
        {"name": f"Role-specific tools for {g}", "user_has": False},
        {"name": "End-to-end project delivery", "user_has": False},
    ]
    capstone = [
        {"name": "Polished resume & online presence", "user_has": False},
        {"name": "Interview practice & negotiation", "user_has": False},
    ]

    default_resources = [
        {"label": "freeCodeCamp", "url": "https://www.freecodecamp.org"},
        {"label": "Coursera", "url": "https://www.coursera.org"},
        {"label": "LinkedIn Learning", "url": "https://www.linkedin.com/learning/"},
    ]

    phase1_desc = (
        f"Map typical prerequisites and a learning path toward {g}."
        if not has_resume
        else f"Connect what you already have on your resume to what {g} roles expect."
    )
    phases_raw = [
        {
            "number": 1,
            "title": "Align your foundation",
            "status": statuses[0],
            "duration_weeks": 4,
            "description": phase1_desc,
            "skills": skills_found[:6],
            "resources": default_resources if statuses[0] == "active" else [],
        },
        {
            "number": 2,
            "title": "Build proof",
            "status": statuses[1],
            "duration_weeks": 6,
            "description": f"Ship projects or contributions that demonstrate readiness for {g}.",
            "skills": gap + skills_found[:2],
            "resources": default_resources if statuses[1] == "active" else [],
        },
        {
            "number": 3,
            "title": "Interview & land roles",
            "status": statuses[2],
            "duration_weeks": 4,
            "description": "Prepare for screens, refine your story, and apply consistently.",
            "skills": capstone,
            "resources": default_resources if statuses[2] == "active" else [],
        },
    ]

    all_skills = []
    for p in phases_raw:
        all_skills.extend(p["skills"])
    matched = sum(1 for s in all_skills if s.get("user_has"))
    total = max(len(all_skills), 1)
    readiness = min(100, int(round(100 * matched / total)))
    est_weeks = sum(p["duration_weeks"] for p in phases_raw)

    payload = {
        "goal": g,
        "readiness_percent": readiness,
        "skills_matched": matched,
        "skills_total": total,
        "estimated_months": max(1, est_weeks // 4),
        "phases": phases_raw,
    }
    return _normalize_roadmap_payload(payload, g)


def _ensure_roadmap_phases(normalized: dict, goal: str, resume_text: str) -> dict:
    """If LLM output has no phases after normalization, use template roadmap."""
    phases = normalized.get("phases") or []
    if not phases:
        return _fallback_roadmap_payload(goal, resume_text)
    return normalized


_ROADMAP_LLM = None


def _get_roadmap_llm():
    """Single ChatOllama instance — avoids reconnect/log spam per request."""
    global _ROADMAP_LLM
    if _ROADMAP_LLM is None:
        import httpx

        read_s = float(os.getenv("OLLAMA_ROADMAP_READ_TIMEOUT", "300"))
        connect_s = float(os.getenv("OLLAMA_CONNECT_TIMEOUT", "8"))
        client_timeout = httpx.Timeout(connect=connect_s, read=read_s, write=60.0, pool=5.0)
        n = int(os.getenv("OLLAMA_ROADMAP_NUM_PREDICT", "520"))
        _ROADMAP_LLM = get_llm(
            temperature=0.2,
            num_predict=n,
            client_kwargs={"timeout": client_timeout},
        )
    return _ROADMAP_LLM


def _parse_llm_roadmap_json(content: str, goal: str, resume: str) -> dict:
    """Turn model output into a normalized roadmap, or template if JSON is unusable."""
    if isinstance(content, list):
        content = "".join(
            part.get("text", "") if isinstance(part, dict) else str(part)
            for part in content
        )
    if not isinstance(content, str):
        content = str(content)

    def _try_payload(parsed: dict) -> Optional[dict]:
        if not isinstance(parsed, dict):
            return None
        normalized = _normalize_roadmap_payload(parsed, goal)
        return _ensure_roadmap_phases(normalized, goal, resume)

    try:
        parsed = json.loads(content)
        out = _try_payload(parsed)
        if out is not None:
            return out
    except json.JSONDecodeError:
        pass

    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1 and end > start:
        try:
            parsed = json.loads(content[start : end + 1])
            out = _try_payload(parsed)
            if out is not None:
                return out
        except json.JSONDecodeError:
            pass

    return _fallback_roadmap_payload(goal, resume)


@router.post("/jobs/match", response_model=GraphWorkflowOutput, tags=["Orchestrator"])
async def run_full_workflow(file: UploadFile = File(...), role_name: str = Form("General Role")):
    """
    Complete LangGraph workflow:
    1. Parse Resume
    2. Search for Jobs
    3. Score the matches
    Returns all results in one go.
    """
    try:
        # 1. Extract raw text
        text = await extract_text_from_file(file)
        
        # 2. Run the LangGraph
        initial_state = {
            "resume_text": text,
            "role_name": role_name
        }
        
        # Execute graph
        final_state = await app_graph.ainvoke(initial_state)
        
        # 3. Persist to DB
        parsed = final_state["parsed_resume"]
        save_profile(
            profile_data=parsed.model_dump(),
            role_name=role_name
        )
        
        return GraphWorkflowOutput(
            parsed_resume=final_state["parsed_resume"],
            job_listings=final_state["job_listings"],
            scored_jobs=final_state["scored_jobs"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestrator error: {str(e)}")


# Common tech/professional keywords for fast skill extraction (no LLM)
_SKILL_KEYWORDS = [
    "python", "javascript", "typescript", "react", "node", "java", "c++", "c#", "go", "rust",
    "sql", "postgresql", "mongodb", "aws", "azure", "gcp", "docker", "kubernetes",
    "machine learning", "ai", "tensorflow", "pytorch", "data analysis", "excel",
    "agile", "scrum", "git", "linux", "rest", "api", "graphql", "html", "css",
    "redux", "vue", "angular", "django", "flask", "fastapi", "spring",
]

@router.options("/resume/parse")
async def resume_parse_options():
    """CORS preflight for POST /resume/parse"""
    return Response(status_code=200)

@router.options("/resume/extract")
async def resume_extract_options():
    """CORS preflight for POST /resume/extract"""
    return Response(status_code=200)

@router.post("/resume/extract", response_model=ResumeExtractOutput, tags=["Agents"])
async def extract_resume_fast(file: UploadFile = File(...)):
    """
    Fast resume extraction (no LLM). Extracts raw text and skills via keyword matching.
    Use this for quick uploads; use /resume/parse for full AI analysis.
    """
    try:
        text = await extract_text_from_file(file)
        text_lower = text.lower()
        skills = [kw for kw in _SKILL_KEYWORDS if kw in text_lower]
        # Dedupe and title-case for display
        skills = list(dict.fromkeys(s.title() for s in skills))
        return ResumeExtractOutput(raw_text=text, skills=skills)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/resume/parse", response_model=ResumeParseOutput, tags=["Agents"])
async def parse_resume(file: UploadFile = File(...)):
    """
    Endpoint to process a resume file (PDF/docx), extract skills and calculate an ATS score limit.
    """
    print(f"[API LOG] /resume/parse - Received file: {file.filename}")
    try:
        # Extract text using file parser utility
        text = await extract_text_from_file(file)
        print(f"[API LOG] Extracted text length: {len(text)} characters.")
        
        # Pass to Resume Agent
        result = await process_resume(text)
        print(f"[API LOG] Agent result summary: {result.professional_summary[:50]}...")
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[API ERROR] {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.options("/jobs/search")
async def jobs_search_options():
    """CORS preflight for POST /jobs/search"""
    return Response(status_code=200)

@router.post("/jobs/search", response_model=JobSearchOutput, tags=["Agents"])
async def find_jobs(request: Request):
    """
    Accepts either JSON { query, filters } or Form (role_name, skills).
    """
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
            query = body.get("query", "Software Engineer")
            filters = body.get("filters") or {}
            skills_raw = filters.get("skills")
            if isinstance(skills_raw, list):
                skills_list = [str(s).strip() for s in skills_raw if s]
            elif isinstance(skills_raw, str):
                skills_list = [s.strip() for s in skills_raw.split(",") if s.strip()]
            else:
                skills_list = []
            role_name = query
        else:
            form = await request.form()
            role_name = form.get("role_name") or "Software Engineer"
            skills_str = form.get("skills") or ""
            skills_list = [s.strip() for s in skills_str.split(",") if s.strip()]

        jobs = await search_jobs(skills_list, role_name)
        return JobSearchOutput(jobs=jobs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.options("/jobs/score")
async def jobs_score_options():
    """CORS preflight for POST /jobs/score"""
    return Response(status_code=200)

@router.post("/jobs/score", response_model=JobMatchScoreOutput, tags=["Agents"])
async def calculate_scores(request: Request):
    """
    Accepts either JSON { resume_text, job_description } or Form (resume_text, job_descriptions, job_ids).
    """
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
            resume_text = body.get("resume_text", "")
            job_description = body.get("job_description", "")
            if not resume_text or not job_description:
                raise HTTPException(status_code=400, detail="resume_text and job_description required.")
            job_descriptions = [job_description]
            job_ids = ["0"]
        else:
            form = await request.form()
            resume_text = form.get("resume_text") or ""
            job_descriptions_raw = form.getlist("job_descriptions") if hasattr(form, "getlist") else []
            job_ids_raw = form.getlist("job_ids") if hasattr(form, "getlist") else []
            if isinstance(form.get("job_descriptions"), str):
                job_descriptions_raw = [form.get("job_descriptions")]
            if isinstance(form.get("job_ids"), str):
                job_ids_raw = [form.get("job_ids")]
            job_descriptions = job_descriptions_raw or [form.get("job_descriptions", "")]
            job_ids = job_ids_raw or [form.get("job_ids", "0")]
            if not resume_text:
                raise HTTPException(status_code=400, detail="resume_text required.")

        if len(job_descriptions) != len(job_ids):
            raise HTTPException(status_code=400, detail="Length of job_descriptions and job_ids must be equal.")

        scores = await score_jobs(resume_text, job_descriptions, job_ids)
        return JobMatchScoreOutput(scores=scores)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat", response_model=ChatResponse, tags=["AI Assistant"])
async def chat_with_assistant(request: ChatRequest):
    """
    Chat with the Recrux AI Assistant using RAG context.
    """
    try:
        response = await ask_assistant(request.message, request.user_context)
        return ChatResponse(response=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/roadmap", tags=["AI Assistant"])
async def generate_roadmap(request: RoadmapRequest):
    """
    Generate a career roadmap JSON. The career goal is primary; resume is optional context.
    """
    if not request.goal.strip():
        raise HTTPException(status_code=400, detail="goal is required.")

    goal = request.goal.strip()
    resume = (request.resume_text or "").strip()
    max_resume = int(os.getenv("ROADMAP_RESUME_MAX_CHARS", "9000"))
    resume_for_llm = resume if len(resume) <= max_resume else resume[:max_resume] + "\n[truncated]"

    system_prompt = """You reply with only valid JSON (no markdown). The user's CAREER GOAL drives everything.
Output: goal (string), readiness_percent (0-100), skills_matched, skills_total, estimated_months (int),
phases: 3-5 objects with number, title, status (complete|active|upcoming), duration_weeks, short description,
skills: [{name, user_has}], resources: [{label, url}] only on the active phase (1-3 links). 2-4 skills per phase.
Exactly one phase must be "active". Tailor phases to the goal (foundations, core skills, portfolio, job search as fits).

Resume rules: if resume text is included, user_has true only for clearly evidenced skills; tune readiness counts.
If no resume, user_has mostly false and readiness about 15-35 unless the goal implies seniority."""

    user_prompt = f"Career goal:\n{goal}\n\n"
    if resume:
        user_prompt += (
            "Resume (use only for user_has + readiness; roadmap must fit the goal):\n" + resume_for_llm + "\n"
        )
    else:
        user_prompt += "No resume. Build the roadmap from the goal alone.\n"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        llm = _get_roadmap_llm()
        response = await llm.ainvoke(messages)
        return _parse_llm_roadmap_json(response.content, goal, resume)
    except HTTPException:
        raise
    except Exception as e:
        print(f"[roadmap] LLM failed, using template: {e}")
        return _fallback_roadmap_payload(goal, resume)


@router.get("/profile/{profile_id}", tags=["User Profile"])
async def fetch_user_profile(profile_id: str):
    """
    Fetch a stored user profile from SQLite.
    """
    profile = get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
 