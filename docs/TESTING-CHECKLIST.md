# Recrux.ai – Testing Checklist

Use ✓ (pass), ✗ (fail), or – (not applicable / skipped) for each item.

**Test environment:**
- Frontend: http://localhost:5173/
- Backend: http://127.0.0.1:8001 (Swagger UI)
- Supabase: configured and reachable ✓
- Tester: Ricky

---

## 1. Authentication (Frontend + Supabase)

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 1.1 | Visit `/` when not signed in | Landing page loads | ✓ | No timeout when logged in that logs user out |
| 1.2 | Visit `/` when signed in | Redirects to `/dashboard` | ✓ | No timeout for login but it works |
| 1.3 | Sign Up (email/password) | Creates account, redirects to dashboard | ✓ | Creates account |
| 1.4 | Sign Up with Google/GitHub | OAuth flow, redirects to dashboard | ✗ | Google and GitHub OAuth not connected |
| 1.5 | Sign In (email/password) | Logs in, redirects to dashboard | ✓ | |
| 1.6 | Sign In with Google/GitHub | OAuth flow, redirects to dashboard | ✗ | Google and GitHub OAuth not connected |
| 1.7 | Forgot Password | Email sent or error shown | ✗ | Sends email but reset link shows error when clicked |
| 1.8 | Sign Out | Logs out, redirects to landing | ✓ | |
| 1.9 | Visit `/dashboard` when not signed in | Redirects to `/signin` | ✓ | Works |

---

## 2. Landing Page

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 2.1 | Hero section loads | Headline, CTA buttons visible | ✓ | "How it works" and "Blog" links don't work |
| 2.2 | Stats bar | Match accuracy, jobs daily, etc. | ✓ | |
| 2.3 | Job cards preview | 3 sample jobs from backend (or empty) | ✓ | |
| 2.4 | Features section | 3 feature cards visible | ✓ | |
| 2.5 | "Sign in" link | Goes to `/signin` | ✓ | |
| 2.6 | "Get started" link | Goes to `/signup` | ✓ | |

---

## 3. Dashboard (Layout & Navigation)

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 3.1 | Sidebar visible (desktop) | Search, Resume, Recent, Auto Apply, Settings | ✓ | |
| 3.2 | Bottom nav (mobile) | Search, Saved, Applied, Insights, Settings | ✓ | |
| 3.3 | Click Search | Shows Search Jobs page | ✓ | |
| 3.4 | Click Resume | Shows Resume page | ✓ | |
| 3.5 | Click Recent | Shows Recent page | ✓ | |
| 3.6 | Click Auto Apply | Shows Auto Apply page | ✓ | |
| 3.7 | Click Saved | Shows Saved page | ✓ | |
| 3.8 | Click Applied | Shows Applied page | ✓ | |
| 3.9 | Click Insights | Shows Insights page | ✗ | Agent, Notifications, Rewards, Help, Coaching buttons don't work |
| 3.10 | Click Settings | Shows Settings page | ✓ | |

---

## 4. Search Jobs Page

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 4.1 | Page loads | Search bar, filters, job list area | ✓ | Need API keys for full data |
| 4.2 | Enter query, search | Job cards appear (or loading state) | ✓ | Need info |
| 4.3 | Filters work | Job type, experience, work setting, etc. | ✓ | |
| 4.4 | Job cards display | Title, company, location, match % | ✓ | |
| 4.5 | Click job card | Job detail panel opens | ✓ | |
| 4.6 | "Set preferences" prompt | Modal or banner shown | ✓ | |
| 4.7 | AICopilotPanel (if shown) | Aria panel visible | ✓ | Shown but can't use |

---

## 5. Resume – My Resume (Upload)

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 5.1 | Drag-and-drop PDF | File accepted, upload starts | ✓ | |
| 5.2 | Browse and select PDF | File accepted, upload starts | ✓ | |
| 5.3 | Upload completes | Success toast, preview shown | ✓ | |
| 5.4 | Preview loads | PDF in iframe or download option | ✓ | |
| 5.5 | Replace resume | Can upload new file | ✗ | Auto-deletes, doesn't save; refreshes to empty when navigating away and back |
| 5.6 | Delete resume | Resume removed from storage | ✗ | Same issue as 5.5 |
| 5.7 | File > 5MB | Error toast shown | – | Not tested; validation exists in code |
| 5.8 | Invalid format (e.g. .txt) | Error toast shown | ✓ | |

---

## 6. Resume – Resume Match

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 6.1 | No resume uploaded | "Upload your resume first" message | ✓ | Blocked by resume persistence issue |
| 6.2 | Resume uploaded | Job description input + search visible | ✗ | Resume doesn't persist |
| 6.3 | Paste job description | Text appears in textarea | ✗ | |
| 6.4 | Search for job | Results dropdown appears | ✗ | |
| 6.5 | Select job from search | Job description auto-fills | ✗ | |
| 6.6 | Click "Analyze Match" | Loading state, then result | ✗ | Blocked by resume persistence |
| 6.7 | Match result displays | Score ring, recommendation, skills/keywords | ✗ | |
| 6.8 | Past analyses | History list (if any) | ✗ | |
| 6.9 | Empty job description + Analyze | Feedback or no action | ✗ | |
| 6.10 | "Upload Resume" button | Switches to My Resume tab | ✗ | |

---

## 7. Recent Page

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 7.1 | Viewed tab | Recently viewed jobs (or empty state) | ✓ | Apply doesn't save to list |
| 7.2 | Saved tab | Saved jobs (or empty state) | ✓ | Save doesn't persist to list |
| 7.3 | Applied tab | Applied jobs with status (or empty state) | ✓ | Apply doesn't persist to list |

---

## 8. Saved Page

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 8.1 | Page loads | Message about saved jobs | ✗ | Does not seem to show up |
| 8.2 | (If implemented) Saved jobs list | Jobs from saved_jobs table | ✗ | Does not seem to show up at all |

---

## 9. Applied Page

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 9.1 | Page loads | Kanban columns (Applied, Interview, etc.) | ✗ | Does not seem to show up at all |
| 9.2 | (If implemented) Applied jobs | Jobs from applications table | ✗ | Does not seem to show up at all |

---

## 10. Insights Page

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 10.1 | Page loads | Placeholder charts or content visible | ✗ | None of the insights seem to be working |

---

## 11. Settings Page

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 11.1 | Page loads | Settings form/options visible | ✓ | |
| 11.2 | Save preferences | Success or error feedback shown | ✓ | |

---

## 12. Backend API Endpoints

| # | Endpoint | Method | Test | Expected | ✓ / ✗ | Notes |
|---|----------|--------|------|----------|-------|-------|
| 12.1 | `/` | GET | Health check | `{"message":"Recrux.AI Backend is running..."}` | ✓ | |
| 12.2 | `/api/auth/signup` | POST | Register new user | 200, `access_token`, `user_id` | ✗ | Returns 500 Internal Server Error |
| 12.3 | `/api/auth/login` | POST | Login with credentials | 200, `access_token`, `user_id` | – | Not verified; frontend uses Supabase auth |
| 12.4 | `/api/resume/parse` | POST | Upload PDF/DOCX | 200, `skills`, `raw_text`, etc. | ✓ | |
| 12.5 | `/api/jobs/search` | POST | `{query, filters}` | 200, `jobs` array | ✓ | |
| 12.6 | `/api/jobs/score` | POST | `{resume_text, job_description}` | 200, `scores` array | ✗ | Blocked by resume persistence / API failure |
| 12.7 | `/api/chat` | POST | `{message, user_context}` | 200, `response` string | ✓ | Works |
| 12.8 | `/api/profile/{id}` | GET | Fetch profile by ID | 200 or 404 | – | Uses backend DB (not Supabase); `id` = backend User ID from PostgreSQL |

---

## 13. Backend Dependencies

| # | Dependency | Status | ✓ / ✗ | Notes |
|---|------------|--------|-------|-------|
| 13.1 | Ollama running | `ollama list` or model loaded | ✓ | Required for resume parse, job score, chat |
| 13.2 | PostgreSQL | Backend starts without DB error | ✓ / ✗ | Intermittent DB errors in some flows |
| 13.3 | RapidAPI / JSearch (optional) | Jobs from JSearch or Arbeitnow fallback | ✓ | Running but needs to be fixed |
| 13.4 | CORS | Frontend can call backend | ✓ | Check allow_origins in main.py |

---

## 14. Deployment (Production)

| # | Test | Expected | ✓ / ✗ | Notes |
|---|------|----------|-------|-------|
| 14.1 | Frontend loads | No blank page, no MIME errors | ✗ | MIME type error on assets initially; requires .htaccess fix |
| 14.2 | Assets load | JS/CSS from /assets/ | ✗ | Related to 14.1 |
| 14.3 | SPA routing | Direct /dashboard URL works | – | Depends on .htaccess rewrite rules |
| 14.4 | Backend URL | VITE_API_URL points to live backend | – | Backend not deployed to GoDaddy (needs separate hosting) |
| 14.5 | Supabase | Auth and DB work in production | – | Depends on config |
| 14.6 | CORS | Backend allows frontend origin | – | Add production frontend URL to allow_origins |

---

## Summary

| Area | Pass | Fail | Notes |
|------|------|------|-------|
| Auth | 6 | 3 | OAuth not connected; Forgot password broken |
| Landing | 6 | 0 | "How it works" and "Blog" links inactive |
| Dashboard / Nav | 9 | 1 | Agent, Notifications, Rewards, Help, Coaching inactive |
| Search Jobs | 7 | 0 | Works; API keys needed for full data |
| Resume Upload | 5 | 2 | Replace/Delete and persistence issues |
| Resume Match | 1 | 9 | Blocked by resume persistence |
| Other Pages | 4 | 6 | Saved, Applied, Insights pages not working |
| Backend API | 4 | 2 | Signup 500; jobs/score blocked |
| Deployment | 0 | 2 | MIME/asset issues on GoDaddy |

---

## Known Issues / Limitations

1. **Resume persistence** – Uploaded resume auto-deletes or doesn't save; refreshing or navigating away resets to empty. Blocks Resume Match entirely.
2. **Google/GitHub OAuth** – Not connected; OAuth flows return errors.
3. **Forgot Password** – Reset email sends but link shows an error when clicked.
4. **Backend /api/auth/signup** – Returns 500 Internal Server Error (likely DB or env config).
5. **Saved, Applied, Insights pages** – Content does not show up; possible routing or data-loading issues.
6. **Agent, Notifications, Rewards, Help, Coaching** – Sidebar links have no routes; redirect to catch-all.
7. **Landing "How it works" and "Blog"** – Links don't navigate or have no target.
8. **Production deployment** – MIME type error on JS/CSS assets; .htaccess must exclude /assets/ from SPA rewrite.
9. **Recent page** – Viewed/Saved/Applied tabs display but save/apply actions don't persist to Supabase.
10. **PostgreSQL** – Intermittent DB errors in some backend flows.

---

**Last updated:** 2026-03-22  
**Tester:** Ricky
