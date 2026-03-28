from pydantic import BaseModel, Field
from typing import List, Optional

# --- Resume Models ---

class ExperienceEntry(BaseModel):
    company: str
    role: str
    duration: str
    description: str

class ProjectEntry(BaseModel):
    title: str
    technologies: List[str]
    description: str

class EducationEntry(BaseModel):
    institution: str
    degree: str
    year: str

class ResumeExtractOutput(BaseModel):
    """Fast extraction (no LLM) - raw text + keyword-based skills."""
    raw_text: str = ""
    skills: List[str] = Field(default_factory=list)

class ResumeParseOutput(BaseModel):
    full_name: str = Field(default="Candidate", description="Full name of the candidate")
    email: Optional[str] = None
    phone: Optional[str] = None
    links: List[str] = Field(default_factory=list, description="Social links like LinkedIn, GitHub, Portfolio")
    professional_summary: str = Field(default="", description="A brief professional overview")
    skills: List[str] = Field(default_factory=list, description="List of technical and soft skills extracted from the resume.")
    experience: List[ExperienceEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    ats_score: int = Field(default=0, description="Estimated ATS score out of 100")
    raw_text: Optional[str] = Field(default=None, description="The raw scraped text of the resume.")

# --- Job Models ---

class JobListing(BaseModel):
    id: str
    job_title: str
    company_name: str
    location: Optional[str] = "Remote"
    job_description: str
    salary_range: Optional[str] = None
    job_listing_link: str = Field(default="#")
    remote_allowed: bool = True
    experience_level: Optional[str] = None
    skills_required: List[str] = Field(default_factory=list)
    
class JobSearchOutput(BaseModel):
    jobs: List[JobListing]


class JobSearchRequest(BaseModel):
    """JSON body for POST /api/jobs/search"""
    query: str = Field(default="Software Engineer", description="Search query (role, keywords)")
    filters: Optional[dict] = Field(default_factory=dict, description="Optional filters (skills, location, etc.)")


# --- Job Scoring Models ---

class JobScore(BaseModel):
    job_id: str
    match_score: int = Field(description="Score out of 100 representing how well the resume matches the job description.")
    reasoning: Optional[str] = Field(default=None, description="Brief explanation of the score.")


class JobScoreLLMOutput(BaseModel):
    """Minimal schema for LLM scoring - no job_id to reduce tokens."""
    match_score: int = Field(description="Score 0-100.")
    reasoning: Optional[str] = Field(default=None, description="Brief 1-sentence explanation.")


class JobScoreRequest(BaseModel):
    """JSON body for POST /api/jobs/score (single job)"""
    resume_text: str
    job_description: str


class JobMatchScoreOutput(BaseModel):
    scores: List[JobScore]

# --- Orchestrator Output ---

class GraphWorkflowOutput(BaseModel):
    parsed_resume: ResumeParseOutput
    job_listings: List[JobListing]
    scored_jobs: List[JobScore]

# --- Chat Models ---

class ChatRequest(BaseModel):
    message: str
    user_context: Optional[str] = Field(default=None, description="Additional context like resume text or job details.")

class ChatResponse(BaseModel):
    response: str


# --- Resume tailor (optimize / gap) ---

class ResumeTailorRequest(BaseModel):
    """JSON for POST /api/resume/optimize and /api/resume/gap-why"""
    resume_text: str
    job_description: str


class ResumeTailorTextResponse(BaseModel):
    text: str
