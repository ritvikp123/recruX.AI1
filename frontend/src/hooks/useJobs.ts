import { useState, useEffect, useCallback } from "react";
import { searchJobs, type JSearchJob } from "../api/jobs";
import type { Job } from "../types/jobs";

export interface JobsFilters {
  query?: string;
  field?: string;
  location?: string;
  jobType?: string;
  workSetting?: string;
  experience?: string;
  datePosted?: string;
  userProfile?: { skills?: string[]; target_field?: string };
}

function getTimeAgo(dateString: string | undefined): string {
  if (!dateString) return "Recently";
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
}

function isRecentPost(dateString: string | undefined): boolean {
  if (!dateString) return false;
  return Date.now() - new Date(dateString).getTime() < 86400000 * 3;
}

function daysSincePosted(dateString: string | undefined): number {
  if (!dateString) return 0;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
}

function calculateMatchScore(job: JSearchJob, userProfile?: { skills?: string[] }): number {
  if (!userProfile?.skills?.length) return Math.floor(Math.random() * 20) + 78;
  const jobText = ((job.job_description || "") + (job.job_required_skills || []).join(" ")).toLowerCase();
  const userSkills = userProfile.skills;
  const matches = userSkills.filter((s) => jobText.includes(s.toLowerCase()));
  const base = Math.round((matches.length / userSkills.length) * 40);
  return Math.min(99, 60 + base + Math.floor(Math.random() * 10));
}

function mapEmploymentType(apiType?: string): "full-time" | "part-time" | "contract" | "internship" {
  const t = (apiType || "").toLowerCase();
  if (t.includes("part") || t === "parttime") return "part-time";
  if (t.includes("contract") || t === "contractor") return "contract";
  if (t.includes("intern")) return "internship";
  return "full-time";
}

function mapWorkSetting(job: JSearchJob): "Remote" | "Hybrid" | "On-site" {
  if (job.job_is_remote) return "Remote";
  const loc = (job.job_city || job.job_country || "").toLowerCase();
  if (loc.includes("remote") || loc.includes("anywhere")) return "Remote";
  return "On-site";
}

function normalizeJob(job: JSearchJob, userProfile?: { skills?: string[] }): Job {
  const location = job.job_city && job.job_state
    ? `${job.job_city}, ${job.job_state}`
    : job.job_country || "Location not specified";
  const salary =
    job.job_min_salary && job.job_max_salary
      ? `$${Math.round(job.job_min_salary / 1000)}K – $${Math.round(job.job_max_salary / 1000)}K`
      : "Salary not listed";
  const months = job.job_required_experience?.required_experience_in_months;
  const years = months ? `${Math.round(months / 12)}+ yrs` : "0+ yrs";
  const type = mapEmploymentType(job.job_employment_type);
  const colors = ["bg-emerald-500", "bg-sky-500", "bg-indigo-500", "bg-purple-500", "bg-teal-500"];
  const logoColor = colors[Math.abs(job.job_id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];

  return {
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    industryStage: "",
    location,
    workplace: mapWorkSetting(job),
    salary,
    match: calculateMatchScore(job, userProfile),
    h1bStatus: job.job_offer_expiration_datetime_utc ? "H1B Sponsor Likely" : "",
    tags: job.job_required_skills || [],
    postedAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
    type,
    experienceLabel: months && months >= 24 ? "Mid Level" : months && months >= 12 ? "Entry Level" : "New Grad",
    years,
    category: "",
    logoColor,
    description: job.job_description,
    responsibilities: job.job_highlights?.Responsibilities || [],
    requirements: job.job_highlights?.Qualifications || [],
    companyLogo: job.employer_logo,
    applyUrl: job.job_apply_link,
    source: job.job_publisher,
    postedAgo: getTimeAgo(job.job_posted_at_datetime_utc),
    applicantCount:
      job.job_apply_quality_score && job.job_apply_quality_score > 0.7 ? "Less than 25 applicants" : null,
    isEarlyApplicant: isRecentPost(job.job_posted_at_datetime_utc),
  };
}

function buildQuery(filters: JobsFilters): string {
  const field = filters.field || filters.userProfile?.target_field || "Software Engineer";
  const loc = filters.location || "United States";
  const exp = filters.experience || "";
  return `${field} ${exp} ${loc}`.trim();
}

function mapDatePosted(date?: string): string {
  if (!date) return "all";
  if (date.toLowerCase().includes("24") || date.toLowerCase().includes("today")) return "today";
  if (date.toLowerCase().includes("week")) return "week";
  if (date.toLowerCase().includes("month")) return "month";
  return "all";
}

function mapEmploymentTypeToApi(jobType?: string): string {
  if (!jobType) return "";
  const t = jobType.toLowerCase();
  if (t.includes("full")) return "FULLTIME";
  if (t.includes("part")) return "PARTTIME";
  if (t.includes("contract")) return "CONTRACTOR";
  if (t.includes("intern")) return "INTERN";
  return "";
}

/** Map our experience labels to JSearch API job_requirements values */
function mapExperienceToApi(experience?: string): string {
  if (!experience) return "";
  const t = experience.toLowerCase();
  if (t.includes("intern") || t.includes("new grad") || t.includes("no experience")) return "no_experience";
  if (t.includes("entry")) return "under_3_years_experience";
  if (t.includes("mid")) return "more_than_3_years_experience";
  if (t.includes("senior") || t.includes("lead") || t.includes("staff")) return "more_than_5_years_experience";
  return "";
}

export function useJobs(filters: JobsFilters) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const refetch = useCallback(async () => {
    const key = import.meta.env.VITE_JSEARCH_API_KEY;
    if (!key) {
      setError(
        "JSearch API key not configured. Get a free key at rapidapi.com (search 'JSearch') and add VITE_JSEARCH_API_KEY=your_key to frontend/.env, then restart the dev server."
      );
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const query = filters.query || buildQuery(filters);
      const results = await searchJobs({
        query,
        page,
        employment_type: mapEmploymentTypeToApi(filters.jobType),
        remote_jobs_only: filters.workSetting === "Remote",
        date_posted: mapDatePosted(filters.datePosted),
        job_requirements: mapExperienceToApi(filters.experience) || undefined,
      });
      const normalized = results.map((j) => normalizeJob(j, filters.userProfile));
      setJobs(normalized);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || ""
        : "";
      if (msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("exceeded")) {
        setError(
          "JSearch API quota exceeded. The free plan allows 200 requests/month. Upgrade at rapidapi.com or wait for the quota to reset."
        );
      } else {
        setError("Failed to load jobs. Please try again.");
      }
      console.error(err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [
    filters.query,
    filters.field,
    filters.location,
    filters.jobType,
    filters.workSetting,
    filters.datePosted,
    filters.experience,
    JSON.stringify(filters.userProfile),
    page,
  ]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { jobs, loading, error, page, setPage, refetch };
}

export { daysSincePosted };
export { normalizeJob };
