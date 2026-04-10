import type { JobListing } from "./api";
import type { Job } from "../types/job";

export function mapJobListingToJob(j: JobListing): Job {
  const link = (j.job_listing_link || "").trim();
  const applyUrl = link.startsWith("http") ? link : undefined;
  return {
    id: String(j.id),
    title: (j.job_title || "").trim() || "Role",
    company: (j.company_name || "").trim() || "Company",
    location: (j.location || "").trim() || "Remote",
    description: (j.job_description || "").trim(),
    applyUrl,
    remote: j.remote_allowed !== false,
    skills: Array.isArray(j.skills_required) && j.skills_required.length ? j.skills_required : undefined,
  };
}
