import os
import uuid
import httpx
import json
from typing import List
from models.schemas import JobListing
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
JSEARCH_URL = "https://jsearch.p.rapidapi.com/search"
JSEARCH_HEADERS = {
    "X-RapidAPI-Key": RAPIDAPI_KEY or "",
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
}

# Arbeitnow is a completely free job board API that requires no API key
ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"


async def search_jobs(skills: List[str], role_name: str) -> List[JobListing]:
    """
    Fetches real-world jobs. Priority order:
    1. JSearch (RapidAPI) if subscribed
    2. Arbeitnow free API (no key needed)
    3. Dummy fallback
    """
    # Try JSearch first if we have a key
    if RAPIDAPI_KEY:
        jobs = await _search_jsearch(skills, role_name)
        if jobs:
            return jobs

    # Try Arbeitnow (free, no key required)
    jobs = await _search_arbeitnow(skills, role_name)
    if jobs:
        return jobs

    # Final fallback: dummy data
    print("All real APIs failed. Falling back to dummy jobs.")
    return _load_dummy_jobs()


async def _search_jsearch(skills: List[str], role_name: str) -> List[JobListing]:
    """Fetch jobs from JSearch (RapidAPI)."""
    skill_hint = ", ".join(skills[:3]) if skills else ""
    query = f"{role_name} {skill_hint}".strip()

    params = {
        "query": query,
        "page": "1",
        "num_pages": "1",
        "country": "us",
        "date_posted": "month"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(JSEARCH_URL, headers=JSEARCH_HEADERS, params=params)
            response.raise_for_status()
            data = response.json()

        jobs_raw = data.get("data", [])
        jobs = []
        for item in jobs_raw[:10]:
            description_parts = []
            if item.get("job_description"):
                description_parts.append(item["job_description"][:600])
            if item.get("job_highlights", {}).get("Qualifications"):
                qs = item["job_highlights"]["Qualifications"][:3]
                description_parts.append("Requirements: " + "; ".join(qs))
            description = " ".join(description_parts) if description_parts else f"{item.get('job_title')} role at {item.get('employer_name')}."

            jobs.append(JobListing(
                id=item.get("job_id") or str(uuid.uuid4()),
                job_title=item.get("job_title", "Unknown Title"),
                company_name=item.get("employer_name", "Unknown Company"),
                job_description=description,
                job_listing_link=item.get("job_apply_link") or item.get("job_google_link") or "#",
                location=f"{item.get('job_city', '')}, {item.get('job_state', '')}".strip(", ") or "Remote"
            ))

        print(f"JSearch returned {len(jobs)} real jobs for: {query}")
        _store_jobs_in_vector_db(jobs)
        return jobs

    except httpx.HTTPStatusError as e:
        print(f"JSearch API error {e.response.status_code}: not subscribed or quota hit. Trying Arbeitnow...")
        return []
    except Exception as e:
        print(f"JSearch error: {e}. Trying Arbeitnow...")
        return []


async def _search_arbeitnow(skills: List[str], role_name: str) -> List[JobListing]:
    """Fetch jobs from Arbeitnow — completely free, no API key needed."""
    # Build a search query for the URL
    query = role_name.replace(" ", "+")
    search_url = f"{ARBEITNOW_URL}?search={query}&page=1"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(search_url)
            response.raise_for_status()
            data = response.json()

        jobs_raw = data.get("data", [])
        jobs = []

        for item in jobs_raw[:10]:
            # Filter by relevance: check if role_name or any skill appears in title/description
            title = item.get("title", "").lower()
            desc = item.get("description", "").lower()
            combined =  title + " " + desc
            
            # Simple relevance filter
            role_lower = role_name.lower()
            skill_hit = any(s.lower() in combined for s in skills) if skills else True
            role_hit = any(word in combined for word in role_lower.split())

            if not (role_hit or skill_hit):
                continue

            # Extract location
            location = item.get("location", "Remote") or "Remote"
            if item.get("remote"):
                location = "Remote"

            jobs.append(JobListing(
                id=item.get("slug") or str(uuid.uuid4()),
                job_title=item.get("title", "Unknown Title"),
                company_name=item.get("company_name", "Unknown Company"),
                job_description=item.get("description", "")[:800],
                job_listing_link=item.get("url") or f"https://www.arbeitnow.com/jobs/{item.get('slug', '')}",
                location=location
            ))

        print(f"Arbeitnow returned {len(jobs)} relevant jobs for: {role_name}")
        _store_jobs_in_vector_db(jobs)
        return jobs

    except Exception as e:
        print(f"Arbeitnow API error: {e}")
        return []


def _store_jobs_in_vector_db(jobs: List[JobListing]) -> None:
    """Silently embed and store jobs in ChromaDB."""
    if not jobs:
        return
    try:
        from utils.vector_db import store_job_vectors
        store_job_vectors(jobs)
    except Exception as ve:
        print(f"VectorDB store warning: {ve}")


def _load_dummy_jobs() -> List[JobListing]:
    """Load the fallback dummy jobs from file."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dummy_file_path = os.path.join(current_dir, "..", "utils", "dummy_jobs.json")
    try:
        with open(dummy_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        jobs = [JobListing(**job) for job in data]
        _store_jobs_in_vector_db(jobs)
        return jobs
    except Exception as e:
        print(f"Could not load dummy jobs: {e}")
        return []
