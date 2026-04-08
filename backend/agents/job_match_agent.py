from langchain_core.prompts import PromptTemplate
from models.schemas import JobScore, JobScoreLLMOutput
import asyncio

from dotenv import load_dotenv
load_dotenv()

from utils.llm_factory import get_llm

# Global placeholders for lazy loading
_chain = None

def get_scoring_chain():
    global _chain
    if _chain is None:
        # Lower temperature for more consistent, less inflated scores
        # num_predict allows structured reasoning (you_have, missing, quick_wins)
        llm = get_llm(temperature=0.1, num_predict=256)
        # Note: with_structured_output is supported on Gemini models
        structured_llm = llm.with_structured_output(JobScoreLLMOutput)
        
        prompt = PromptTemplate(
            input_variables=["job_description", "resume_text"],
            template=score_prompt_template
        )
        _chain = prompt | structured_llm
    return _chain

score_prompt_template = """You are an expert technical recruiter.
Job Description:
{job_description}

Resume:
{resume_text}

Analyze the candidate's fit based on skills and experience. Output the 'match_score' (int between 0 and 100) and 'reasoning' (brief explanation of the score, noting key matches or missing skills)."""


async def score_single_job(resume_text: str, job_description: str, job_id: str) -> JobScore:
    """
    Scores a single job description against a resume.
    """
    try:
        # Lazy load the chain
        chain = get_scoring_chain()
        # Truncate to ~2500 chars each to reduce tokens and speed up inference
        out = await chain.ainvoke({
            "job_description": job_description[:2500],
            "resume_text": resume_text[:2500]
        })
        return JobScore(job_id=job_id, match_score=out.match_score, reasoning=out.reasoning)
    except Exception as e:
        print(f"Error scoring job {job_id}: {e}")
        return JobScore(job_id=job_id, match_score=0, reasoning="Error generating score.")


async def score_jobs(resume_text: str, job_descriptions: list[str], job_ids: list[str]) -> list[JobScore]:
    """
    Scores multiple jobs asynchronously against a given resume.
    """
    tasks = []
    # Ensure they match in length, but assuming they do for this snippet
    for jd, j_id in zip(job_descriptions, job_ids):
        tasks.append(score_single_job(resume_text, jd, j_id))
        
    scores = await asyncio.gather(*tasks)
    return list(scores)
