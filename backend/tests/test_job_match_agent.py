import pytest
from agents.job_match_agent import score_single_job, score_jobs
from models.schemas import JobScore
from dotenv import load_dotenv
import os

load_dotenv()

@pytest.mark.asyncio
async def test_score_single_job_real():
    """
    Integration test: Hits real Gemini to score a job match.
    """
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set")

    resume_text = "Expert Python developer with 5 years experience in Django and Flask."
    job_desc = "Seeking a Senior Python Developer with strong knowledge of Django."
    job_id = "job_123"
    
    result = await score_single_job(resume_text, job_desc, job_id)
    
    assert isinstance(result, JobScore)
    assert result.job_id == job_id
    assert result.match_score > 70 # Should be a good match
    assert len(result.reasoning) > 0

@pytest.mark.asyncio
async def test_score_jobs_batch_real():
    """
    Test batch scoring of multiple jobs.
    """
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set")

    resume = "Frontend specialist in React and Tailwind."
    jds = [
        "React developer needed immediately.",
        "Truck driver for long distance routes."
    ]
    ids = ["react_dev", "truck_driver"]
    
    results = await score_jobs(resume, jds, ids)
    
    assert len(results) == 2
    # The React job should have a higher score than the truck driver job
    # results[0] is React, results[1] is Truck
    assert results[0].match_score > results[1].match_score
