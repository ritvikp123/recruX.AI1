/**
 * Job search and normalization.
 * Uses backend POST /api/jobs/search (replaces JSearch/RapidAPI).
 */

import { searchJobs as searchJobsApi, type JobListing } from "../lib/api";
import { computeMatchScore } from "../lib/matchScore";
import type { Job } from "../types/jobs";

export type { JobListing };

export interface SearchJobsParams {
  query?: string;
  page?: number;
  employment_type?: string;
  date_posted?: string;
  remote_jobs_only?: boolean;
  job_requirements?: string;
  skills?: string[];
}

function getTimeAgo(_dateString: string | undefined): string {
  return "Recently";
}

function mapWorkSetting(job: JobListing): "Remote" | "Hybrid" | "On-site" {
  if (job.remote_allowed) return "Remote";
  const loc = (job.location || "").toLowerCase();
  if (loc.includes("remote") || loc.includes("hybrid")) return loc.includes("hybrid") ? "Hybrid" : "Remote";
  return "On-site";
}

/**
 * Deterministic match score (0-100) using unified keyword-based logic.
 * For most accurate scores, use Resume Match (LLM-based).
 */
export function normalizeJob(
  job: JobListing,
  userProfile?: { skills?: string[]; resumeText?: string }
): Job {
  const location = job.location || "Location not specified";
  const salary = job.salary_range || "Salary not listed";
  const resumeText = (userProfile?.resumeText || "").trim();
  const profileSkills = userProfile?.skills || [];
  const jobDesc = (job.job_description || "") + (job.skills_required || []).join(" ");
  const jobSkillsRequired = job.skills_required || [];

  let match: number;
  if (!resumeText && profileSkills.length === 0) {
    match = 50; // No resume/skills: neutral placeholder
  } else {
    const { score } = computeMatchScore(
      resumeText,
      profileSkills,
      jobDesc,
      jobSkillsRequired
    );
    match = score;
  }
  const colors = ["bg-emerald-500", "bg-sky-500", "bg-indigo-500", "bg-purple-500", "bg-teal-500"];
  const logoColor = colors[Math.abs(job.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % colors.length];

  return {
    id: job.id,
    title: job.job_title,
    company: job.company_name,
    industryStage: "",
    location,
    workplace: mapWorkSetting(job),
    salary,
    match,
    h1bStatus: "",
    tags: job.skills_required || [],
    postedAt: new Date().toISOString(),
    type: "full-time",
    experienceLabel: job.experience_level || "Entry Level",
    years: "0+ yrs",
    category: "",
    logoColor,
    description: job.job_description,
    responsibilities: [],
    requirements: job.skills_required || [],
    applyUrl: job.job_listing_link,
    source: undefined,
    postedAgo: getTimeAgo(undefined),
    applicantCount: null,
    isEarlyApplicant: false,
  };
}

export async function searchJobs(params: SearchJobsParams = {}): Promise<JobListing[]> {
  const query = params.query ?? "Software Engineer";
  const filters: Record<string, unknown> = {};
  if (params.skills?.length) filters.skills = params.skills;
  if (params.remote_jobs_only) filters.remote_only = true;

  const { jobs } = await searchJobsApi({ query, filters });
  return jobs;
}
