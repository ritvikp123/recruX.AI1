# Pre-deploy full test checklist

Use this before uploading to production (e.g. GoDaddy static + hosted API). Mark each row **P** (pass), **F** (fail), **B** (blocked), **S** (skipped), **N** (not applicable).

**Tester:** _________________ **Date:** _________________ **Build/commit:** _________________

---

## 0. Environment (must match production plan)

| # | Check | Expected | Result | Notes |
|---|--------|----------|--------|-------|
| 0.1 | `frontend/.env` — `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Non-empty; match Supabase project | | |
| 0.2 | `frontend/.env` — `VITE_API_URL` | Points to backend base **without** `/api` (e.g. `https://api.example.com` or `http://127.0.0.1:8001`) | | |
| 0.3 | `npm run build` | Completes; `frontend/dist/` has `index.html` + `assets/` | | |
| 0.4 | Backend `.env` — `DATABASE_URL`, `OLLAMA_*`, API keys as needed | Backend starts without crash | | |
| 0.5 | Ollama running (if testing AI features) | `ollama list` shows chat/parse model | | |
| 0.6 | Backend CORS | `main.py` `allow_origins` includes your **production** frontend URL | | |

---

## 1. Backend API (Swagger `/docs` or curl)

Base URL: `___________` (e.g. `http://127.0.0.1:8001`)

| # | Method | Path | Input / action | Expected output | Result |
|---|--------|------|----------------|-----------------|--------|
| 1.1 | GET | `/` | None | JSON `message` (health) | |
| 1.2 | POST | `/api/auth/signup` | JSON `{email, password, full_name}` (test user) | 200 + token **or** document if unused (app may use Supabase only) | |
| 1.3 | POST | `/api/auth/login` | JSON `{email, password}` | 200 + token **or** N | |
| 1.4 | POST | `/api/resume/extract` | `multipart/form-data` PDF/DOCX | 200 + `raw_text`, `skills` | |
| 1.5 | POST | `/api/resume/parse` | `multipart/form-data` PDF/DOCX | 200 + parsed fields (needs Ollama) | |
| 1.6 | POST | `/api/jobs/search` | JSON `{ "query": "engineer", "filters": {} }` | 200 + `jobs` array | |
| 1.7 | POST | `/api/jobs/score` | JSON `{ "resume_text": "...", "job_description": "..." }` | 200 + scores (needs Ollama) | |
| 1.8 | POST | `/api/chat` | JSON `{ "message": "Hello", "user_context": "" }` | 200 + `response` | |
| 1.9 | POST | `/api/roadmap` | JSON `{ "goal": "Software engineer", "resume_text": "" }` | 200 JSON with `phases` | |
| 1.10 | POST | `/api/jobs/match` | `multipart/form-data` file + `role_name` | 200 workflow object (heavy; optional) | |
| 1.11 | GET | `/api/profile/{uuid}` | Valid backend profile id | 200 or 404 | |

---

## 2. Authentication & public routes (browser)

| # | Test | Steps | Expected | Result |
|---|------|--------|----------|--------|
| 2.1 | `/` logged out | Open `/` | Landing page loads; no console errors blocking render | |
| 2.2 | `/` logged in | With session, open `/` | Redirect to `/dashboard` | |
| 2.3 | `/signin` | Open page | Email/password fields; Google/OAuth if configured; Submit works | |
| 2.4 | `/signup` | Open page | Fields + submit creates account or shows error | |
| 2.5 | `/reset-password` | Open page | Forgot-password flow (email link works in your Supabase config) | |
| 2.6 | `/auth/callback` | Complete OAuth if enabled | Lands in app without error | |
| 2.7 | `/roadmap` (public) | Open `/roadmap` | Marketing roadmap page loads (no login required) | |
| 2.8 | Protected route | Logged out, visit `/dashboard` | Redirect to sign-in | |

---

## 3. Dashboard layout & navigation

Test **desktop** (sidebar) and **mobile width** (bottom nav if present).

| # | UI element | Action | Expected | Result |
|---|------------|--------|----------|--------|
| 3.1 | Sidebar: Job Search | Click | `/dashboard` — search page | |
| 3.2 | Sidebar: Resume | Click | `/dashboard/resume` | |
| 3.3 | Sidebar: Recent | Click | `/dashboard/recent` | |
| 3.4 | Sidebar: Saved | Click | `/saved` | |
| 3.5 | Sidebar: Applied | Click | `/applied` | |
| 3.6 | Sidebar: Auto Apply | Click | `/dashboard/autoapply` | |
| 3.7 | Sidebar: AI Copilot | Click | **Placeholder** — no action or document behavior | |
| 3.8 | Sidebar: Insights | Click | `/insights` | |
| 3.9 | Sidebar: Roadmap | Click | `/dashboard/roadmap` | |
| 3.10 | Sidebar: Settings | Click | `/settings` | |
| 3.11 | Sidebar: Sign out | Click | Session cleared; landing or sign-in | |
| 3.12 | Logo / brand | Visual | Renders correctly | |
| 3.13 | Active route highlight | Navigate | Current nav item styled active | |

---

## 4. Job Search (`/dashboard`)

| # | Input / control | Action | Expected | Result |
|---|-----------------|--------|----------|--------|
| 4.1 | Search query field | Type + search | Jobs load or empty state + message | |
| 4.2 | Filters (job type, experience, remote, date, field, salary, sort) | Change each | List/query updates; no crash | |
| 4.3 | Pagination / load more | If present | Next page or more items | |
| 4.4 | Job card | Click | Detail panel opens with description | |
| 4.5 | Close detail | Click outside / close | Panel closes | |
| 4.6 | Save job | Button on card | Toast; appears under Saved (verify DB) | |
| 4.7 | Apply | Button if present | Toast; appears under Applied | |
| 4.8 | Match % on card | Visual | Score shown after load | |
| 4.9 | Preferences modal / banner | Open, save | Profile/preferences persist | |
| 4.10 | Hero / copilot panel | If visible | Renders; note if non-functional | |

---

## 5. Resume (`/dashboard/resume`)

### Tab: My Resume

| # | Control | Action | Expected | Result |
|---|---------|--------|----------|--------|
| 5.1 | Drag-and-drop zone | Drop PDF/DOCX | Accepts; progress/success | |
| 5.2 | File picker | Choose file | Same | |
| 5.3 | Invalid file / oversized | Bad file | Error message | |
| 5.4 | After upload | Reload page | Metadata still shows (filename, date) | |
| 5.5 | Download / preview | If buttons exist | File opens or downloads | |

### Tab: Resume Match

| # | Control | Action | Expected | Result |
|---|---------|--------|----------|--------|
| 5.6 | Job search / paste description | Fill + analyze | Score/result or clear prerequisite message | |
| 5.7 | Link to upload | If no resume | Navigates to upload tab | |

---

## 6. Recent (`/dashboard/recent`)

| # | Test | Expected | Result |
|---|------|----------|--------|
| 6.1 | Tabs (viewed / saved / applied if any) | Data or empty state | |
| 6.2 | Job rows | Click opens detail or navigates | |

---

## 7. Saved (`/saved`)

| # | Test | Expected | Result |
|---|------|----------|--------|
| 7.1 | List | Jobs saved from search appear | |
| 7.2 | Empty state | Message if none | |
| 7.3 | Actions | Remove/open if implemented | |

---

## 8. Applied (`/applied`)

| # | Test | Expected | Result |
|---|------|----------|--------|
| 8.1 | Kanban or list | Applications shown | |
| 8.2 | Status change | If draggable/dropdown | Updates persist | |
| 8.3 | Empty state | Clear message | |

---

## 9. Auto Apply (`/dashboard/autoapply`)

| # | Control | Action | Expected | Result |
|---|---------|--------|----------|--------|
| 9.1 | Enable toggle | On/off | Saves; survives reload | |
| 9.2 | Min match slider/input | Change + save | Persists | |
| 9.3 | Job types | Select | Persists | |
| 9.4 | Salary min | Set | Persists | |
| 9.5 | Excluded companies/keywords | Add/remove | Persists | |
| 9.6 | Save preferences button | Click | Success feedback | |
| 9.7 | Stats / auto-applied list | Visual | Matches DB `auto_applied` rows if any | |

---

## 10. Roadmap (`/dashboard/roadmap`)

| # | Control | Action | Expected | Result |
|---|---------|--------|----------|--------|
| 10.1 | Career goal input | Enter text | Accepts input | |
| 10.2 | Generate roadmap | Click | Loading state; then phases/cards | |
| 10.3 | Without resume | Generate | Still returns roadmap (goal-first) | |
| 10.4 | With resume in profile | Generate | Personalized where LLM works | |
| 10.5 | Error handling | Stop Ollama / bad network | Template fallback or clear error | |

---

## 11. Insights (`/insights`)

| # | Test | Expected | Result |
|---|------|----------|--------|
| 11.1 | Page load | Placeholder charts or real data | |
| 11.2 | Any buttons | Click | Document behavior (may be stub) | |

---

## 12. Settings (`/settings`)

| # | Control | Action | Expected | Result |
|---|---------|--------|----------|--------|
| 12.1 | Form fields | Edit profile/preferences | Validation | |
| 12.2 | Save | Submit | Success or error message | |
| 12.3 | Reload | Refresh | Values persist | |

---

## 13. Landing page (`/` logged out)

| # | Element | Action | Expected | Result |
|---|---------|--------|----------|--------|
| 13.1 | CTAs | Sign in / Get started | Correct routes | |
| 13.2 | Footer / nav links | Click | No 404 for important links | |
| 13.3 | Job preview section | Load | Jobs or graceful empty | |

---

## 14. Cross-cutting (all pages)

| # | Test | Expected | Result |
|---|------|----------|--------|
| 14.1 | No unhandled console errors | Open DevTools during flows | Only known third-party noise | |
| 14.2 | Network tab | API calls use correct `VITE_API_URL` | |
| 14.3 | 401 handling | Expire token / bad auth | Redirect login or message (not blank page) | |
| 14.4 | Mobile viewport | Resize to ~375px | Usable layout, nav reachable | |
| 14.5 | Keyboard | Tab through forms | Focus order OK | |

---

## 15. Production deploy smoke (after upload)

| # | Test | Expected | Result |
|---|------|----------|--------|
| 15.1 | Open production URL | `index.html` loads; **JS/CSS MIME** correct (no `text/html` on `.js`) | |
| 15.2 | Direct URL `/dashboard` | SPA fallback serves app (`.htaccess` or host rules) | |
| 15.3 | `VITE_*` built into bundle | Production API + Supabase URLs correct in built JS | |
| 15.4 | Sign in on prod | Works end-to-end | |
| 15.5 | One AI call (roadmap or chat) | Backend reachable from browser (CORS) | |

---

## Summary

| Area | Pass | Fail | Blocked | Notes |
|------|------|------|---------|-------|
| Env / build | | | | |
| Backend API | | | | |
| Auth & public | | | | |
| Nav & layout | | | | |
| Job search | | | | |
| Resume | | | | |
| Recent / Saved / Applied | | | | |
| Auto apply / Roadmap | | | | |
| Insights / Settings / Landing | | | | |
| Cross-cutting | | | | |
| Production smoke | | | | |

---

## Failures to log before deploy

| ID | Steps to reproduce | Severity | Owner |
|----|--------------------|----------|-------|
| | | | |

---

*Related: `ARCHITECTURE-AND-MANUAL-TESTS.md` (how the app works), `TESTING-CHECKLIST.md` (older run with notes).*
