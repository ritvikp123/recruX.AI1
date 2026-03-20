import pytest
from agents.resume_agent import process_resume
from models.schemas import ResumeParseOutput
from dotenv import load_dotenv
import os

# Load actual .env for real testing
load_dotenv()

@pytest.mark.asyncio
async def test_process_resume_real():
    """
    Integration test: Hits the real Gemini API to parse a resume.
    """
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set in .env")

    resume_text = """
    John Doe
    Software Engineer
    Skills: Python, FastAPI, PostgreSQL, Docker, Kubernetes.
    Experience: 
    - 3 years as a Backend Dev at Tech Corp.
    - Built scalable microservices with Python.
    """
    
    result = await process_resume(resume_text)
    
    assert isinstance(result, ResumeParseOutput)
    assert len(result.skills) > 0
    # Check if some expected skills are there (Gemini should pick these up)
    found_skills = [s.lower() for s in result.skills]
    assert any("python" in s for s in found_skills)
    assert result.ats_score > 0
    assert result.raw_text == resume_text

@pytest.mark.asyncio
async def test_process_resume_empty_real():
    """
    Test how real model handles minimalist input.
    """
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set in .env")

    resume_text = "I am a person who likes to code."
    result = await process_resume(resume_text)
    
    assert isinstance(result, ResumeParseOutput)
    # result.skills might be empty or very few
    assert result.raw_text == resume_text
