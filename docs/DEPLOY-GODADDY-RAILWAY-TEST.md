# GoDaddy + Railway — final steps & test checklist

Use this when moving from **local** to **public**. Check boxes as you go.

---

## Is this a good setup?

**Yes for a first public MVP**, with these realities:

| Aspect | Verdict |
|--------|--------|
| **Railway** | Good for FastAPI + static/Vite frontend, simple deploys, HTTPS. |
| **GoDaddy** | Fine for **DNS + domain only**; point the domain at Railway (or Cloudflare in front later). |
| **Risk** | Your **JSearch key is in the frontend bundle** (`VITE_*`) — anyone can extract it. Accept for demos, or move job search to the backend later to hide the key. |
| **CORS** | Your backend **must** allow your real `https://yourdomain.com` origin (not only localhost) — see §5. |

---

## 1) Local “done” gate (before deploy)

- [ ] `frontend`: `npm run build` completes with no errors.
- [ ] `backend`: app starts (`uvicorn` or `railway` start command) and `GET /` returns JSON.
- [ ] Jobs page loads listings with **production-like** env (or staging keys).
- [ ] Sign-in, Saved, Applied, Resume upload path you care about — one happy path each.
- [ ] **Rotate any API key** that ever appeared in chat, screenshots, or Git history (treat as compromised).

---

## 2) Railway — what to deploy

Typical split:

1. **Service A — Backend (Python)**  
   - Root: `backend/` (or repo root with start command `cd backend && ...`).  
   - Start: e.g. `uvicorn main:app --host 0.0.0.0 --port $PORT` (Railway sets `PORT`).  
   - Env: `DATABASE_URL`, `SECRET_KEY`, Ollama/OpenAI keys if used, etc. (whatever `backend/.env` needs).

2. **Service B — Frontend (static)**  
   - Build: `cd frontend && npm ci && npm run build` → output `frontend/dist`.  
   - Serve with any static server, **or** use a Railway “static site” / Nginx template.  
   - **Build-time env** (Vite): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` = **public HTTPS URL of Service A** (no trailing `/api`), `VITE_RAPIDAPI_KEY` if you keep JSearch in the browser.

After deploy, note:

- [ ] Backend public URL: `https://________________.railway.app` (or custom).
- [ ] Frontend public URL: `https://________________.railway.app`.

---

## 3) GoDaddy (domain only)

- [ ] In GoDaddy DNS, create **CNAME** `www` → Railway’s target host (from Railway custom domain instructions), **or** **A / ALIAS** for apex `@` per Railway docs.
- [ ] In **Railway** → your **frontend** service → add **Custom Domain** = `www.yourdomain.com` (and apex if supported).
- [ ] Wait for TLS “certificate issued” in Railway.
- [ ] Open `https://www.yourdomain.com` — site loads.

---

## 4) Supabase (production)

- [ ] Supabase project **Auth** → add **Site URL** = `https://www.yourdomain.com` (and redirect URLs if you use email magic links).
- [ ] **Storage** bucket policies already OK for prod (you audited RLS earlier).

---

## 5) CORS (required)

Set on **Railway** (backend service):

`CORS_ORIGINS=https://www.yourdomain.com,https://yourdomain.com`

(`main.py` merges this with localhost for local dev.)

- [ ] Deploy backend with `CORS_ORIGINS` set.
- [ ] Browser: open site → trigger an API call (e.g. open job detail / score / chat) → **no CORS errors** in DevTools → Network.

---

## 6) Smoke tests (production)

Run these on the **live URL** (not localhost):

| # | Test | Pass |
|---|------|------|
| 1 | Home / dashboard loads, no blank screen | [ ] |
| 2 | Sign in / sign up works | [ ] |
| 3 | Jobs: search returns ≤10 results, no infinite errors | [ ] |
| 4 | Navbar “Search jobs” + Enter → `/jobs?q=...` updates list | [ ] |
| 5 | Apply flow → Applied tab shows role | [ ] |
| 6 | Resume page or upload still works if you use it | [ ] |
| 7 | AI features that call **your** API (chat, score) work; check Network tab for 200 | [ ] |
| 8 | Mobile width: nav + Jobs usable | [ ] |

---

## 7) Quick rollback

- [ ] Railway: note previous **deployment**; you can roll back in the dashboard.
- [ ] GoDaddy: DNS changes can take up to 48h (usually much faster).

---

## 8) Optional next steps (not blocking go-live)

- Move **RapidAPI JSearch** calls to **backend** so the key is not in the bundle.
- Add **Supabase JWT verification** on protected FastAPI routes if the API is public.
- **Cloudflare** in front of GoDaddy/Railway for caching and WAF.

---

**Bottom line:** GoDaddy (domain) + Railway (hosting) is a **reasonable, common** path for shipping this stack. The main **must-do** before calling it “good” is **production CORS**, **Supabase auth URLs**, and accepting **frontend-exposed JSearch** risk until you proxy it server-side.
