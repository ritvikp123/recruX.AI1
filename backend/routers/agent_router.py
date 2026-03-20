from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request, Response
from typing import List
from models.schemas import ResumeParseOutput, JobSearchOutput, JobMatchScoreOutput, GraphWorkflowOutput, ChatRequest, ChatResponse
from agents.graph import app_graph
from agents.chat_agent import ask_assistant

from agents.resume_agent import process_resume
from agents.job_search_agent import search_jobs
from agents.job_match_agent import score_jobs
from utils.file_parser import extract_text_from_file
from utils.database import save_profile, get_profile

router = APIRouter()

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


@router.options("/resume/parse")
async def resume_parse_options():
    """CORS preflight for POST /resume/parse"""
    return Response(status_code=200)

@router.post("/resume/parse", response_model=ResumeParseOutput, tags=["Agents"])
async def parse_resume(file: UploadFile = File(...)):
    """
    Endpoint to process a resume file (PDF/docx), extract skills and calculate an ATS score limit.
    """
    try:
        # Extract text using file parser utility
        text = await extract_text_from_file(file)
        
        # Pass to Resume Agent
        result = await process_resume(text)
        return result
    except Exception as e:
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

@router.get("/profile/{profile_id}", tags=["User Profile"])
async def fetch_user_profile(profile_id: str):
    """
    Fetch a stored user profile from SQLite.
    """
    profile = get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
 