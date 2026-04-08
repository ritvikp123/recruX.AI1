import os
import requests
from dotenv import load_dotenv
from pathlib import Path
import sys

# Add backend directory to sys path so we can import utils
sys.path.append(str(Path(__file__).resolve().parent.parent))

from utils.database import SessionLocal, Job

def fetch_jobs():
    url = "https://www.arbeitnow.com/api/job-board-api"
    response = requests.get(url)
    response.raise_for_status()
    return response.json().get("data", [])

def main():
    print("Fetching jobs from Arbeitnow...")
    jobs_data = fetch_jobs()
    print(f"Found {len(jobs_data)} jobs. Inserting into database...")
    
    db = SessionLocal()
    inserted = 0
    duplicates = 0
    try:
        for job_info in jobs_data:
            # Using slug as ID as Arbeitnow provides unique slugs
            job_id = job_info.get("slug")
            if not job_id:
                continue
                
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

            
            # Map Arbeitnow to Job model
            tags = job_info.get("tags", [])
            new_job = Job(
                id=job_id,
                job_title=job_info.get("title", ""),
                company_name=job_info.get("company_name", ""),
                location=job_info.get("location", ""),
                job_description=job_info.get("description", ""),
                job_listing_link=job_info.get("url", ""),
                remote_allowed=job_info.get("remote", True),
                skills_required=tags
            )
            db.add(new_job)
            inserted += 1
            
        db.commit()
        print(f"Backfill complete! Inserted {inserted} new jobs. Skipped {duplicates} duplicates.")
    except Exception as e:
        print(f"Error during backfill: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
