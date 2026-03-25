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

score_prompt_template = """Score resume vs job 0-100. Be strict.
90-100: Strong. 70-89: Good. 50-69: Partial. 30-49: Weak. 0-29: Poor.
Job: {job_description}
Resume: {resume_text}

Return match_score (int) and reasoning in this EXACT format (one section per line):
YOU_HAVE: skill1, skill2, skill3
MISSING: skill4, skill5
QUICK_WINS: suggestion1; suggestion2; suggestion3

- YOU_HAVE: skills from the job description that appear in the resume (comma-separated)
- MISSING: skills the job requires that are NOT in the resume (comma-separated)
- QUICK_WINS: 2-3 actionable suggestions to close the gap (courses, projects, certifications). Semicolon-separated.
If no matched skills, write "None". If no missing skills, write "None". Always give 2-3 quick wins."""


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
