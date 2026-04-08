# Recrux — Manual QA test plan

Use this document to **systematically test the web app** before a release. Fill in **Pass / Fail / Notes** for each case.  
**Tester:** _______________ **Date:** _______________ **Environment:** _______________ (e.g. production URL, staging, local)

---

## 0. Prerequisites (must be true before testing)

| # | Check | Pass? | Notes |
|---|--------|-------|-------|
| P1 | Frontend deployed or running; **exact site URL** recorded | | |
| P2 | `VITE_API_URL` points to the **live FastAPI backend** (HTTPS, no trailing slash issues) | | |
| P3 | **Supabase** project is configured in the frontend (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`); auth and DB tables exist | | |
| P4 | **JSearch / RapidAPI:** `VITE_RAPIDAPI_KEY` or `VITE_JSEARCH_API_KEY` is set in **production** frontend env (otherwise Jobs/Dashboard show an error in prod; dev may use mock jobs) | | |
| P5 | Backend has **Vertex** (or configured LLM), **Cloud SQL** / DB reachable, **CORS** includes your frontend origin(s) | | |
| P6 | Test file available: `docs/test_resume_sample.txt` or a small **PDF/DOCX** resume | | |

**CORS:** Backend must allow the browser origin you use (e.g. `https://recrux.ai`). Wrong CORS = requests fail in the console with CORS errors.

---

## 1. Routes and access control

| # | Path | Logged out | Logged in | Pass? | Notes |
|---|------|------------|-----------|-------|-------|
| R1 | `/` | Landing | Redirects to `/dashboard` | | |
| R2 | `/signin` | Sign-in page | Accessible | | |
| R3 | `/signup` | Sign-up page | Accessible | | |
| R4 | `/get-started` | Onboarding | Accessible | | |
| R5 | `/auth/callback` | OAuth callback | Works after OAuth | | |
| R6 | `/reset-password` | Forgot password UI | — | | |
| R7 | `/dashboard` | Redirect to `/` or sign-in | Dashboard | | |
| R8 | `/jobs` | Blocked | Jobs | | |
| R9 | `/resume` | Blocked | Resume optimizer | | |
| R10 | `/progress` | Blocked | Progress | | |
| R11 | `/saved` | Blocked | Saved jobs | | |
| R12 | `/applied` | Blocked | Applied jobs | | |
| R13 | `/settings` | Blocked | Settings | | |
| R14 | `/roadmap` | Blocked | Roadmap | | |
| R15 | Unknown URL (e.g. `/nope`) | Redirect to `/` | Redirect to `/dashboard` | | |

---

## 2. Authentication (Supabase)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| A1 | Sign up | Register with new email + password | Account created; session established; land on app (or onboarding) | | |
| A2 | Sign in | Sign in with valid user | Session established; redirect to dashboard area | | |
| A3 | Sign out | Use sign out (where exposed) | Session cleared; protected routes require login again | | |
| A4 | Invalid password | Wrong password | Error message; stays on sign-in | | |
| A5 | Session / 401 | If backend returns 401 on API calls | App signs out and sends user to `/signin` (per `api.ts` behavior) | | |

---

## 3. Landing and onboarding

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| L1 | Landing content | Open `/` logged out | Marketing content loads; links to sign in / get started work | | |
| L2 | Onboarding `/get-started` | Complete flow | Preferences saved (if applicable); no console errors | | |

---

## 4. Dashboard (`/dashboard`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| D1 | Load | Open dashboard | Layout: sidebar/nav, stats/cards area loads | | |
| D2 | Resume-dependent UI | User with no profile resume text | Empty or guided state; no crash | | |
| D3 | Resume from Supabase | User with `profiles.resume_text` in Supabase | Text/skills hydrate; match bars reflect content | | |
| D4 | Top matches / preview | With JSearch key configured | List of job cards OR clear error if API fails | | |
| D5 | Tabs (e.g. high / saved / recent) | Switch tabs | Correct lists; empty states OK | | |
| D6 | Save job | Save a job from card | Appears under saved flow / tab | | |
| D7 | Apply flow | Trigger apply / confirm | Modal or flow completes; job recorded as applied where designed | | |
| D8 | Error banner | If JSearch missing in prod | User-visible error explains missing API key (not silent blank) | | |

---

## 5. Jobs (`/jobs`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| J1 | Search | Enter query; search | Job list loads or error is shown | | |
| J2 | URL query `?q=` | Open `/jobs?q=Data+Analyst` | Query prefilled / respected | | |
| J3 | Filters | Employment type, remote, salary min, company filter, work mode, min match %, sort | List updates; sort order changes | | |
| J4 | Match score | Select a job with resume loaded | Match % and breakdown visible; **“Get AI reasoning”** (if present) calls backend `/api/jobs/score` and shows text | | |
| J5 | Save / Apply | Same as dashboard patterns | `saved_jobs` / `applications` updated in Supabase | | |
| J6 | Pagination / load more | If implemented | Extra rows load without duplicate errors | | |

---

## 6. Resume optimizer (`/resume`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| RO1 | Upload PDF/DOCX | Choose file; upload to storage | File stored in Supabase bucket `resumes`; success feedback | | |
| RO2 | Full parse | After upload, full parse | Calls **`POST /api/resume/parse`**; summary/skills populated | | |
| RO3 | Fast extract | If UI exposes fast extract | **`POST /api/resume/extract`** returns `raw_text` + keyword skills | | |
| RO4 | Optimize | Paste JD; run optimize | **`POST /api/resume/optimize`** returns `text`; shows in UI | | |
| RO5 | Gap / why | Paste JD; run gap analysis | **`POST /api/resume/gap-why`** returns `text` | | |
| RO6 | Validation | Run optimize with empty resume or empty JD | UI error message (not silent) | | |
| RO7 | Large file | Upload very large PDF | Graceful error or slow loading; no white screen | | |

---

## 7. AI chat (dashboard bottom panel)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| C1 | Send message | Type question; send | **`POST /api/chat`** returns JSON with `response`; assistant message appears | | |
| C2 | Auth header | While logged in | Request includes `Authorization: Bearer <supabase access_token>` | | |
| C3 | Backend down / wrong URL | Break `VITE_API_URL` temporarily | User sees “assistant unavailable” (prod) or mock (dev only) | | |

---

## 8. Roadmap (`/roadmap`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| RM1 | Role + timeframe | Change dropdowns | Columns (Done / In progress / Next up) update; **client-side template** (no backend call required for this page) | | |
| RM2 | Persistence | Refresh page | Selections behave as designed (localStorage / DB — verify in code if needed) | | |

---

## 9. Progress (`/progress`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| PR1 | Load | Open page | Calendar/heatmap loads from **Supabase `applications`** | | |
| PR2 | Empty | No applications | Empty state, no crash | | |

---

## 10. Saved jobs (`/saved`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| S1 | List | Save jobs from Jobs/Dashboard | Rows appear from **`saved_jobs`** table | | |
| S2 | Unsave | Remove | Row disappears; DB updated | | |

---

## 11. Applied jobs (`/applied`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| AP1 | List | Mark applied | Rows from **`applications`** | | |
| AP2 | Order | Multiple applies | Order matches product rules (e.g. recent first) | | |

---

## 12. Settings (`/settings`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| ST1 | Profile fields | Edit name, field, experience, skills | Saves to **`profiles`** (or intended table); success feedback | | |
| ST2 | Navigation | Links to other sections | Work | | |

---

## 13. Backend API (direct checks)

Use **Swagger** at `{BACKEND_URL}/docs` or curl/Postman.  
Prefix: **`/api`** (e.g. `{BACKEND_URL}/api/resume/parse`).

| # | Method | Path | Body / input | Expected response | Pass? | Notes |
|---|--------|------|----------------|-------------------|-------|-------|
| API1 | GET | `/` | — | `{"message": ...}` health JSON | | |
| API2 | POST | `/api/resume/parse` | `multipart/form-data` file | Structured resume JSON | | |
| API3 | POST | `/api/resume/extract` | file | `raw_text`, `skills` | | |
| API4 | POST | `/api/jobs/search` | JSON `{ "query", "filters" }` | `{ "jobs": [...] }` | | |
| API5 | POST | `/api/jobs/score` | `{ "resume_text", "job_description" }` | `{ "scores": [...] }` | | |
| API6 | POST | `/api/resume/optimize` | `{ "resume_text", "job_description" }` | `{ "text" }` | | |
| API7 | POST | `/api/resume/gap-why` | same | `{ "text" }` | | |
| API8 | POST | `/api/chat` | `{ "message", "user_context" }` | `{ "response" }` | | |
| API9 | POST | `/api/roadmap` | `{ "goal", "resume_text"? }` | Roadmap JSON | | Not all UI may call this — **Roadmap page is template-based** |
| API10 | POST | `/api/jobs/match` | `multipart` file + form `role_name` | Full workflow output | | **Heavy** — optional end-to-end test |

**Auth routes (FastAPI):** `POST /api/auth/signup`, `POST /api/auth/login` — **separate from Supabase**; frontend primarily uses Supabase. Test only if you integrate backend JWT later.

---

## 14. Negative and edge cases

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| N1 | Invalid file type | Upload `.exe` or corrupt file to resume | Clear error | | |
| N2 | Network offline | Turn off network; trigger API action | Graceful error | | |
| N3 | XSS / paste | Paste `<script>` in chat or text fields | No script execution; content escaped or plain | | |
| N4 | Long text | Huge paste in JD or chat | Timeout or truncation; no crash | | |
| N5 | Mobile width | 375px viewport | Usable layout; nav/sidebar accessible | | |

---

## 15. Sign-off

| Area | Tester initials | Date |
|------|-----------------|------|
| Auth & routing | | |
| Jobs & JSearch | | |
| Resume & AI features | | |
| Chat | | |
| Supabase persistence | | |
| Production config (env, CORS) | | |

---

## Appendix: Quick reference — frontend env

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | FastAPI base (e.g. `https://xxx.run.app`) |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_RAPIDAPI_KEY` or `VITE_JSEARCH_API_KEY` | JSearch (RapidAPI) for job listings |

## Appendix: Sample test file

- `docs/test_resume_sample.txt` — upload as `.txt` or use to build a PDF for PDF flow testing.
