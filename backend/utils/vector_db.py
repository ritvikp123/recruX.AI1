import os
from typing import List, Optional
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import Session
from pgvector.sqlalchemy import Vector
from dotenv import load_dotenv

from utils.llm_factory import get_embeddings
from utils.database import SessionLocal, Job, Profile

load_dotenv()

# Initialize Embeddings via factory
embeddings_model = get_embeddings()

def store_resume_vector(resume_id: str, resume_text: str):
    """
    Embeds and stores a resume embedding in the PostgreSQL 'profiles' table.
    """
    embedding = embeddings_model.embed_query(resume_text)
    db = SessionLocal()
    try:
        profile = db.query(Profile).filter(Profile.id == resume_id).first()
        if profile:
            profile.embedding = embedding
            db.commit()
            print(f"VectorDB (Postgres): Resume {resume_id} embedding stored.")
    finally:
        db.close()

def store_job_vectors(job_listings: list):
    """
    Embeds and stores multiple job descriptions in the PostgreSQL 'jobs' table.
    """
    db = SessionLocal()
    try:
        for job in job_listings:
            # Check if job exists in DB
            db_job = db.query(Job).filter(Job.id == str(job.id)).first()
            if db_job:
                embedding = embeddings_model.embed_query(job.job_description[:10000]) # Match ingestion limit
                db_job.embedding = embedding
        db.commit()
        print(f"VectorDB (Postgres): {len(job_listings)} job embeddings stored.")
    finally:
        db.close()

def query_similar_jobs(text_query: str, n_results: int = 5):
    """
    Retrieves top N job descriptions similar to the query using pgvector distance.
    """
    embedding = embeddings_model.embed_query(text_query)
    db = SessionLocal()
    try:
        # Cosine distance <-> (embedding <=> Job.embedding)
        # Note: postgres uses <=> for cosine distance, <-> for Euclidean
        results = (
            db.query(Job)
            .order_by(Job.embedding.cosine_distance(embedding))
            .limit(n_results)
            .all()
        )
        
        # Convert to LangChain Document format for compatibility with chat_agent.py
        from langchain_core.documents import Document
        docs = [
            Document(
                page_content=job.job_description,
                metadata={"job_id": job.id, "title": job.job_title, "company": job.company_name}
            )
            for job in results if job.embedding is not None
        ]
        return docs
    finally:
        db.close()
