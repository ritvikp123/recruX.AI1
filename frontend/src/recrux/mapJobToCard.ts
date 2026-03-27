import type { Job } from "../types/job";
import type { RecruxJobCardData } from "../types/recruxJobCard";
import { isGreatFit } from "../lib/matchScore";
import { R } from "./theme";

const ICON_PALETTE = [
  { bg: R.light, color: R.darkest },
  { bg: R.gapBg, color: R.gapText },
  { bg: R.muted, color: R.deep },
  { bg: R.light, color: R.primary },
];

/** Best-effort Clearbit URL; image may 404 — card falls back to initials */
function guessLogoUrl(company: string, explicit?: string): string | undefined {
  if (explicit) return explicit;
  const slug = company
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  if (!slug || slug.length < 2) return undefined;
  return `https://logo.clearbit.com/${slug}.com`;
}

export function mapJobToRecruxCard(job: Job): RecruxJobCardData {
  const score = job.matchScore ?? 75;
  const great = isGreatFit(score);
  const fit: RecruxJobCardData["fit"] = great ? "great" : score >= 60 ? "gap" : "warn";
  const fitLabel = great ? "Great Fit" : score >= 60 ? "Skill gap" : "Low match";
  const idx = Math.abs((job.id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % ICON_PALETTE.length;
  const { bg, color } = ICON_PALETTE[idx];

  /* Spec: high match #185fa5, skill gap #854f0b */
  const matchColor = great ? R.matchHigh : R.matchMid;

  let pay: string | null = null;
  if (job.salaryMin && job.salaryMax) {
    pay = `$${Math.round(job.salaryMin / 1000)}K – $${Math.round(job.salaryMax / 1000)}K`;
  }

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    pay,
    matchPct: score,
    fit,
    fitLabel,
    iconBg: bg,
    iconColor: color,
    iconLetter: (job.company || "?")[0].toUpperCase(),
    matchColor,
    logoUrl: guessLogoUrl(job.company, job.employerLogo),
    applyUrl: job.applyUrl,
  };
}
