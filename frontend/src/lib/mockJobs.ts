import type { Job } from "../types/job";

/** Dev/demo listings from `useJobStore` when JSearch data is unavailable. */
export function isMockJobId(id: string | undefined): boolean {
  if (!id) return false;
  return id.startsWith("mock-job-") || id.startsWith("mock-dashboard-");
}

/**
 * Generate deterministic sample cards for Dashboard top matches.
 * Keeps UI populated during demos even if external job APIs are down.
 */
export function buildMockDashboardJobs(opts?: {
  baseTitle?: string;
  remoteOnly?: boolean;
  startSeed?: number;
}): Job[] {
  const baseTitle = (opts?.baseTitle || "Software Engineer").trim();
  const remoteOnly = !!opts?.remoteOnly;
  const start = opts?.startSeed ?? Date.now() % 1000;

  const mk = (i: number): Job => ({
    id: `mock-dashboard-${start + i}`,
    title: [
      baseTitle,
      `${baseTitle} (Frontend)`,
      `${baseTitle} (Full Stack)`,
      `${baseTitle} (Backend)`,
      `${baseTitle} (Platform)`,
    ][i]!,
    company: [
      "Northwind Labs",
      "Aurora Systems",
      "Contoso Analytics",
      "Globex Tech",
      "Initech",
    ][i]!,
    location: remoteOnly
      ? "Remote"
      : ["Remote", "Hybrid", "San Francisco, CA", "Austin, TX", "New York, NY"][i]!,
    description:
      "Mock listing: align your resume with this role, focus on impact, and prepare an interview narrative from your project evidence.",
    applyUrl: undefined,
    salaryMin: undefined,
    salaryMax: undefined,
    remote: remoteOnly ? true : [true, false, false, false, false][i]!,
    skills: ["React", "TypeScript", "APIs", "Testing", "System Design"],
    postedAt: undefined,
    employerLogo: undefined,
    matchScore: [96, 92, 88, 85, 82][i]!,
  });

  return Array.from({ length: 5 }, (_, i) => mk(i));
}
