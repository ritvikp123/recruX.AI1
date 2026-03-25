/**
 * Centralized API client for the Recruix backend.
 * Base URL: VITE_API_URL (defaults to http://localhost:8000)
 * Attaches JWT token automatically; redirects to /login on 401.
 */

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_PREFIX = `${BASE_URL}/api`;

function getHeaders(omitContentType = false): HeadersInit {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("access_token");
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
    localStorage.removeItem("access_token");
    window.location.href = "/login";
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
    ...getHeaders(omitContentType ?? false),
    ...(init.headers as Record<string, string>),
  };
  const res = await fetch(`${API_PREFIX}${path}`, {
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

export async function parseResume(file: File): Promise<ResumeParseOutput> {
  const form = new FormData();
  form.append("file", file);
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("access_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_PREFIX}/resume/parse`, {
    method: "POST",
    headers,
    body: form,
  });
  return handleResponse<ResumeParseOutput>(res);
}

/** Fast extraction (no LLM) - use for quick uploads */
export interface ResumeExtractOutput {
  raw_text: string;
  skills: string[];
}

export async function extractResume(file: File): Promise<ResumeExtractOutput> {
  const form = new FormData();
  form.append("file", file);
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("access_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_PREFIX}/resume/extract`, {
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

/** Batch-score multiple jobs using FormData (backend supports multiple job_descriptions) */
export async function scoreJobsBatch(
  resume_text: string,
  jobs: { id: string; description: string }[]
): Promise<{ scores: JobScoreResult[] }> {
  if (jobs.length === 0) return { scores: [] };
  const form = new FormData();
  form.append("resume_text", resume_text);
  jobs.forEach((j) => {
    form.append("job_descriptions", j.description);
    form.append("job_ids", j.id);
  });
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("access_token");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_PREFIX}/jobs/score`, {
    method: "POST",
    headers,
    body: form,
  });
  return handleResponse<{ scores: JobScoreResult[] }>(res);
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
  return request<{ access_token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- Chat ---

export async function chat(
  message: string,
  user_context?: string
): Promise<{ response: string }> {
  return request<{ response: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({ message, user_context }),
  });
}

// --- Roadmap ---

export interface CareerRoadmapSkill {
  name: string;
  user_has: boolean;
}

export interface CareerRoadmapResource {
  label: string;
  url: string;
}

export interface CareerRoadmapPhase {
  number: number;
  title: string;
  status: "complete" | "active" | "upcoming";
  duration_weeks: number;
  description: string;
  skills: CareerRoadmapSkill[];
  resources: CareerRoadmapResource[];
}

export interface CareerRoadmapResponse {
  goal: string;
  readiness_percent: number;
  skills_matched: number;
  skills_total: number;
  estimated_months: number;
  phases: CareerRoadmapPhase[];
}

export async function generateRoadmap(
  goal: string,
  resume_text = ""
): Promise<CareerRoadmapResponse> {
  return request<CareerRoadmapResponse>("/roadmap", {
    method: "POST",
    body: JSON.stringify({ goal, resume_text }),
  });
}
