# Recrux — Full site release test checklist

Use this document to **walk every page and major control** before promoting a build (staging → production, or production → “next level”).  
Record **Pass / Fail / Notes** and the **exact environment** (URL, browser, date).

**Tester:** _______________ **Date:** _______________ **Site URL:** _______________ **Browser:** _______________

---

## Prerequisites (block release if any fail)

| # | Check | Pass? | Notes |
|---|--------|-------|-------|
| P0 | **Supabase:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` set on the **hosting** build; SQL migrations applied (including `resume_library` on `profiles` if using cloud resume library) | | |
| P1 | **Backend API:** `VITE_API_URL` = HTTPS Cloud Run URL **with no trailing slash** (e.g. `https://recruix-backend-xxxxx-uc.a.run.app`) | | |
| P2 | **CORS on Cloud Run:** `CORS_ORIGINS` includes **every** origin users use, **character-for-character**: `https://recrux.ai`, `https://www.recrux.ai` (both if you use both). Missing `www` breaks `www.recrux.ai` with “Could not reach the API” (browser blocks the request). | | |
| P3 | **Apify (live job listings):** `VITE_APIFY_TOKEN` set on frontend build for production Jobs/Dashboard live feed | | |
| P4 | **Optional:** `VITE_JOBS_SEARCH_COUNTRY` = exact Apify country label (e.g. `United States`) | | |
| P5 | **Backend health:** Open `GET {VITE_API_URL}/` → JSON `Recrux.AI Backend is running...` | | |
| P6 | **Auth:** Supabase Auth URLs (Site URL / redirect) include your production domain | | |
| P7 | **Storage:** Supabase bucket `resumes` exists; RLS policies allow `{user_id}/...` paths (see `004_storage_resumes.sql`) | | |

### Resume parse / “Could not reach the API” (see screenshot)

That alert means the **browser never got a normal HTTP response** from the backend (network failure or CORS preflight failure).

**Do this in order:**

1. **DevTools → Network** → upload again → find the request to `/api/resume/parse` (full URL should be your Cloud Run host + `/api/resume/parse`).
2. If status is **(failed)** or **CORS error** in console:
   - Add the **exact** page origin to Cloud Run env **`CORS_ORIGINS`** (comma-separated), redeploy backend.
   - Include both apex and `www` if both are live.
3. If status is **401**: sign in; resume routes require a Supabase session **Bearer** token.
4. If status is **502/503/504**: Cloud Run cold start, timeout, or Vertex/DB misconfig — check **Cloud Run logs**.
5. If no request appears: ad-blocker, mixed content, or wrong `VITE_API_URL` — fix env and **rebuild** the frontend (Vite bakes `VITE_*` at build time).

---

## 1. Public marketing & legal (logged out)

| # | Page / path | Actions to try | Expected | Pass? | Notes |
|---|----------------|----------------|----------|-------|-------|
| M1 | `/` | Read hero, scroll, click primary CTAs (Sign in / Get started / any demo links) | No broken links; no console errors | | |
| M2 | `/` | Footer: Privacy, Terms, Pricing, Contact | Each route loads | | |
| M3 | `/privacy` | Read; internal links | Renders; layout OK | | |
| M4 | `/terms` | Read | Renders | | |
| M5 | `/contact` | Submit or use contact UI if present | Validation / success or clear error | | |
| M6 | `/pricing` | **Logged out** — open `/pricing` | Public pricing layout (no app shell) | | |
| M7 | `/signin` | Email/password fields, “forgot password”, Google OAuth if enabled | All controls work | | |
| M8 | `/signup` | Register flow | Creates user or shows error | | |
| M9 | `/reset-password` | Request reset email (if configured) | Supabase email flow or message | | |
| M10 | `/get-started` | Start onboarding logged out or in | Flow runs without crash | | |

---

## 2. Authentication & session

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| A1 | Sign in (email) | Valid credentials | Redirect to `/dashboard` | | |
| A2 | Sign in (Google) | OAuth | Returns via `/auth/callback`; lands in app | | |
| A3 | Sign out | Profile menu → Sign out | Session cleared; `/` or sign-in | | |
| A4 | Protected URL while logged out | Visit `/jobs` | Redirect to sign-in / home per app rules | | |
| A5 | Session expiry / 401 on API | If backend returns 401 | Redirect to `/signin` (per client) | | |

---

## 3. Global shell (logged in)

| # | Control | Steps | Expected | Pass? | Notes |
|---|---------|--------|----------|-------|-------|
| G1 | Navbar tabs | Click Dashboard, Jobs, Saved, Applied, Resume, Progress, Roadmap, Pricing, Settings | Each route loads; active state OK | | |
| G2 | Navbar search | Type query → submit | Navigates to `/jobs?q=...` | | |
| G3 | Logo / wordmark | Click | Goes to `/dashboard` | | |
| G4 | Profile menu | Open, click outside, Escape | Opens/closes; sign out works | | |
| G5 | `/pricing` **logged in** | Open `/pricing` | In **AppShell** (with nav), not bare public page | | |

---

## 4. Dashboard (`/dashboard`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| D1 | Initial load | Open dashboard | No white screen; loading then content | | |
| D2 | No resume | User with empty `resume_text` | Empty/guided state; no crash | | |
| D3 | With resume | User with profile resume | Skills / text hydrate from Supabase | | |
| D4 | Top matches | Wait for preview | Cards **or** clear error (Apify / backend) | | |
| D5 | Tabs / sections | Switch any tabbed UI (high match, saved, recent, etc.) | Correct panels | | |
| D6 | Save job | Save from card | Shows in Saved flow | | |
| D7 | Apply | Apply + confirm if modal | Recorded under Applied where designed | | |
| D8 | Links to Jobs / Resume | Click through | Navigation works | | |

---

## 5. Jobs (`/jobs`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| J1 | Load listings | Open `/jobs` | List or skeleton then cards **or** error banner | | |
| J2 | Search query | Change role/title field → Search / refresh | New results or message | | |
| J3 | Navbar `?q=` | From nav search land with `q` | Query prefilled; fetch runs | | |
| J4 | Location filter | Set location, search | Request includes location (Apify) | | |
| J5 | Employment type | Any / Full-time / Contractor / Part-time / Intern | Filters apply | | |
| J6 | Work mode | Any / Remote / Hybrid / In-person | Filters client list | | |
| J7 | Salary min | Enter min filter | List filters | | |
| J8 | Min match % | 60% / 70% / 80%+ | List filters | | |
| J9 | Company filter | Type company substring | List filters | | |
| J10 | Sort | Match desc/asc, title, company | Order changes | | |
| J11 | Clear filters | Clear all | Resets controls | | |
| J12 | Filter drawer / panel | Open/close filters UI | UX OK on mobile width | | |
| J13 | Select job | Click card | Detail panel; description visible | | |
| J14 | Save / unsave | Toggle save | State updates | | |
| J15 | Apply | Open apply link + confirm | External tab + local applied state | | |
| J16 | AI match notes | With resume text, select job | Loading / reasoning **or** error text | | |
| J17 | Link to Applied | “View applied” or similar | `/applied` works | | |

---

## 6. Resume (`/resume` — Resume optimizer)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| R1 | Add Resume modal | Open modal, cancel | Modal closes | | |
| R2 | Upload PDF | Valid small PDF, signed in | Upload succeeds; parse **or** fast-extract fallback | | |
| R3 | Upload DOCX | Valid DOCX | Same | | |
| R4 | Oversized file | >10MB if limit enforced | Friendly alert | | |
| R5 | Library list | After upload | Entry appears; count `x/5` | | |
| R6 | Primary resume | Set primary | Zustand + profile `resume_text` updated | | |
| R7 | Remove resume | Delete one | Storage + library update; profile cleared if last | | |
| R8 | Preview saved | Preview | Sections / signed URL or text | | |
| R9 | Optimize tab | Paste JD → Optimize | Result **or** API error (not silent) | | |
| R10 | Why gaps tab | Paste JD → Analyze | Result **or** error | | |
| R11 | Persistence | Reload page after upload | Library restored from **Supabase** `resume_library` | | |
| R12 | Cross-device | Same user, other browser | Library appears after migration / sync | | |

---

## 7. Saved jobs (`/saved`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| S1 | Empty | No saved jobs | Empty state | | |
| S2 | With data | Save from Jobs, open Saved | Cards list | | |
| S3 | Unsave | Remove | Updates DB + UI | | |
| S4 | Open job / apply | Any actions | Work as designed | | |

---

## 8. Applied jobs (`/applied`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| AP1 | List | Open page | Applications listed or empty state | | |
| AP2 | From Jobs | Apply from Jobs → check Applied | Row appears | | |

---

## 9. Progress (`/progress`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| PR1 | Main view | Load `/progress` | Charts / calendar / list per design | | |
| PR2 | Weekday drilldown | Open `/progress/weekday/0` (and other indices) | Day detail loads | | |

---

## 10. Roadmap (`/roadmap`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| RM1 | Load | Open roadmap | Content + any API-driven sections | | |
| RM2 | Interactive controls | Expand, generate, chat if present | Responses or clear errors | | |

---

## 11. Settings (`/settings`)

| # | Case | Steps | Expected | Pass? | Notes |
|---|------|--------|----------|-------|-------|
| ST1 | Load | Open settings | Form fields populated from Supabase | | |
| ST2 | Edit profile / career fields | Change values | Local state updates | | |
| ST3 | Save | Submit save | Success message; persists after reload | | |
| ST4 | Resume snapshot | If shown | Aligns with profile | | |

---

## 12. Onboarding (`/get-started`)

| # | Step | Actions | Expected | Pass? | Notes |
|---|------|---------|----------|-------|-------|
| O1 | Full flow | Complete all steps | `user_preferences` (or equivalent) saved | | |
| O2 | Validation | Try next without required fields | Blocked with hint | | |
| O3 | Back / edit | Navigate steps | State preserved | | |

---

## 13. Auth callback (`/auth/callback`)

| # | Case | Expected | Pass? | Notes |
|---|------|----------|-------|-------|
| C1 | After Google OAuth | Session established; redirect to app | | |

---

## 14. Regression & quality bar

| # | Check | Pass? | Notes |
|---|--------|-------|-------|
| Q1 | No unhandled errors in console on happy paths | | |
| Q2 | Mobile width (375px): nav + Jobs filters usable | | |
| Q3 | **Lighthouse** or basic performance spot-check on `/` and `/dashboard` | | |
| Q4 | **404** → redirect per `main.tsx` | | |
| Q5 | **SEO:** `/` and public pages have sensible titles (see `pageSeo` if used) | | |

---

## Sign-off

| Role | Name | Date | Approved (Y/N) |
|------|------|------|----------------|
| Product | | | |
| Engineering | | | |

When this checklist is complete with acceptable notes, proceed with **tagged release**, **production deploy**, and **monitoring** (Cloud Run errors, Supabase auth logs, Apify usage).
