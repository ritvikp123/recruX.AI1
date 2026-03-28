"""LLM helpers for resume optimization vs a job description (plain text, no JSON mode)."""

from langchain_core.prompts import ChatPromptTemplate

from utils.llm_factory import get_llm_prose


def _message_to_str(msg) -> str:
    content = getattr(msg, "content", msg)
    if isinstance(content, list):
        return "".join(
            block.get("text", "")
            if isinstance(block, dict) and block.get("type") == "text"
            else str(block)
            for block in content
        )
    return str(content)


OPTIMIZE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are a career coach. Rewrite the candidate's strongest experience so it aligns with the job.
Rules: plain English only; no JSON, no markdown code fences.
Output 4-8 bullet lines. Start each line with "• ".
Focus on measurable impact and keywords from the job where honest given the resume.""",
        ),
        (
            "human",
            """Job description (target):
{job_description}

Resume text (source of truth — do not invent employers or dates):
{resume_text}

Write tailored bullet points for the experience section.""",
        ),
    ]
)

GAP_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You explain candidly why a resume may not be a strong match for a job.
Plain English, short paragraphs or bullet lines, no JSON.
Be constructive: name 2-4 concrete gaps and 2 quick wins (courses, projects, wording).""",
        ),
        (
            "human",
            """Job description:
{job_description}

Resume text:
{resume_text}

Explain fit gaps and what to improve first.""",
        ),
    ]
)


async def optimize_resume_for_job(resume_text: str, job_description: str) -> str:
    llm = get_llm_prose(temperature=0.35, num_predict=1200)
    chain = OPTIMIZE_PROMPT | llm
    out = await chain.ainvoke(
        {
            "resume_text": (resume_text or "")[:12000],
            "job_description": (job_description or "")[:12000],
        }
    )
    return _message_to_str(out).strip()


async def explain_resume_gap(resume_text: str, job_description: str) -> str:
    llm = get_llm_prose(temperature=0.35, num_predict=900)
    chain = GAP_PROMPT | llm
    out = await chain.ainvoke(
        {
            "resume_text": (resume_text or "")[:12000],
            "job_description": (job_description or "")[:12000],
        }
    )
    return _message_to_str(out).strip()
