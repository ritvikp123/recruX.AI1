from langchain_core.prompts import PromptTemplate
from models.schemas import JobScore
import asyncio

from dotenv import load_dotenv
load_dotenv()

from utils.llm_factory import get_llm

# Initialize the model via factory
llm = get_llm(temperature=0.2)
structured_llm = llm.with_structured_output(JobScore)

score_prompt_template = """
You are an expert technical recruiter and resume reviewer.
You are given a candidate's resume and a specific job description.
Your task is to compare the resume against the job description and assign a match score out of 100.
Also, provide a short reasoning for the score. (e.g. "Candidate lacks NEXT.js but has strong React.")

Job ID: {job_id}

Job Description:
{job_description}

Resume Text:
{resume_text}

Provide the structured output exactly as specified.
"""

prompt = PromptTemplate(
    input_variables=["job_id", "job_description", "resume_text"],
    template=score_prompt_template
)

chain = prompt | structured_llm

async def score_single_job(resume_text: str, job_description: str, job_id: str) -> JobScore:
    """
    Scores a single job description against a resume.
    """
    try:
        result = await chain.ainvoke({
            "job_id": job_id,
            "job_description": job_description,
            "resume_text": resume_text
        })
        return result
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
