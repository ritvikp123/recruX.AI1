import axios from "axios";
import type { Job } from "../types/job";

const BASE = "https://jsearch.p.rapidapi.com";

function headers(): Record<string, string> {
  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY || import.meta.env.VITE_JSEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_RAPIDAPI_KEY (or VITE_JSEARCH_API_KEY) in .env");
  }
  return {
    "X-RapidAPI-Key": apiKey as string,
    "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
  };
}

export function normalizeJSearchJob(item: Record<string, unknown>): Job {
  const city = item.job_city as string | undefined;
  const state = item.job_state as string | undefined;
  const country = item.job_country as string | undefined;
  return {
    id: String(item.job_id ?? ""),
    title: String(item.job_title ?? ""),
    company: String(item.employer_name ?? ""),
    employerLogo:
      (item.employer_logo as string) ||
      (item.employer_logo_url as string) ||
      (item.job_employer_logo as string) ||
      undefined,
    location: city && state ? `${city}, ${state}` : country || "Remote",
    description: String(item.job_description ?? ""),
    applyUrl: (item.job_apply_link as string) || undefined,
    salaryMin: item.job_min_salary as number | undefined,
    salaryMax: item.job_max_salary as number | undefined,
    remote: !!item.job_is_remote,
    skills: (item.job_required_skills as string[]) || [],
    postedAt: item.job_posted_at_datetime_utc as string | undefined,
  };
}

export async function searchJSearchJobs(params: {
  query?: string;
  page?: number;
  remoteOnly?: boolean;
  employmentType?: string;
} = {}): Promise<Job[]> {
  const { query = "Software Engineer", page = 1, remoteOnly = false, employmentType = "" } = params;
  const { data } = await axios.get<{ data: Record<string, unknown>[] }>(`${BASE}/search`, {
    headers: headers(),
    params: {
      query,
      page,
      num_pages: 1,
      date_posted: "month",
      remote_jobs_only: remoteOnly,
      employment_type: employmentType || undefined,
    },
  });
  const list = data?.data || [];
  return list.map(normalizeJSearchJob);
}
