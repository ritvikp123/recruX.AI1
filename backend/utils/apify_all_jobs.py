"""
Server-side client for Apify actor agentx/all-jobs-scraper (All Jobs Scraper).
Used by scheduled backfill; keep token in APIFY_TOKEN (never VITE_*).
"""

from __future__ import annotations

import os
import re
from typing import Any
from urllib.parse import urlencode

import httpx

from models.schemas import JobListing

APIFY_ALL_JOBS_ACTOR_ID = "jpraRc4MCUh5ehbHV"
RUN_SYNC = f"https://api.apify.com/v2/acts/{APIFY_ALL_JOBS_ACTOR_ID}/run-sync-get-dataset-items"

APIFY_ALLOWED_COUNTRIES = frozenset(
    {
        "Argentina",
        "Australia",
        "Austria",
        "Bahrain",
        "Bangladesh",
        "Belgium",
        "Bulgaria",
        "Brazil",
        "Canada",
        "Chile",
        "China",
        "Colombia",
        "Costa Rica",
        "Croatia",
        "Cyprus",
        "Czech Republic",
        "Denmark",
        "Ecuador",
        "Egypt",
        "Estonia",
        "Finland",
        "France",
        "Germany",
        "Greece",
        "Hong Kong",
        "Hungary",
        "India",
        "Indonesia",
        "Ireland",
        "Israel",
        "Italy",
        "Japan",
        "Kuwait",
        "Latvia",
        "Lithuania",
        "Luxembourg",
        "Malaysia",
        "Malta",
        "Mexico",
        "Morocco",
        "Netherlands",
        "New Zealand",
        "Nigeria",
        "Norway",
        "Oman",
        "Pakistan",
        "Panama",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Qatar",
        "Romania",
        "Saudi Arabia",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "South Africa",
        "South Korea",
        "Spain",
        "Sweden",
        "Switzerland",
        "Taiwan",
        "Thailand",
        "Turkey",
        "Ukraine",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "Uruguay",
        "Venezuela",
        "Vietnam",
    }
)

_COUNTRY_ALIASES = {
    "usa": "United States",
    "us": "United States",
    "u.s.a": "United States",
    "u.s.a.": "United States",
    "u.s": "United States",
    "u.s.": "United States",
    "america": "United States",
    "uk": "United Kingdom",
    "u.k": "United Kingdom",
    "u.k.": "United Kingdom",
    "britain": "United Kingdom",
    "england": "United Kingdom",
    "uae": "United Arab Emirates",
    "korea": "South Korea",
}


def _strip_quotes(s: str) -> str:
    t = s.strip()
    while (t.startswith('"') and t.endswith('"')) or (t.startswith("'") and t.endswith("'")):
        t = t[1:-1].strip()
    return t


def resolve_country_for_apify(raw: str | None, fallback: str = "United States") -> str:
    cleaned = _strip_quotes((raw or "").strip())
    if not cleaned:
        return fallback
    lower = cleaned.lower()
    if lower in _COUNTRY_ALIASES:
        return _COUNTRY_ALIASES[lower]
    if cleaned in APIFY_ALLOWED_COUNTRIES:
        return cleaned
    canon = next((c for c in APIFY_ALLOWED_COUNTRIES if c.lower() == lower), None)
    if canon:
        return canon
    print(f"[apify] Unknown country {cleaned!r} — using {fallback!r}. Fix JOBS_BACKFILL_COUNTRY.")
    return fallback


def _skills_list(skills: Any) -> list[str]:
    if isinstance(skills, list):
        return [str(s).strip() for s in skills if s]
    if isinstance(skills, str) and skills.strip():
        return [p.strip() for p in re.split(r"[,;]", skills) if p.strip()]
    return []


def _salary_range(item: dict[str, Any]) -> str | None:
    lo, hi = item.get("salary_minimum"), item.get("salary_maximum")
    cur = item.get("salary_currency") or ""
    period = item.get("salary_period") or ""
    if isinstance(lo, (int, float)) and isinstance(hi, (int, float)):
        return f"{lo}-{hi} {cur} ({period})".strip()
    return None


def apify_record_to_job_listing(item: dict[str, Any]) -> JobListing:
    platform_url = str(item.get("platform_url") or "")
    official_url = str(item.get("official_url") or "")
    title = str(item.get("title") or "")
    company = str(item.get("company_name") or "")
    posted = str(item.get("posted_date") or "")
    jid = platform_url or official_url or f"apify:{item.get('platform','job')}:{title}:{company}:{posted}"

    return JobListing(
        id=jid[:2048],
        job_title=title,
        company_name=company,
        location=str(item.get("location") or "Remote"),
        job_description=str(item.get("description") or ""),
        salary_range=_salary_range(item),
        job_listing_link=(official_url or platform_url or "#")[:4096],
        remote_allowed=bool(item.get("is_remote")),
        experience_level=str(item.get("experience_range") or "") or None,
        skills_required=_skills_list(item.get("skills")),
    )


def fetch_apify_jobs(
    *,
    keyword: str,
    country: str,
    token: str,
    max_results: int = 50,
    remote_only: bool = False,
    job_type: str = "all",
    posted_since: str = "7 days",
    location: str | None = None,
    max_total_charge_usd: float = 5.0,
    timeout_sec: int = 300,
) -> list[JobListing]:
    """
    Run All Jobs Scraper synchronously and return JobListing rows.
    """
    token = (token or "").strip()
    if not token:
        raise RuntimeError("APIFY_TOKEN is not set")

    country = resolve_country_for_apify(country)
    body: dict[str, Any] = {
        "keyword": keyword,
        "country": country,
        "max_results": min(1000, max(1, max_results)),
        "remote_only": remote_only,
        "posted_since": posted_since,
        "job_type": job_type,
        "currency": "USD",
    }
    if location and location.strip():
        body["location"] = location.strip()

    params = {
        "timeout": str(timeout_sec),
        "limit": str(max_results),
        "offset": "0",
        "maxTotalChargeUsd": str(max_total_charge_usd),
    }
    url = f"{RUN_SYNC}?{urlencode(params)}"

    with httpx.Client(timeout=timeout_sec + 30) as client:
        r = client.post(
            url,
            json=body,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
    if r.status_code >= 400:
        detail = r.text[:2000]
        try:
            err = r.json()
            if isinstance(err, dict) and err.get("error"):
                detail = str(err["error"].get("message") or err["error"])
        except Exception:
            pass
        raise RuntimeError(f"Apify HTTP {r.status_code}: {detail}")

    data = r.json()
    rows: list[dict[str, Any]]
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict) and isinstance(data.get("items"), list):
        rows = data["items"]
    else:
        rows = []

    return [apify_record_to_job_listing(row) for row in rows if isinstance(row, dict)]


def get_apify_token() -> str:
    return (os.getenv("APIFY_TOKEN") or os.getenv("APIFY_API_TOKEN") or "").strip()
