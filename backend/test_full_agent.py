import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Path to .env
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

from agents.resume_agent import process_resume

async def test_full_agent():
    try:
        print(f"Python Version: {sys.version}")
        print(f"Testing Full Resume Agent with {os.getenv('OLLAMA_MODEL')}...")
        resume_text = "Muhammad Ghulam Jillani. Senior Data Scientist with skills in Generative AI, LLMs, and Python."
        
        print("Processing resume...")
        result = await process_resume(resume_text)
        print(f"\nResult: {result.model_dump_json(indent=2)}")
        
        if result.professional_summary == "Error parsing resume content.":
            print("\nFAILURE: Returned fallback error message.")
        else:
            print("\nSUCCESS: Resume parsed correctly.")
            
    except Exception as e:
        print(f"\nCaught Exception in test script: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_full_agent())
