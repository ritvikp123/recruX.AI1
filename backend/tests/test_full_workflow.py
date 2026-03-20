import pytest
import os
from agents.graph import app_graph
from dotenv import load_dotenv

load_dotenv()

@pytest.mark.asyncio
async def test_full_graph_workflow_real():
    """
    Comprehensive integration test: Runs the entire LangGraph with real AI calls.
    1. Parse Resume
    2. Search Jobs
    3. Score Matches
    """
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set")

    initial_state = {
        "resume_text": "Experienced React developer with a focus on UI/UX and Tailwind CSS.",
        "role_name": "Frontend Designer"
    }
    
    # Increase timeout for full workflow as it makes multiple LLM calls
    final_state = await app_graph.ainvoke(initial_state)
    
    # 1. Check Resume Parser Output
    assert "parsed_resume" in final_state
    assert len(final_state["parsed_resume"].skills) > 0
    
    # 2. Check Job Search Output
    assert "job_listings" in final_state
    assert isinstance(final_state["job_listings"], list)
    
    # 3. Check Scoring Output
    assert "scored_jobs" in final_state
    if len(final_state["job_listings"]) > 0:
        assert len(final_state["scored_jobs"]) == len(final_state["job_listings"])
        assert final_state["scored_jobs"][0].match_score >= 0
