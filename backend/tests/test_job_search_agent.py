import pytest
import os
from agents.job_search_agent import search_jobs
from models.schemas import JobListing
from dotenv import load_dotenv

load_dotenv()

@pytest.mark.asyncio
async def test_search_jobs_from_local_rag_store():
    """
    Integration test: queries jobs from local pgvector store.
    """
    if os.getenv("ALLOW_DUMMY_JOBS", "false").lower() not in {"1", "true", "yes", "on"}:
        pytest.skip("Set ALLOW_DUMMY_JOBS=true (or backfill your DB) for this integration test.")

    role_name = "Backend Developer"
    skills = ["Python", "FastAPI"]
    
    jobs = await search_jobs(skills, role_name)
    
    assert isinstance(jobs, list)
    # Even if no jobs found, it should be a list
    if len(jobs) > 0:
        assert isinstance(jobs[0], JobListing)
        assert jobs[0].job_title is not None
        assert jobs[0].job_listing_link.startswith("http") or jobs[0].job_listing_link == "#"

@pytest.mark.asyncio
async def test_search_jobs_fallback():
    """
    Test with obscure role to see how system handles low-result queries.
    """
    role_name = "Underwater Basket Weaver in Mars"
    skills = ["Oxygen Management"]
    
    jobs = await search_jobs(skills, role_name)
    assert isinstance(jobs, list)
    # Should at least return empty list or dummy jobs
