from langchain_core.prompts import PromptTemplate
from models.schemas import ResumeParseOutput
from dotenv import load_dotenv

load_dotenv()

from utils.llm_factory import get_llm

# Initialize the model via factory
llm = get_llm(temperature=0.1)

# Note: with_structured_output is supported on Gemini models
structured_llm = llm.with_structured_output(ResumeParseOutput)

prompt_template = """
You are an expert ATS (Applicant Tracking System) parser.
Standardize the following resume into a clean structured format.

Extract:
- Full Name
- Contact (Email, Phone)
- Links (LinkedIn, GitHub, Portfolio)
- Professional Summary (2-3 sentences max)
- Technical and Soft Skills (as a list of strings)
- Experience (List of: company, role, duration, description)
- Projects (List of: title, technologies used, description)
- Education (List of: institution, degree, year)
- Estimated ATS Score (0-100)

If a section is missing, provide an empty list or None.

Resume Text:
{resume_text}

Provide the response in the specified structured format.
"""

prompt = PromptTemplate(
    input_variables=["resume_text"],
    template=prompt_template
)

chain = prompt | structured_llm

async def process_resume(resume_text: str) -> ResumeParseOutput:
    """
    Takes raw resume text and uses Gemini to extract standardized sections and an ATS score.
    Returns a ResumeParseOutput object.
    """
    try:
        # Invoke the chain
        result = await chain.ainvoke({"resume_text": resume_text})
        # Add the raw text to the result object
        result.raw_text = resume_text
        
        # --- STORAGE INTEGRATION ---
        # 1. Save to Vector DB for semantic searching
        from utils.vector_db import store_resume_vector
        # Embedding focus: Summary + Skills + Roles
        content_to_embed = f"{result.professional_summary}\nSkills: {', '.join(result.skills)}\nExperience: {len(result.experience)} roles"
        store_resume_vector("current_user_resume", content_to_embed)
        
        # 2. Save structured data to SQLite
        from utils.database import save_profile
        save_profile(result.model_dump(), "Software Engineer") # Default role
        
        return result
    except Exception as e:
        print(f"Error parsing resume with Gemini: {e}")
        # Return a minimalist fallback on failure
        return ResumeParseOutput(
            full_name="User",
            professional_summary="Error parsing resume content.",
            skills=[],
            raw_text=resume_text
        )
