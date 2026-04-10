import os
import json
from dotenv import load_dotenv
from pathlib import Path
import sys
import uuid

# Add backend directory to sys path so we can import utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.database import SessionLocal, Job
from utils.vector_db import store_job_vectors

load_dotenv()

def load_jobs_from_local_source():
    """
    Loads user-provided retrieved jobs from a local JSON file.
    Expected shape: list[dict], where each dict has title/company/location/description/url/tags.
    """
    default_path = Path(__file__).resolve().parent.parent / "utils" / "dummy_jobs.json"
    source = Path(os.getenv("RETRIEVED_JOBS_PATH", str(default_path)))
    if not source.exists():
        raise FileNotFoundError(f"Retrieved jobs file not found: {source}")
    with open(source, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Retrieved jobs JSON must be a list of objects.")
    return data

def main():
    print("Loading jobs from local retrieved-doc source...")
    jobs_data = load_jobs_from_local_source()
    print(f"Loaded {len(jobs_data)} jobs. Inserting into database...")
    
    db = SessionLocal()
    inserted = 0
    duplicates = 0
    new_jobs_list = []
    try:
        for job_info in jobs_data:
            # Prefer explicit id, then slug/url, else generate stable-ish fallback.
            job_id = (
                str(job_info.get("id") or "").strip()
                or str(job_info.get("slug") or "").strip()
                or str(job_info.get("url") or "").strip()
                or str(uuid.uuid4())
            )
                
            existing_job = db.query(Job).filter(Job.id == job_id).first()
            if existing_job:
                duplicates += 1
                continue
                
            job_url = job_info.get("url", "")
            if job_url:
                existing_url = db.query(Job).filter(Job.job_listing_link == job_url).first()
                if existing_url:
                    duplicates += 1
                    continue

            
            tags = job_info.get("tags", []) or job_info.get("skills_required", [])
            new_job = Job(
                id=job_id,
                job_title=job_info.get("job_title", job_info.get("title", "")),
                company_name=job_info.get("company_name", ""),
                location=job_info.get("location", "Remote"),
                job_description=job_info.get("job_description", job_info.get("description", "")),
                job_listing_link=job_info.get("url", ""),
                remote_allowed=job_info.get("remote", True),
                skills_required=tags
            )
            db.add(new_job)
            new_jobs_list.append(new_job)
            inserted += 1
            
        db.commit()
        print(f"Backfill complete! Inserted {inserted} new jobs. Skipped {duplicates} duplicates.")
        
        if new_jobs_list:
            print("Calculating mathematical embeddings for the new jobs. This may take a minute...")
            store_job_vectors(new_jobs_list)
            print("✅ Vectors calculated and saved to PGVector!")
            
    except Exception as e:
        print(f"Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
