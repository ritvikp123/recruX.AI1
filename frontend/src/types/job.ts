/** Normalized job for Recrux UI (JSearch or mock) */
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  /** From JSearch when available */
  employerLogo?: string;
  applyUrl?: string;
  salaryMin?: number;
  salaryMax?: number;
  remote?: boolean;
  skills?: string[];
  postedAt?: string;
  matchScore?: number;
}
