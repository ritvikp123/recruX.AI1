import type { Job } from "../types/job";

export function computeMatchScore(resumeText: string | undefined, job: Job): number {
  if (!resumeText?.trim()) {
    return Math.floor(55 + Math.random() * 25);
  }
  const blob = `${job.description || ""} ${(job.skills || []).join(" ")}`.toLowerCase();
  const words = resumeText
    .toLowerCase()
    .split(/[\s,./]+/)
    .filter((w) => w.length > 2);
  const unique = [...new Set(words)];
  const hits = unique.filter((w) => blob.includes(w)).length;
  const ratio = unique.length ? hits / Math.min(unique.length, 40) : 0;
  return Math.min(99, Math.round(45 + ratio * 50));
}

export function isGreatFit(score: number): boolean {
  return score >= 72;
}
