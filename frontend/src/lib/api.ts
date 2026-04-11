/**
 * Centralized API client for the Recruix backend.
 * Base URL: VITE_API_URL (defaults to http://localhost:8001)
 * Attaches Supabase session JWT (Bearer) on every request via getSession().
 */

import { supabase } from "./supabase";

const BASE_URL =
  ((import.meta as any).env?.VITE_API_URL as string | undefined) || "http://localhost:8001";
const API_PREFIX = `${BASE_URL}/api`;

function explainNetworkFailure(): Error {
  return new Error(
    `Could not reach the API at ${BASE_URL}. ` +
      `Local dev: run the FastAPI server on port 8001 and set VITE_API_URL=http://localhost:8001 in frontend/.env, then restart npm run dev. ` +
      `Production: set VITE_API_URL to your HTTPS Cloud Run URL in the host (e.g. Vercel) env and redeploy. ` +
      `Also confirm you are signed in (resume routes require a valid session).`
  );
}

async function fetchApi(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_PREFIX}${path}`, init);
  } catch (e) {
    if (e instanceof TypeError) {
      throw explainNetworkFailure();
    }
    throw e;
  }
}

/** Authorization + optional Content-Type for JSON requests */
async function getAuthHeaders(omitContentType = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (!omitContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    await supabase.auth.signOut();
    window.location.href = "/signin";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try {
      const json = JSON.parse(text);
      msg = json.detail || json.message || text;
    } catch {
      /* use raw text */
    }
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

async function request<T>(
  path: string,
  init: RequestInit & { omitContentType?: boolean } = {}
): Promise<T> {
  const { omitContentType, ...rest } = init;
  const headers = {
    ...(await getAuthHeaders(omitContentType ?? false)),
    ...(init.headers as Record<string, string>),
  };
  const res = await fetchApi(path, {
    ...rest,
    headers,
  });
  return handleResponse<T>(res);
}

// --- Resume ---

export interface ResumeParseOutput {
  full_name?: string;
  email?: string;
  phone?: string;
  links?: string[];
  professional_summary?: string;
  skills: string[];
  experience?: unknown[];
  projects?: unknown[];
  education?: unknown[];
  ats_score?: number;
  raw_text?: string;
}

export interface ResumeExtractOutput {
  raw_text: string;
  skills: string[];
}

export async function parseResume(file: File): Promise<ResumeParseOutput> {
  const form = new FormData();
  form.append("file", file);
  const headers = await getAuthHeaders(true);
  const res = await fetchApi("/resume/parse", {
    method: "POST",
    headers,
    body: form,
  });
  return handleResponse<ResumeParseOutput>(res);
}

export async function extractResumeFast(file: File): Promise<ResumeExtractOutput> {
  const form = new FormData();
  form.append("file", file);
  const headers = await getAuthHeaders(true);
  const res = await fetchApi("/resume/extract", {
    method: "POST",
    headers,
    body: form,
  });
  return handleResponse<ResumeExtractOutput>(res);
}

// --- Jobs ---

export interface JobListing {
  id: string;
  job_title: string;
  company_name: string;
  location?: string;
  job_description: string;
  salary_range?: string;
  job_listing_link?: string;
  remote_allowed?: boolean;
  experience_level?: string;
  skills_required?: string[];
}

export interface JobSearchParams {
  query?: string;
  filters?: {
    skills?: string[] | string;
    location?: string;
    [k: string]: unknown;
  };
}

export async function searchJobs(params: JobSearchParams = {}): Promise<{
  jobs: JobListing[];
}> {
  const body = {
    query: params.query ?? "Software Engineer",
    filters: params.filters ?? {},
  };
  return request<{ jobs: JobListing[] }>("/jobs/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface JobScoreResult {
  job_id: string;
  match_score: number;
  reasoning?: string;
}

export async function scoreJob(
  resume_text: string,
  job_description: string
): Promise<{ scores: JobScoreResult[] }> {
  return request<{ scores: JobScoreResult[] }>("/jobs/score", {
    method: "POST",
    body: JSON.stringify({ resume_text, job_description }),
  });
}

// --- Resume tailor (optimize vs JD, gap explanation) ---

export async function resumeOptimizeForJob(
  resume_text: string,
  job_description: string
): Promise<{ text: string }> {
  return request<{ text: string }>("/resume/optimize", {
    method: "POST",
    body: JSON.stringify({ resume_text, job_description }),
  });
}

export async function resumeGapWhy(
  resume_text: string,
  job_description: string
): Promise<{ text: string }> {
  return request<{ text: string }>("/resume/gap-why", {
    method: "POST",
    body: JSON.stringify({ resume_text, job_description }),
  });
}

// --- Auth (for future backend JWT) ---

export async function login(email: string, password: string): Promise<{ access_token: string }> {
  return request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<{ access_token: string }> {
  return request<{ access_token: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

