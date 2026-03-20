import os
import sys
import pandas as pd
from tqdm import tqdm
import time

# Add parent directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from utils.database import init_db, save_jobs_batch, SessionLocal, Job
from utils.vector_db import embeddings_model
from models.schemas import JobListing

CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/postings.csv"))
LIMIT = 1000 # Only ingest 1000 rows as requested
BATCH_SIZE = 25 # Smaller batches for embedding API reliability and rate limits
CHAR_LIMIT = 10000 # "As much context as it can" ~2500 tokens

def ingest_jobs():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV not found at {CSV_PATH}")
        return

    print("--- Fresh Start: Initializing PostgreSQL ---")
    try:
        init_db()
    except Exception as e:
        print(f"Warning: init_db might have failed or tables already exist with specific settings: {e}")

    print(f"Starting ingestion of TOP {LIMIT} jobs from {CSV_PATH}...")
    
    # Read the first LIMIT rows
    df = pd.read_csv(CSV_PATH, nrows=LIMIT)
    
    db = SessionLocal()
    
    try:
        success_count = 0
        for i in range(0, len(df), BATCH_SIZE):
            chunk = df.iloc[i : i + BATCH_SIZE]
            job_listings = []
            
            print(f"Processing batch {i//BATCH_SIZE + 1} ({len(chunk)} jobs)...")
            
            for _, row in chunk.iterrows():
                desc = str(row.get('description', ''))
                
                job = JobListing(
                    id=str(row.get('job_id', '')),
                    job_title=str(row.get('title', 'Unknown Title')),
                    company_name=str(row.get('company_name', 'Unknown Company')),
                    location=str(row.get('location', 'Remote')),
                    job_description=desc,
                    salary_range=f"{row.get('max_salary', '')} {row.get('pay_period', '')}".strip() or "N/A",
                    experience_level=str(row.get('formatted_experience_level', 'Not Specified')),
                    skills_required=[]
                )
                job_listings.append(job)
            
            # 1. Save metadata to Postgres
            save_jobs_batch(job_listings)
            
            # 2. Generate and save embeddings
            for job in job_listings:
                try:
                    # Use "as much context as possible"
                    truncated_text = job.job_description[:CHAR_LIMIT]
                    vector = embeddings_model.embed_query(truncated_text)
                    
                    # Update the record with embedding
                    db_job = db.query(Job).filter(Job.id == job.id).first()
                    if db_job:
                        db_job.embedding = vector
                        success_count += 1
                except Exception as e:
                    print(f"Error embedding job {job.id}: {e}")
                    # If it's a rate limit, wait longer
                    if "429" in str(e):
                        print("Rate limit hit, sleeping for 10 seconds...")
                        time.sleep(10)
            
            db.commit()
            print(f"Batch {i//BATCH_SIZE + 1} completed. Total embedded: {success_count}/{LIMIT}")
            # Be nice to the free tier API
            time.sleep(1)
            
    except Exception as e:
        print(f"Ingestion process interrupted: {e}")
    finally:
        db.close()

    print(f"Ingestion complete. {success_count} jobs processed and indexed.")

if __name__ == "__main__":
    ingest_jobs()
