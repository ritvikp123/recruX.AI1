import os
import json
from typing import List
from models.schemas import JobListing
from dotenv import load_dotenv

load_dotenv()

from utils.vector_db import query_similar_jobs

def _truthy_env(name: str, default: str = "false") -> bool:
    v = os.getenv(name, default)
    return str(v).strip().lower() in ("1", "true", "yes", "y", "on")

async def search_jobs(skills: List[str], role_name: str) -> List[JobListing]:
    """
    RAG Pipeline: Retrieves jobs purely offline from the local pgvector database.
    """
    query = f"{role_name} " + " ".join(skills)
    print(f"RAG Job Search: calculating vectors for -> {query}")
    
    try:
        raw_db_jobs = query_similar_jobs(query, n_results=10, return_raw=True)
    except Exception as e:
        print(f"RAG search error (is DB backfilled?): {e}")
        allow_dummy = _truthy_env("ALLOW_DUMMY_JOBS", "false")
        if allow_dummy:
            print("RAG unavailable; falling back to dummy jobs.")
            return _load_dummy_jobs()
        return []
        
    jobs = []
    for db_job in raw_db_jobs:
        jobs.append(JobListing(
            id=db_job.id,
            job_title=db_job.job_title,
            company_name=db_job.company_name,
            job_description=db_job.job_description,
            job_listing_link=db_job.job_listing_link,
            location=db_job.location,
            salary_range=db_job.salary_range,
            remote_allowed=db_job.remote_allowed,
            experience_level=db_job.experience_level,
            skills_required=db_job.skills_required
        ))
        
    if not jobs:
        print("PGVector returned 0 matched jobs. Is your DB empty?")
        allow_dummy = _truthy_env("ALLOW_DUMMY_JOBS", "false")
        if allow_dummy:
            print("Falling back to dummy jobs.")
            return _load_dummy_jobs()
            
    return jobs


def _store_jobs_in_vector_db(jobs: List[JobListing]) -> None:
    """Silently embed and store jobs in ChromaDB."""
    if not jobs:
        return
    try:
        from utils.vector_db import store_job_vectors
        store_job_vectors(jobs)
    except Exception as ve:
        print(f"VectorDB store warning: {ve}")


def _load_dummy_jobs() -> List[JobListing]:
    """Load the fallback dummy jobs from file."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dummy_file_path = os.path.join(current_dir, "..", "utils", "dummy_jobs.json")
    try:
        with open(dummy_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        jobs = [JobListing(**job) for job in data]
        _store_jobs_in_vector_db(jobs)
        return jobs
    except Exception as e:
        print(f"Could not load dummy jobs: {e}")
        return []
