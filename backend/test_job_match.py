import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent))
from agents.job_match_agent import score_single_job

async def main():
    resume = "Senior full-stack dev. React, Node.js, Python. 5 years experience."
    jd = "Looking for a full-stack engineer with React and Node.js. Python is a plus. 3+ years experience."
    print("Testing score_single_job...")
    result = await score_single_job(resume, jd, "test_job_123")
    print(f"Match Score: {result.match_score}")
    print(f"Reasoning: {result.reasoning}")

if __name__ == "__main__":
    asyncio.run(main())
