"""
Nightly (or on-demand) job: fetch listings from Apify All Jobs Scraper and upsert into Postgres + pgvector.

Designed for Cloud Run Jobs: use the same container image as the API, override the command to:
  python scripts/daily_apify_backfill.py

Env (set on the Job or in Secret Manager → env):
  APIFY_TOKEN              — required (Apify Console → Integrations)
  JOBS_BACKFILL_KEYWORDS   — comma-separated, default "Software Engineer"
  JOBS_BACKFILL_COUNTRY    — exact Apify country label, default United States
  JOBS_BACKFILL_LOCATION   — optional city/region passed to the actor
  JOBS_BACKFILL_MAX_RESULTS_PER_KEYWORD — cap per keyword (default 60)
  JOBS_BACKFILL_MAX_TOTAL_CHARGE_USD    — Apify run cap (default 5)
  JOBS_BACKFILL_POSTED_SINCE — e.g. "7 days", "1 month" (default 7 days)
  JOBS_BACKFILL_JOB_TYPE   — all | fulltime | contract (default all)
  JOBS_BACKFILL_REMOTE_ONLY — true/false (default false)
  JOBS_BACKFILL_REPLACE_ALL — if true: delete user_job_matches + jobs, then load fresh Apify rows
                               (use with your existing reset schedule, or instead of a separate reset job)
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import text

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
load_dotenv(ROOT / ".env")

from models.schemas import JobListing  # noqa: E402
from utils.apify_all_jobs import fetch_apify_jobs, get_apify_token, resolve_country_for_apify  # noqa: E402
from utils.database import Job, SessionLocal  # noqa: E402
from utils.vector_db import store_job_vectors  # noqa: E402


def _truthy(name: str, default: str = "false") -> bool:
    return os.getenv(name, default).strip().lower() in ("1", "true", "yes", "on")


def _keywords() -> list[str]:
    raw = os.getenv("JOBS_BACKFILL_KEYWORDS", "Software Engineer").strip()
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    return parts or ["Software Engineer"]


def main() -> None:
    token = get_apify_token()
    if not token:
        raise SystemExit("APIFY_TOKEN is required for Apify backfill.")

    country = resolve_country_for_apify(os.getenv("JOBS_BACKFILL_COUNTRY"))
    location = (os.getenv("JOBS_BACKFILL_LOCATION") or "").strip() or None
    max_per = int(os.getenv("JOBS_BACKFILL_MAX_RESULTS_PER_KEYWORD", "60"))
    max_charge = float(os.getenv("JOBS_BACKFILL_MAX_TOTAL_CHARGE_USD", "5"))
    posted_since = os.getenv("JOBS_BACKFILL_POSTED_SINCE", "7 days").strip() or "7 days"
    job_type = os.getenv("JOBS_BACKFILL_JOB_TYPE", "all").strip() or "all"
    remote_only = _truthy("JOBS_BACKFILL_REMOTE_ONLY", "false")
    replace_all = _truthy("JOBS_BACKFILL_REPLACE_ALL", "false")
    timeout_sec = int(os.getenv("JOBS_BACKFILL_TIMEOUT_SEC", "300"))

    db = SessionLocal()
    try:
        if replace_all:
            print("JOBS_BACKFILL_REPLACE_ALL=true — clearing user_job_matches and jobs …")
            db.execute(text("DELETE FROM user_job_matches"))
            db.execute(text("DELETE FROM jobs"))
            db.commit()

        collected: list[JobListing] = []
        seen: set[str] = set()

        for kw in _keywords():
            print(f"Fetching Apify jobs for keyword={kw!r} country={country!r} …")
            batch = fetch_apify_jobs(
                keyword=kw,
                country=country,
                token=token,
                max_results=max_per,
                remote_only=remote_only,
                job_type=job_type,
                posted_since=posted_since,
                location=location,
                max_total_charge_usd=max_charge,
                timeout_sec=timeout_sec,
            )
            for jl in batch:
                if jl.id in seen:
                    continue
                seen.add(jl.id)
                collected.append(jl)
            print(f"  → {len(batch)} rows from Apify ({len(collected)} unique so far)")

        if not collected:
            print("No jobs returned; exiting without DB changes.")
            return

        inserted = 0
        updated = 0
        for jl in collected:
            existing = db.query(Job).filter(Job.id == jl.id).first()
            if existing:
                updated += 1
            else:
                inserted += 1
            db.merge(
                Job(
                    id=jl.id,
                    job_title=jl.job_title,
                    company_name=jl.company_name,
                    location=jl.location or "Remote",
                    job_description=jl.job_description,
                    salary_range=jl.salary_range,
                    job_listing_link=jl.job_listing_link,
                    remote_allowed=bool(jl.remote_allowed),
                    experience_level=jl.experience_level,
                    skills_required=jl.skills_required or [],
                )
            )
        db.commit()
        print(f"Upserted {len(collected)} jobs (inserted≈{inserted}, updated≈{updated}). Embedding …")
        store_job_vectors(collected)
        print("Done.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
