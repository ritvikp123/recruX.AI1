import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Path to .env
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

# Import the factory and schema
from utils.llm_factory import get_llm
from pydantic import BaseModel, Field
from typing import List, Optional

class ResumeParseOutput(BaseModel):
    full_name: str = Field(..., description="Full name of the candidate")
    skills: List[str] = Field(default_factory=list, description="List of technical skills")
    professional_summary: str = Field(..., description="A 2-3 sentence summary")

async def test_structured_output():
    try:
        print(f"Testing Structured Output with {os.getenv('OLLAMA_MODEL')}...")
        llm = get_llm()
        structured_llm = llm.with_structured_output(ResumeParseOutput)
        
        resume_text = "My name is John Doe. I am a software engineer with skills in Python, Java, and C++. I have 5 years of experience."
        
        print("Invoking structured LLM...")
        result = await structured_llm.ainvoke(resume_text)
        print(f"Result: {result}")
        print("\nStructured output successful!")
    except Exception as e:
        print(f"\nStructured output failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_structured_output())
