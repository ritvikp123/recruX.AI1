# Recrux — Product features (codebase inventory)

This document summarizes features **present in the current Recrux.AI / Recrux frontend and backend** as implemented in this repository. Some UI paths are **demos or mocks** (called out below).

---

## Branding & shell

- **Recrux** marketing theme (colors, typography, “Recrux” job cards).
- **App shell** with top navigation: Dashboard, Jobs, Saved, Applied, Resume, Progress, Roadmap, Settings.
- **Search** field in the navbar (jobs search context).
- **Sign out** and user affordances on authenticated routes.

---

## Public & authentication

- **Landing page** (`/`) — marketing hero, feature highlights, preview match cards (illustrative), CTAs to sign in / get started (unauthenticated users are redirected to `/dashboard` when logged in).
- **Sign in** (`/signin`) — email/password; **Google** OAuth; **LinkedIn** OAuth (`linkedin_oidc`); redirects to `/auth/callback` after OAuth.
- **Sign up** (`/signup`) — email/password registration; **Google** and **GitHub** OAuth (LinkedIn not on sign-up in current UI).
- **Auth callback** (`/auth/callback`) — processes Supabase OAuth return, syncs session, optional onboarding draft persistence.
- **Forgot / reset password** (`/reset-password`) — password reset email flow via Supabase.
- **Protected routes** — main app areas require a Supabase session.

---

## Onboarding

- **Get started** (`/get-started`) — `OnboardingFlow` component for first-time preference capture (pairs with onboarding preferences / Supabase persistence where configured).

---

## Dashboard (`/dashboard`)

- **Stats** — applied count, saved count, average match-style metrics (from store + jobs).
- **Streak / activity** — streak bar visualization.
- **Match tabs** — e.g. high matches, saved, recently viewed (grouped job lists).
- **Job cards** — company, title, location, match badge, save, apply actions; match breakdown UI.
- **Resume context** — loads resume text from Supabase when available for matching UX.
- **AI Copilot (floating chat)** — bottom-right panel; suggested prompts; **`POST /api/chat`** with resume context; dev mock only if the request fails. *Backend:* **`get_llm_prose()`** + escaped **`{{ "key": "value" }}`** in **`chat_agent`** system prompt so LangChain does not treat **`key`** as a template variable. *See **Problems checklist** → AI Copilot for residual risks.*
- **Loading / empty states** — skeletons and empty states when no jobs.

---

## Jobs (`/jobs`)

- **Live job search** via **JSearch (RapidAPI)** when `VITE_RAPIDAPI_KEY` is set; fallback/mock listings if the API is missing or errors.
- **Filters** — location, remote, salary, company, match threshold, sort options (per UI).
- **Client-side match scores** — heuristic `computeMatchScore` from resume text + job (separate from backend `/api/jobs/score` unless wired).
- **Save / apply** — integrates with Supabase `saved_jobs` / `applications` via `savedJobsApi`.

---

## Saved jobs (`/saved`)

- List of **saved roles** with job cards; unsave; navigate to job flows.

---

## Applied jobs (`/applied`)

- **Application pipeline** view — roles marked applied; resolves job details from store or stub when metadata is missing.

---

## Resume optimizer (`/resume`)

- **PDF upload** to Supabase Storage (`resumes` bucket).
- **Backend parse** — `parseResume()` → **`POST /api/resume/parse`** — structured summary, experience, skills, raw text.
- **Parsed sections** UI — summary, experience, skills (from API + local state).
- **Profile sync** — upserts `profiles` with `resume_text` and skills when parse succeeds.
- **Optimize for job** tab — controlled JD textarea; **`POST /api/resume/optimize`** returns tailored bullets (Ollama via **`get_llm_prose`**).
- **Why you didn’t get it** tab — **`POST /api/resume/gap-why`** returns gap / quick-win narrative from resume + JD.

---

## Progress (`/progress`)

- **Activity / contribution-style grid** — deterministic visuals tied to filters and applied activity; sample patterns when little data.

---

## Roadmap (`/roadmap`)

- **Career roadmap planner** — role selection, timeframe, goal-oriented phase templates (large interactive UI).
- Can call backend **`POST /api/roadmap`** when integrated for LLM-generated roadmap JSON (backend supports normalization and fallbacks).

---

## Settings (`/settings`)

- **Profile** — name, target field, experience level, skills (comma-separated input), ties to Supabase `profiles` / preferences as implemented.
- **Preferences toggles** — notification-style settings (per UI sections).
- **Account** — sign out / navigation patterns.

---

## Data & integrations (frontend)

- **Supabase** — authentication, `profiles`, `user_preferences`, `saved_jobs`, `applications`, storage for resumes (table names must match your migrations).
- **Environment** — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (FastAPI), `VITE_RAPIDAPI_KEY` (JSearch).

---

## Backend (FastAPI) — API surface

Base path: `/api` (plus `/api/auth` for email auth).

| Endpoint | Purpose |
|----------|---------|
| `POST /api/resume/parse` | Full resume parse (PDF/DOCX text → structured LLM output). |
| `POST /api/resume/extract` | Fast extract: raw text + keyword skills (no full LLM parse). |
| `POST /api/resume/optimize` | Tailor experience bullets to a job description (plain text). |
| `POST /api/resume/gap-why` | Explain likely gaps vs job (plain text). |
| `POST /api/jobs/search` | Job search agent (skills/role). |
| `POST /api/jobs/score` | Score resume vs one or more job descriptions. |
| `POST /api/jobs/match` | LangGraph-style orchestration: parse → search → score. |
| `POST /api/chat` | Career assistant chat (RAG + user context). |
| `POST /api/roadmap` | Career roadmap JSON from goal + optional resume. |
| `GET /api/profile/{profile_id}` | Stored profile fetch. |
| `POST /api/auth/signup`, `POST /api/auth/login` | Email/password auth (JWT) — parallel to Supabase auth in UI. |

---

## Optional SQL (frontend `supabase/migrations`)

- **`001_recrux_tables.sql`** — defines `saved_jobs`, `applications`, optional `skill_gaps` / `streaks` with RLS; use if your Supabase project does not already have equivalent tables from root `supabase/migrations`.

---

## Problems checklist (master list)

Canonical backlog / risk list. Items stay open until explicitly removed.

### Jobs & listings

- **A1 / JSearch key** — real jobs load when configured (working).
- **A2** — *How solved:* Frontend (`useJobStore`) only uses **demo jobs** in **dev** when the JSearch key is **missing**; it no longer silently invents mock jobs on other API errors (quota/network/etc). Non-key failures now surface an error and return **0 jobs** instead of showing fake data.
- **A3** — *How solved:* `jsearch.ts` now throws clearer request errors (includes HTTP status + response details when available), and the store no longer routes those errors into mock listings except for the explicit “missing key in dev” case.
- **A4** — *How solved:* Backend `job_search_agent` dummy fallback is now **disabled by default**; it only loads `dummy_jobs.json` when `ALLOW_DUMMY_JOBS=true`. Otherwise, if both JSearch + Arbeitnow fail, it returns **[]** (0 jobs) rather than silently serving dummy data.

### Match scores

- **`matchScore.ts` / list cards** — Client keyword score + random 55–80 with no resume; job list sorting still uses this heuristic unless you batch-call `/api/jobs/score` per card. *Mitigated (detail panel — still listed for list):* **`POST /api/jobs/score`** accepts a proper JSON body via **`JobScoreRequest`** (OpenAPI/Swagger works). On **Jobs**, selecting a job calls **`scoreJob`** with **`resume_text`** + built job string; **`apiMatchScore`** + **`reasoning`** drive the panel; empty resume shows guidance. **Dashboard** preview cards still use client **`computeMatchScore`** unless extended.
- **Match breakdown** — Bars are still **synthetic dimensions** (offsets from one %, fixed Education) or **Dashboard defaults**; not per-axis scores from the API. *Partially addressed:* **`breakdownForJob`** uses **`apiMatchScore`** when the AI score returned for the **selected** job, so the overall bar heights align with **`/api/jobs/score`**. **Skill gaps** chips remain **hardcoded** until the API exposes structured gaps.

### AI Copilot

- **Was / causes of mock:** **`/api/chat`** **500** (e.g. Ollama forced into **JSON mode** via **`get_llm()`** while the prompt asked for plain English; LangChain **`ChatPromptTemplate`** treated **`{ "key": "value" }`** in the system string as a missing **`{key}`** variable → **`INVALID_PROMPT_INPUT`**). Frontend **`DashboardAIBottomChat`** then shows **Mock:** in **dev** when **`fetch`** fails.
- *How solved:* **`chat_agent.py`** uses **`get_llm_prose()`** instead of **`get_llm()`** (no Ollama **`format: json`** for chat). System prompt example **`{{ "key": "value" }}`** (doubled braces) so only **`{context}`** remains a real template variable. Frontend unchanged except existing headers + **`formatAssistantReply`**.
- **Still listed:** Mock fallback if **network / wrong `VITE_API_URL` / Ollama down**; **`formatAssistantReply`** may not cover all JSON-shaped replies; model can still drift from strict “plain English”; prod shows unavailable string instead of mock.

### Resume optimizer

- **Was:** “Optimize (mock)” fake streaming text; **“Why you didn’t get it”** static copy; JD field used **`defaultValue`** demo text and didn’t drive any API. *How solved:* **`POST /api/resume/optimize`** and **`POST /api/resume/gap-why`** in **`agent_router.py`** with **`ResumeTailorRequest`** / **`ResumeTailorTextResponse`**; **`agents/resume_tailor_agent.py`** uses **`get_llm_prose()`** (plain text, not JSON mode). **`ResumeOptimizer.tsx`** — controlled **`jobDescription`**, **`resumeText`** from **`useJobStore`**, **`resumeOptimizeForJob`** / **`resumeGapWhy`** from **`lib/api.ts`**, parse failures **`alert`** instead of silent **`catch`**. *Still listed / residual:* output quality depends on **Ollama model**; **no streaming**; user needs **resume text** in store (upload parse or profile); multi-resume / delete flows remain separate backlog items under **Resume storage & lifecycle**.

### Other stubs / demos

- **AppliedJobs** — `stubJob` when metadata missing.
- **Landing** — preview cards are fixed demos.
- **Progress** — sample charts when little activity.
- **Roadmap** — heavy templates; optional `/api/roadmap` integration.
- **`lib/supabase.ts`** — placeholder if env missing.

### Per-user data & security

- RLS + `user_id` on all user tables; audit Supabase calls.
- Two-account test (A vs B).
- Supabase Auth vs FastAPI `/api/auth` — clear profile ownership.

### Resume storage & lifecycle

- Per-user Storage paths + policies.
- Single vs multiple resumes (product + UI).
- Replace upload (no orphans).
- Delete resume → Storage + `profiles` cleared.
- Parsed text in sync with file.

### Applied jobs UX

- **“Did you apply?”** — Yes → record (optional go to `/applied`); No → don’t record, stay.

### Misc

- `types/job.ts` / comments — cleanup when mocks are gone.

### Expanded notes (RLS & storage — audit detail)

- **User-scoped rows:** Every Supabase row (`profiles`, `saved_jobs`, `applications`, `user_preferences`, storage objects) must be constrained to **`auth.uid()`** via RLS and correct keys on write. Missing RLS or wrong filters risk cross-account reads/writes.
- **Storage:** Paths like `{user_id}/resume.pdf`, replace/upsert policies, and delete flows that remove objects and clear `resume_text` when intended.

---

*Generated from repository structure and routes (`frontend/src/main.tsx`, pages, and `backend/routers/agent_router.py`). Update this file when major features ship.*
