# Recrux — end-to-end test run playbook

**Purpose:** Run the site like a user and a QA engineer in **one pass**. Use this for release sign-off, after deploys, or before “next level” launches.

**How to use:** Work **top to bottom**. For each row, mark **P** (pass), **F** (fail), or **S** (skipped / N/A), and jot **Notes** (URL, screenshot link, console error, ticket id).

---

## Run metadata (fill in first)

| Field | Value |
|--------|--------|
| Tester | |
| Date | |
| Environment | e.g. production `https://www.recrux.ai` / staging / local |
| Browser + version | |
| Build / git SHA (if known) | |
| Test account email | |

---

## Part 0 — Five-minute smoke (fail fast)

Do these first. If any fail, fix before deep testing.

| # | Step | Expected | P/F/S | Notes |
|---|------|----------|-------|-------|
| S1 | Open site root (`/`) logged **out** | Landing loads, no blank screen | | |
| S2 | Open `{API_URL}/` in new tab (your Cloud Run base URL) | JSON: backend running message | | |
| S3 | Sign in (same method real users use: Google or email) | Lands on `/dashboard` | | |
| S4 | Navbar → **Jobs** | Page loads; list or clear error (not infinite spinner) | | |
| S5 | Navbar → **Resume** → upload a small **PDF** | Parse completes **or** clear API error (Network tab if “could not reach API”) | | |
| S6 | Sign out | Session cleared; protected routes not accessible | | |

**Smoke tip:** If resume parse fails with “Could not reach the API”, check **DevTools → Network** for `/api/resume/parse` — usually **CORS** (`CORS_ORIGINS` on Cloud Run must include the **exact** origin, e.g. both `https://recrux.ai` and `https://www.recrux.ai`).

---

## Part 1 — Environment gates (must be true for production)

| # | Gate | P/F/S | Notes |
|---|------|-------|-------|
| E1 | Frontend build has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | | |
| E2 | Frontend build has `VITE_API_URL` = HTTPS backend, **no trailing slash** | | |
| E3 | Frontend build has `VITE_APIFY_TOKEN` (live job feed) | | |
| E4 | Optional: `VITE_JOBS_SEARCH_COUNTRY` = exact Apify country (e.g. `United States`) | | |
| E5 | Backend: `DATABASE_URL`, `SUPABASE_URL`, `CORS_ORIGINS`, `LLM_PROVIDER`, `EMBEDDINGS_PROVIDER` (+ Vertex or OpenAI keys as configured) | | |
| E6 | Supabase Auth URLs / redirects include this deployment’s domain | | |
| E7 | DB migrations applied (including `resume_library` on `profiles` if using cloud resume library) | | |
| E8 | Storage bucket `resumes` + RLS for `{user_id}/…` paths | | |

---

## Part 2 — Public site (logged out, incognito)

| # | Route | What to do | Expected | P/F/S | Notes |
|---|--------|------------|----------|-------|-------|
| P1 | `/` | Scroll; click main CTAs (sign in, get started, etc.) | No dead links; no console errors | | |
| P2 | `/` | Footer: Privacy, Terms, Pricing, Contact | Each opens | | |
| P3 | `/privacy` | Read layout | OK on mobile width | | |
| P4 | `/terms` | Read layout | OK | | |
| P5 | `/contact` | Fill / submit if form exists | Validation or success message | | |
| P6 | `/pricing` | View pricing (logged **out**) | Public layout (no app shell) | | |
| P7 | `/signin` | Try invalid password | Error shown; no crash | | |
| P8 | `/signup` | Start registration (use disposable test email if needed) | Success or expected validation | | |
| P9 | `/reset-password` | Trigger forgot-password flow | Email or UI confirmation | | |
| P10 | `/get-started` | Walk first 1–2 onboarding steps | No crash | | |
| P11 | `/auth/callback` | Hit only via real OAuth return | (Usually covered by smoke Google sign-in) | | |
| P12 | `/resume-optimizer` | Navigate directly | Redirects to `/resume` (or sign-in if logged out) | | |
| P13 | `/nonsense-route-xyz` | Random path | Redirect to `/` or `/dashboard` per auth | | |

---

## Part 3 — Authentication

| # | Case | Steps | Expected | P/F/S | Notes |
|---|------|--------|----------|-------|-------|
| A1 | Email sign-in | Valid user | Dashboard | | |
| A2 | Google sign-in | Complete OAuth | Callback → app | | |
| A3 | Sign out | Profile menu | Logged out | | |
| A4 | Deep link while logged out | Open `/jobs` in fresh tab | Redirect to sign-in / home | | |

---

## Part 4 — Logged-in shell & navigation

| # | Check | Expected | P/F/S | Notes |
|---|--------|----------|-------|-------|
| N1 | Click each navbar item: Dashboard, Jobs, Saved, Applied, Resume, Progress, Roadmap, Pricing, Settings | Each route renders; active tab styling OK | | |
| N2 | Navbar **search**: type role → submit | Goes to `/jobs?q=…` | | |
| N3 | Logo / wordmark | Goes to `/dashboard` | | |
| N4 | Profile menu: open, click outside, `Esc` | Closes; sign out works | | |
| N5 | `/pricing` while logged **in** | Shows **inside** AppShell (with nav) | | |

---

## Part 5 — Dashboard (`/dashboard`)

| # | Check | Expected | P/F/S | Notes |
|---|--------|----------|-------|-------|
| D1 | First paint | No long blank screen; spinner resolves | | |
| D2 | User **without** resume text in profile | Sensible empty / CTA state | | |
| D3 | User **with** resume / skills | Cards or stats reflect data | | |
| D4 | “Top matches” / preview area | Jobs or Apify error banner (not silent empty) | | |
| D5 | Any tabs / toggles (saved, recent, filters) | Switching works | | |
| D6 | Save a job from UI (if available) | Appears under Saved path | | |
| D7 | Apply flow (if available) | Confirm modal + applied state | | |

---

## Part 6 — Jobs (`/jobs`)

| # | Control / flow | Expected | P/F/S | Notes |
|---|----------------|----------|-------|-------|
| J1 | Initial load | Jobs appear, skeleton → list, or error message | | |
| J2 | Search / role query field + run search | Refetch; results change or empty state | | |
| J3 | Open `/jobs?q=Data` (or use navbar search) | Query applied | | |
| J4 | **Location** filter | Passed to search (Apify) | | |
| J5 | **Employment type** dropdown | Filters behave | | |
| J6 | **Work mode**: Any / Remote / Hybrid / In-person | Client filter works | | |
| J7 | **Salary min** | Filters list | | |
| J8 | **Min match** presets (60%, 70%, …) | Filters list | | |
| J9 | **Company** text filter | Filters list | | |
| J10 | **Sort** (match, title, company) | Order updates | | |
| J11 | **Clear filters** | Resets UI | | |
| J12 | **Filter panel** open/close | OK on narrow viewport | | |
| J13 | Click a job card | Detail / side panel; description | | |
| J14 | **Save / unsave** | Persists (Supabase `saved_jobs`) | | |
| J15 | **Apply** (+ confirm if modal) | Opens apply URL; records applied | | |
| J16 | **AI match** / score block (with resume text) | Loading → reasoning **or** readable error | | |

---

## Part 7 — Resume (`/resume`)

| # | Check | Expected | P/F/S | Notes |
|---|--------|----------|-------|-------|
| R1 | **Add resume** modal | Open / cancel | | |
| R2 | Upload **PDF** (under size limit) | Parse or fast-extract; success toast/alert | | |
| R3 | Upload **DOCX** | Same | | |
| R4 | File too large | Friendly rejection | | |
| R5 | Library shows entry; `x/5` count | Correct | | |
| R6 | **Set primary** | Profile + zustand match text update | | |
| R7 | **Remove** resume | Storage + DB library; if last, clears profile text | | |
| R8 | **Preview** saved resume | Sections / preview URL | | |
| R9 | **Optimize** tab: paste JD → run | Response or API error | | |
| R10 | **Why gaps** tab: paste JD → run | Response or API error | | |
| R11 | **Reload** page | Library restored from **Supabase** `resume_library` | | |

---

## Part 8 — Saved & applied

| # | Page | Check | P/F/S | Notes |
|---|------|--------|-------|-------|
| SA1 | `/saved` | List matches DB; unsave works | | |
| SA2 | `/applied` | Shows applications; links work | | |

---

## Part 9 — Progress & roadmap

| # | Route | Check | P/F/S | Notes |
|---|--------|--------|-------|-------|
| PR1 | `/progress` | Main view loads; no crash | | |
| PR2 | `/progress/weekday/0` (try `0`–`6` if used) | Drilldown loads | | |
| RM1 | `/roadmap` | Content + any AI actions | | |

---

## Part 10 — Settings (`/settings`)

| # | Check | P/F/S | Notes |
|---|--------|-------|-------|
| T1 | Form loads from Supabase | | |
| T2 | Edit fields | | |
| T3 | Save | Success message; survives reload | | |

---

## Part 11 — Onboarding (`/get-started`)

| # | Check | P/F/S | Notes |
|---|--------|-------|-------|
| O1 | Complete flow (or major steps) | Preferences persist | | |
| O2 | Validation on incomplete step | Blocked with hint | | |

---

## Part 12 — Quality bar

| # | Check | P/F/S | Notes |
|---|--------|-------|-------|
| Q1 | No console **errors** on happy paths | | |
| Q2 | **Mobile** width ~375px: nav + Jobs filters usable | | |
| Q3 | Keyboard: focus visible on primary actions | | |

---

## Part 13 — Sign-off

| Question | Yes / No | Notes |
|----------|----------|-------|
| Smoke (Part 0) all pass? | | |
| Any **F** without ticket / fix owner? | | |
| Ready to promote this build? | | |

**Approver:** __________________ **Date:** __________________

---

## Related docs

- `docs/FULL_SITE_RELEASE_TEST_CHECKLIST.md` — longer variant with more prerequisite detail  
- `docs/MANUAL_QA_TEST_PLAN.md` — original manual QA matrix  
- `docs/BACKEND_CLOUD_RUN_ENVIRONMENT.md` — backend env / secrets reference  
