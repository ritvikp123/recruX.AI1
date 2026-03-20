from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from models.schemas import JobListing, JobScore, ResumeParseOutput

# Import our agent wrappers
from agents.resume_agent import process_resume
from agents.job_search_agent import search_jobs
from agents.job_match_agent import score_jobs

# Define State for the Graph
class RecruxState(TypedDict):
    # Inputs
    resume_file_path: str
    resume_text: str
    role_name: str
    
    # State values
    parsed_resume: ResumeParseOutput
    job_listings: List[JobListing]
    scored_jobs: List[JobScore]

# Nodes

async def parse_resume_node(state: RecruxState):
    print("Graph: Parsing Resume...")
    parsed = await process_resume(state["resume_text"])
    return {"parsed_resume": parsed}

async def search_jobs_node(state: RecruxState):
    print("Graph: Searching Jobs...")
    skills = state["parsed_resume"].skills
    role_name = state.get("role_name", "General Role")
    jobs = await search_jobs(skills, role_name)
    return {"job_listings": jobs}

async def match_jobs_node(state: RecruxState):
    print("Graph: Scoring Jobs...")
    resume_text = state["resume_text"]
    jobs = state.get("job_listings", [])
    
    if not jobs:
        return {"scored_jobs": []}
        
    descriptions = [job.job_description for job in jobs]
    job_ids = [job.id for job in jobs]
    
    scores = await score_jobs(resume_text, descriptions, job_ids)
    return {"scored_jobs": scores}

# Build the Graph
workflow = StateGraph(RecruxState)

workflow.add_node("parse_resume", parse_resume_node)
workflow.add_node("search_jobs", search_jobs_node)
workflow.add_node("score_jobs", match_jobs_node)

# Defining Edges
# Normal flow: parse resume -> search jobs -> score jobs
workflow.add_edge("parse_resume", "search_jobs")
workflow.add_edge("search_jobs", "score_jobs")
workflow.add_edge("score_jobs", END)

workflow.set_entry_point("parse_resume")

app_graph = workflow.compile()
