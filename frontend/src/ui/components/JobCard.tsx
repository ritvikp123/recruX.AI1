import { motion } from "framer-motion";
import { Bookmark, X, Sparkles, ExternalLink, CheckCircle } from "lucide-react";
import type { Job } from "../../types/jobs";

function daysSincePosted(dateString: string | undefined): number {
  if (!dateString) return 0;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000);
}

interface Props {
  job: Job;
  saved: boolean;
  applied?: boolean;
  onToggleSaved: () => void;
  onNotInterested: () => void;
  onClick: () => void;
  onApply?: (job: Job) => void;
  onMarkApplied?: (job: Job) => void;
  onUnapply?: (job: Job) => void;
}

function formatPostedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const SOURCE_STYLES: Record<string, string> = {
  linkedin: "bg-[#0A66C2] text-white",
  indeed: "bg-[#2557a7] text-white",
  glassdoor: "bg-[#0CAA41] text-white",
  ziprecruiter: "bg-purple-600 text-white",
};

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const lower = source.toLowerCase();
  const style = SOURCE_STYLES[Object.keys(SOURCE_STYLES).find((k) => lower.includes(k)) || ""] || "bg-[#5E5CE6] text-white";
  const label = lower.includes("linkedin")
    ? "via LinkedIn"
    : lower.includes("indeed")
      ? "via Indeed"
      : lower.includes("glassdoor")
        ? "via Glassdoor"
        : lower.includes("ziprecruiter")
          ? "via ZipRecruiter"
          : `via ${source}`;
  return (
    <span className={`rounded px-2 py-0.5 text-[8px] font-semibold ${style}`} style={{ borderRadius: 4 }} title={`Job from ${source}`}>
      {label}
    </span>
  );
}

function getMatchLabel(score: number): string {
  if (score >= 90) return "Strong match";
  if (score >= 70) return "Good match";
  if (score >= 50) return "Partial match";
  if (score >= 30) return "Weak match";
  if (score > 0) return "Low match";
  return "Upload resume";
}

function MatchRing({ value }: { value: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <svg width="90" height="90" className="block">
      <circle cx="45" cy="45" r={radius} stroke="#E8E8E6" strokeWidth="6" fill="none" />
      <motion.circle
        cx="45"
        cy="45"
        r={radius}
        stroke="#5E5CE6"
        strokeWidth="6"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8 }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        className="text-lg font-bold"
        style={{ fill: "#1A1A1A" }}
      >
        {value}%
      </text>
    </svg>
  );
}

export function JobCard({ job, saved, applied, onToggleSaved, onNotInterested, onClick, onApply, onMarkApplied, onUnapply }: Props) {
  const postedAgo = job.postedAgo || formatPostedAt(job.postedAt);
  const daysOld = daysSincePosted(job.postedAt);
  const isStale = daysOld > 21;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="group relative cursor-pointer overflow-hidden rounded-card border border-[#E8E8E6] bg-white p-4 transition hover:border-[#C8C8C4]"
      onClick={onClick}
    >
      {isStale && (
        <div
          className="mb-2 rounded px-2 py-1 text-[10px] font-medium"
          style={{ background: "#FFFBEB", color: "#D97706", borderRadius: 4 }}
        >
          ⚠ This job was posted {daysOld} days ago — may be filled
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-[12px]" style={{ color: "#8A8A85" }}>
            <span
              title={job.postedAt ? `Posted on ${formatFullDate(job.postedAt)}` : undefined}
              className={daysOld > 30 ? "font-medium" : ""}
              style={daysOld > 30 ? { color: "#D97706" } : undefined}
            >
              {daysOld > 30 && "⚠ "}
              {postedAgo}
            </span>
            <SourceBadge source={job.source} />
          </div>
        </div>
      </div>
      <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)]">
        <div className="space-y-2">
          <div className="flex gap-3">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-contain"
                style={{ background: "#F4F4F2", border: "1px solid #E8E8E6" }}
              />
            ) : (
              <div
                className={`mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white ${job.logoColor || ""}`}
                style={{ background: job.logoColor || "#5E5CE6" }}
              >
                {job.company
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-[14px] font-medium md:text-[15px]" style={{ color: "#1A1A1A" }}>
                {job.title}
              </h3>
              <p className="text-[12px]" style={{ color: "#8A8A85" }}>
                {job.company}
                {job.industryStage ? ` · ${job.industryStage}` : ""}
              </p>
            </div>
          </div>
          <div className="grid gap-1 text-[12px]" style={{ color: "#8A8A85" }}>
            <div>📍 {job.location}</div>
            <div>🕐 {job.type === "internship" ? "Internship" : job.type}</div>
            <div>💰 {job.salary}</div>
            <div>🏠 {job.workplace}</div>
            <div>🎓 {job.experienceLabel || job.years || "—"}</div>
          </div>
          {(job.applicantCount || job.isEarlyApplicant) && (
            <p className="text-[10px] text-[#5E5CE6]">
              {job.applicantCount || (job.isEarlyApplicant ? "Be an early applicant" : "")}
            </p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(job.tags || []).slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded px-2 py-0.5 text-[12px]"
                style={{ background: "#F4F4F2", border: "1px solid #E8E8E6", color: "#3D3D3A", borderRadius: 4 }}
              >
                {tag}
              </span>
            ))}
            {(job.tags?.length ?? 0) > 4 && (
              <span
                className="rounded px-2 py-0.5 text-[12px]"
                style={{ background: "#F4F4F2", border: "1px solid #E8E8E6", color: "#8A8A85", borderRadius: 4 }}
              >
                +{(job.tags?.length ?? 0) - 4}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[6px] border border-[#E8E8E6] bg-white px-2.5 py-1 text-[#3D3D3A] transition hover:bg-[#F4F4F2] hover:border-[#C8C8C4]"
              onClick={(e) => {
                e.stopPropagation();
                onNotInterested();
              }}
            >
              <X size={12} />
              <span>Not Interested</span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 transition ${
                saved
                  ? "bg-[#EEEEFD] text-[#5E5CE6]"
                  : "border border-[#E8E8E6] bg-white text-[#3D3D3A] hover:bg-[#F4F4F2] hover:border-[#C8C8C4]"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSaved();
              }}
            >
              <Bookmark size={12} className={saved ? "fill-[#5E5CE6] text-[#5E5CE6]" : ""} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-[6px] border border-[#E8E8E6] bg-white px-2.5 py-1 text-sm font-medium text-[#5E5CE6] transition hover:bg-[#F4F4F2] hover:border-[#C8C8C4]"
              onClick={(e) => e.stopPropagation()}
            >
              <Sparkles size={12} />
              <span>✦ ASK ARIA</span>
            </button>
            {applied ? (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-xs font-medium transition hover:opacity-80"
                  style={{ background: "#F0FDF4", color: "#16A34A" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnapply?.(job);
                  }}
                  title="Unselect to remove from Applied"
                >
                  <CheckCircle size={12} />
                  Applied
                </button>
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-[6px] border border-[#E8E8E6] px-2 py-1 text-xs font-medium text-[#5E5CE6] hover:bg-[#F4F4F2] hover:border-[#C8C8C4]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Open
                  </a>
                )}
              </div>
            ) : (
              <div className="ml-auto flex items-center gap-2">
                {job.applyUrl ? (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-[34px] items-center gap-1 rounded-[6px] bg-[#5E5CE6] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#4A48CC]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply?.(job);
                    }}
                    title={`Opens on ${job.source || "job board"} website`}
                  >
                    Apply Now
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-[34px] items-center gap-1 rounded-[6px] bg-[#5E5CE6] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#4A48CC]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply?.(job);
                    }}
                  >
                    APPLY NOW
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-[6px] border border-[#E8E8E6] px-2 py-1 text-xs text-[#3D3D3A] transition hover:bg-[#F4F4F2] hover:border-[#C8C8C4]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkApplied?.(job);
                  }}
                  title="I already applied to this job elsewhere"
                >
                  I applied
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          className="flex items-center justify-center rounded-card px-3 py-4 text-center"
          style={{ background: "#EEEEFD", border: "1px solid #E8E8E6" }}
        >
          <div>
            <MatchRing value={job.match} />
            <p className="mt-1 text-[10px] font-medium uppercase" style={{ color: "#5E5CE6" }}>{getMatchLabel(job.match)}</p>
            {job.h1bStatus && <p className="mt-1 text-[10px] text-[#3D3D3A]">✓ {job.h1bStatus}</p>}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
