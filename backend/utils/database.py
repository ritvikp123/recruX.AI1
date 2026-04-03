import os
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from sqlalchemy import create_engine, Column, String, Integer, Text, Boolean, DateTime, ForeignKey, JSON, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from dotenv import load_dotenv

# Load .env from backend dir so DATABASE_URL is found when uvicorn runs from any cwd
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/Recrux_VecDB_Dev")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Models ---

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profiles = relationship("Profile", back_populates="user")

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    full_name = Column(String)
    email = Column(String)
    phone = Column(String)
    links = Column(JSONB, default=list) # List of URLs
    professional_summary = Column(Text)
    skills = Column(JSONB, default=list)
    experience = Column(JSONB, default=list)
    projects = Column(JSONB, default=list)
    education = Column(JSONB, default=list)
    ats_score = Column(Integer, default=0)
    raw_text = Column(Text)
    role_name = Column(String)
    embedding = Column(Vector(1536)) # PGVector column matching nomic-embed-text dimension
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="profiles")

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True) # ID from CSV
    job_title = Column(String)
    company_name = Column(String)
    location = Column(String)
    job_description = Column(Text)
    salary_range = Column(String)
    job_listing_link = Column(String)
    remote_allowed = Column(Boolean, default=True)
    experience_level = Column(String)
    skills_required = Column(JSONB, default=list)
    embedding = Column(Vector(1536)) # PGVector column matching nomic-embed-text dimension
    created_at = Column(DateTime, default=datetime.utcnow)

class UserJobMatch(Base):
    __tablename__ = "user_job_matches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    job_id = Column(String, ForeignKey("jobs.id"))
    match_score = Column(Integer)
    reasoning = Column(Text)
    status = Column(String, default="viewed") # viewed, saved, applied
    created_at = Column(DateTime, default=datetime.utcnow)

# --- DB Utility Functions ---

def init_db():
    """
    Creates tables and enables pgvector extension.
    """
    with engine.begin() as conn:
        from sqlalchemy import text
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    
    Base.metadata.create_all(bind=engine)
    print("PostgreSQL Tables initialized successfully.")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def save_profile(profile_data: dict, role_name: str, user_id: Optional[str] = None):
    db = SessionLocal()
    try:
        # Create a new Profile instance
        # If profile_id is provided in data, use it or create new
        p_id = profile_data.get("id")
        if p_id and isinstance(p_id, str):
             try:
                 p_id = uuid.UUID(p_id)
             except ValueError:
                 p_id = uuid.uuid4()
        else:
            p_id = uuid.uuid4()

        new_profile = Profile(
            id=p_id,
            user_id=uuid.UUID(user_id) if user_id else None,
            full_name=profile_data.get("full_name"),
            email=profile_data.get("email"),
            phone=profile_data.get("phone"),
            links=profile_data.get("links", []),
            professional_summary=profile_data.get("professional_summary"),
            skills=profile_data.get("skills", []),
            experience=profile_data.get("experience", []),
            projects=profile_data.get("projects", []),
            education=profile_data.get("education", []),
            ats_score=profile_data.get("ats_score", 0),
            raw_text=profile_data.get("raw_text"),
            role_name=role_name
        )
        db.merge(new_profile) # Insert or update
        db.commit()
        return str(p_id)
    finally:
        db.close()

def get_profile(profile_id: str):
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == profile_id).first()
        if profile:
            return {
                "id": str(profile.id),
                "full_name": profile.full_name,
                "email": profile.email,
                "phone": profile.phone,
                "links": profile.links,
                "professional_summary": profile.professional_summary,
                "skills": profile.skills,
                "experience": profile.experience,
                "projects": profile.projects,
                "education": profile.education,
                "ats_score": profile.ats_score,
                "raw_text": profile.raw_text,
                "role_name": profile.role_name
            }
        return None
    finally:
        db.close()

def save_jobs_batch(job_listings: list):
    db = SessionLocal()
    try:
        for job_data in job_listings:
            new_job = Job(
                id=str(job_data.id),
                job_title=job_data.job_title,
                company_name=job_data.company_name,
                location=job_data.location,
                job_description=job_data.job_description,
                salary_range=job_data.salary_range,
                job_listing_link=job_data.job_listing_link,
                remote_allowed=job_data.remote_allowed,
                experience_level=job_data.experience_level,
                skills_required=job_data.skills_required
            )
            db.merge(new_job)
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
