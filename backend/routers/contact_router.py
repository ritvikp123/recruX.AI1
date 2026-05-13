"""
Public contact form → outbound email (Resend HTTP API).
No auth required. Configure RESEND_API_KEY + CONTACT_EMAIL_TO on Cloud Run.
"""

from __future__ import annotations

import html
import os
import re
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

router = APIRouter(tags=["Contact"])

RESEND_URL = "https://api.resend.com/emails"
_MAX_NAME = 200
_MAX_MESSAGE = 8000


class ContactPayload(BaseModel):
    name: str = Field(..., min_length=1, max_length=_MAX_NAME)
    email: EmailStr
    message: str = Field(..., min_length=1, max_length=_MAX_MESSAGE)


def _strip_html(s: str) -> str:
    return re.sub(r"<[^>]+>", "", s)


@router.get("/contact")
async def contact_health() -> dict[str, str]:
    """So GET https://…/api/contact returns 200 (verifies deploy + path; form uses POST)."""
    return {
        "service": "recrux-contact",
        "hint": "POST JSON body: name, email, message. Configure RESEND_API_KEY on the server.",
    }


@router.post("/contact")
async def submit_contact(body: ContactPayload) -> dict[str, Any]:
    api_key = (os.getenv("RESEND_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Contact email is not configured. Set RESEND_API_KEY on the backend (see docs).",
        )

    to_addr = (os.getenv("CONTACT_EMAIL_TO") or "annikap@synergyers.com").strip()
    from_addr = (os.getenv("CONTACT_EMAIL_FROM") or "Recrux <onboarding@resend.dev>").strip()

    name = _strip_html(body.name.strip())
    text = body.message.strip()
    reply = str(body.email)

    subject = f"[Recrux contact] {name[:80]}"
    plain = f"Name: {name}\nReply-to: {reply}\n\n{text}"
    safe = html.escape(text)
    html_body = (
        f"<p><strong>Name:</strong> {html.escape(name)}</p>"
        f"<p><strong>Reply-to:</strong> <a href='mailto:{html.escape(reply)}'>{html.escape(reply)}</a></p>"
        f"<p><strong>Message:</strong></p><pre style='white-space:pre-wrap;font-family:inherit'>{safe}</pre>"
    )

    payload = {
        "from": from_addr,
        "to": [to_addr],
        "reply_to": reply,
        "subject": subject[:998],
        "text": plain[:_MAX_MESSAGE + 500],
        "html": html_body[: _MAX_MESSAGE + 2000],
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(
                RESEND_URL,
                json=payload,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach email provider: {e}") from e

    if r.status_code >= 400:
        err = r.text[:2000]
        try:
            data = r.json()
            if isinstance(data, dict) and data.get("message"):
                err = str(data["message"])
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=f"Email send failed ({r.status_code}): {err}")

    return {"ok": True, "id": (r.json() or {}).get("id")}
