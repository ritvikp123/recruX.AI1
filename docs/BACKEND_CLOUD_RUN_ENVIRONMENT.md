# Backend (Cloud Run) — environment variables & secrets

Set these on the **Cloud Run service** that runs the FastAPI app (`recruix-backend`). Use **Secret Manager** for passwords and API keys; reference secrets as env vars in Cloud Run.

Values below match what the code reads (`backend/main.py`, `backend/utils/*.py`, `backend/utils/llm_factory.py`).

---

## Required (production API will break without these)

| Name | Secret? | Example / notes |
|------|-----------|-----------------|
| **`DATABASE_URL`** | Yes | Postgres URI (Supabase pooler or Cloud SQL). Strip stray `\r` when pasting. |
| **`SUPABASE_URL`** | No (public URL) | `https://xxxx.supabase.co` — **no trailing slash**. Same project as the frontend. Used to fetch JWKS for JWT verification on `/api/resume/*`, etc. |
| **`CORS_ORIGINS`** | No | Comma-separated **exact** browser origins, e.g. `https://recrux.ai,https://www.recrux.ai`. Include **both** apex and `www` if you use both. Wrong/missing origin → browser blocks fetch (“Could not reach the API”). |
| **`LLM_PROVIDER`** | No | `vertex` \| `openai` \| `google` \| `ollama` — must match how you configure keys below. |
| **`EMBEDDINGS_PROVIDER`** | No | Usually same family as LLM for prod (`vertex` with Vertex). |

---

## Vertex AI (when `LLM_PROVIDER` / `EMBEDDINGS_PROVIDER` = `vertex`)

Cloud Run should use the **service account** attached to the revision (recommended). Grant that SA **Vertex AI User** (and any needed IAM for your project).

| Name | Secret? | Notes |
|------|-----------|-------|
| **`VERTEX_PROJECT`** | No | GCP project id, e.g. `recruix-backend-prod`. Fallback: `GOOGLE_CLOUD_PROJECT`. |
| **`VERTEX_LOCATION`** | No | e.g. `us-central1`. Fallback: `GOOGLE_CLOUD_LOCATION`. |
| **`VERTEX_MODEL`** | No | e.g. `gemini-1.5-flash` |
| **`VERTEX_EMBED_MODEL`** | No | Optional; default `text-embedding-004` |

No JSON key file is required if the Cloud Run **service account** has Vertex access (Workload Identity).

---

## Contact form (`POST /api/contact`)

Sends email via **[Resend](https://resend.com/)** (no `mailto:`). Public route; no login required.

| Name | Secret? | Notes |
|------|-----------|--------|
| **`RESEND_API_KEY`** | Yes | Create at Resend → API Keys. Required or contact returns **503**. |
| **`CONTACT_EMAIL_TO`** | No | Inbox receiving submissions. Default `annikap@synergyers.com`. |
| **`CONTACT_EMAIL_FROM`** | No | Must be allowed by Resend (verified domain or `Recrux <onboarding@resend.dev>` for testing). |

---

## OpenAI (when provider = `openai`)

| Name | Secret? |
|------|---------|
| **`OPENAI_API_KEY`** | Yes |
| **`OPENAI_MODEL`** | No (optional) |
| **`OPENAI_EMBED_MODEL`** | No (optional) |

---

## Google AI Studio / Gemini API (when provider = `google`)

| Name | Secret? |
|------|---------|
| **`GEMINI_API_KEY`** or **`GOOGLE_API_KEY`** | Yes |
| **`GEMINI_MODEL`** / **`GEMINI_EMBED_MODEL`** | No (optional) |

---

## Ollama (local / special deploy only)

| Name | Notes |
|------|--------|
| **`OLLAMA_BASE_URL`** | e.g. `http://localhost:11434` — not typical on standard Cloud Run unless you proxy to a VM. |
| **`OLLAMA_MODEL`**, **`OLLAMA_EMBED_MODEL`** | |
| **`OLLAMA_ROADMAP_READ_TIMEOUT`**, **`OLLAMA_CONNECT_TIMEOUT`**, **`OLLAMA_ROADMAP_NUM_PREDICT`** | Optional tuning (`agent_router.py`). |

---

## Optional / safety / legacy

| Name | Purpose |
|------|---------|
| **`VITE_SUPABASE_URL`** | Fallback if `SUPABASE_URL` unset (same value as Supabase project URL). |
| **`SECRET_KEY`**, **`ALGORITHM`** | Legacy FastAPI JWT **signing** in `auth_utils`; **Supabase JWT verification** uses JWKS from `SUPABASE_URL`. Set a strong `SECRET_KEY` if you still use backend-issued tokens from `auth_router`. |
| **`ENV`** / **`ENVIRONMENT`** / **`FASTAPI_ENV`** | If set to `production` / `prod` / `staging`, affects dummy-job guardrails in `job_search_agent.py`. |
| **`ALLOW_DUMMY_JOBS`** | Default `false`. Only for local demos. |
| **`CORS_DEBUG`** | `true` → logs allowed CORS origins at startup. |
| **`ROADMAP_RESUME_MAX_CHARS`** | Optional cap for roadmap payload. |

---

## Cloud Run **Job** only (scheduled Apify backfill)

Not needed on the **HTTP service** unless you run the script there. On the **job** that runs `python scripts/daily_apify_backfill.py`:

| Name | Secret? |
|------|---------|
| **`APIFY_TOKEN`** | Yes |
| **`DATABASE_URL`** | Yes (same DB as service) |
| Same **Vertex** (or embedding) vars as the API | So `store_job_vectors` can embed |
| **`JOBS_BACKFILL_*`** | See `backend/.env.example` (keywords, country, caps, `REPLACE_ALL`, etc.) |

---

## Not set manually on Cloud Run

| Name | Notes |
|------|--------|
| **`PORT`** | Injected by Cloud Run; your container already uses it. |

---

## Quick copy-paste shape (Vertex + Supabase + dual-site CORS)

```yaml
# Non-secrets (example — replace project URL and origins)
LLM_PROVIDER: vertex
EMBEDDINGS_PROVIDER: vertex
VERTEX_PROJECT: your-gcp-project-id
VERTEX_LOCATION: us-central1
VERTEX_MODEL: gemini-1.5-flash
VERTEX_EMBED_MODEL: text-embedding-004
SUPABASE_URL: https://YOUR_REF.supabase.co
CORS_ORIGINS: "https://recrux.ai,https://www.recrux.ai"

# Prefer Secret Manager references in Console for:
# DATABASE_URL
# (and OPENAI_API_KEY / GEMINI_API_KEY if you use those providers instead)
```

After changing env vars on Cloud Run, **deploy a new revision** so the service picks them up.
