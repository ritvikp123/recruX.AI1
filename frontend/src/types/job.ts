/** Normalized job for Recrux UI (live Apify scrape, RAG backend, or mock) */
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  /** When the listing source provides a logo URL */
  employerLogo?: string;
  applyUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  skills?: string[];
  postedAt?: string;
  matchScore?: number;
  /** When the user marked the role applied (local or from Supabase `applied_at`) */
  appliedAt?: string;
}
