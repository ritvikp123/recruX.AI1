import pytest
import os
from agents.chat_agent import ask_assistant
from dotenv import load_dotenv

load_dotenv()

@pytest.mark.asyncio
async def test_ask_assistant_real():
    """
    Integration test: Hits real Gemini for career advice.
    """
    if not os.getenv("GEMINI_API_KEY"):
        pytest.skip("GEMINI_API_KEY not set")

    question = "What are the top 3 skills for a modern Backend Engineer?"
    user_context = "I know Python and basic SQL."
    
    response = await ask_assistant(question, user_context)
    
    # Handle list responses from some SDK versions
    actual_text = ""
    if isinstance(response, list):
        actual_text = " ".join([part.get("text", "") for part in response if isinstance(part, dict)])
    else:
        actual_text = str(response)

    assert len(actual_text) > 50
    response_lower = actual_text.lower()
    assert any(keyword in response_lower for keyword in ["python", "sql", "backend", "api"])
