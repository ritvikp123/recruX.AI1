import { useState, useEffect, useCallback } from "react";
import { searchJobs, normalizeJob } from "../api/jobs";
import { scoreJobsBatch } from "../lib/api";
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
  resumeText?: string;
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

function buildQuery(filters: JobsFilters): string {
  const field = filters.field || filters.userProfile?.target_field || "Software Engineer";
  const loc = filters.location || "United States";
  const exp = filters.experience || "";
  return `${field} ${exp} ${loc}`.trim();
}

export function useJobs(filters: JobsFilters) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = filters.query || buildQuery(filters);
      const results = await searchJobs({
        query,
        page,
        remote_jobs_only: filters.workSetting === "Remote",
        skills: filters.userProfile?.skills,
      });
      const profileWithResume = { ...filters.userProfile, resumeText: filters.resumeText };
      const normalized = results.map((j) => normalizeJob(j, profileWithResume));
      setJobs(normalized);
      setLoading(false);

      // If user has resume text, fetch accurate LLM scores for first 8 jobs
      const resumeText = (filters.resumeText || "").trim();
      if (resumeText && normalized.length > 0) {
        const toScore = normalized.slice(0, 8).map((j) => ({
          id: j.id,
          description: [j.title, j.company, j.description, (j.requirements || []).join(" ")].filter(Boolean).join("\n\n"),
        }));
        try {
          const { scores } = await scoreJobsBatch(resumeText, toScore);
          const scoreMap = new Map(scores.map((s) => [s.job_id, s.match_score]));
          setJobs((prev) =>
            prev.map((j) => (scoreMap.has(j.id) ? { ...j, match: scoreMap.get(j.id)! } : j))
          );
        } catch {
          // Keep skill-based scores if batch scoring fails
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load jobs. Please try again.";
      setError(msg);
      console.error(err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [
    filters.query,
    filters.field,
    filters.location,
    filters.workSetting,
    filters.experience,
    filters.resumeText,
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
