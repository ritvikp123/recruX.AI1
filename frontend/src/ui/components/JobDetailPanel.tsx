import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, CheckCircle } from "lucide-react";
import type { Job } from "../../types/jobs";

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
  const label = lower.includes("linkedin") ? "via LinkedIn" : lower.includes("indeed") ? "via Indeed" : lower.includes("glassdoor") ? "via Glassdoor" : lower.includes("ziprecruiter") ? "via ZipRecruiter" : `via ${source}`;
  return <span className={`rounded px-2 py-0.5 text-[8px] font-semibold ${style}`} style={{ borderRadius: 4 }}>{label}</span>;
}

interface Props {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  applied?: boolean;
  onApply?: (job: Job) => void;
  onMarkApplied?: (job: Job) => void;
  onUnapply?: (job: Job) => void;
}

export function JobDetailPanel({ job, open, onClose, applied, onApply, onMarkApplied, onUnapply }: Props) {
  return (
    <AnimatePresence>
      {open && job && (
        <motion.aside
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-[#E8E8E6] bg-white px-4 py-4 md:py-6"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A85]">
                Job details
              </p>
              <h2 className="mt-1 text-base font-semibold text-[#1A1A1A]">
                {job.title}
              </h2>
              <p className="text-xs text-[#3D3D3A]">
                {job.company} · {job.location} · {job.workplace}
              </p>
              <div className="mt-1.5">
                <SourceBadge source={job.source} />
              </div>
            </div>
            <button
              type="button"
              className="rounded-[6px] border border-[#E8E8E6] p-1.5 text-[#8A8A85] transition hover:bg-[#F4F4F2] hover:text-[#1A1A1A]"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>
          {applied ? (
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-[6px] border py-2.5 text-sm font-medium transition"
                style={{ background: "#F0FDF4", borderColor: "#16A34A", color: "#16A34A" }}
                onClick={() => onUnapply?.(job)}
                title="Unselect to remove from Applied"
              >
                <CheckCircle size={16} />
                Applied
              </button>
              {job.applyUrl && (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-[#5E5CE6] py-2.5 text-sm font-medium text-[#5E5CE6] transition hover:bg-[#F7F7F5]"
                >
                  Open job
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {job.applyUrl ? (
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#5E5CE6] py-2.5 text-sm font-medium text-white transition hover:bg-[#4A48CC]"
                  title={`Opens on ${job.source || "job board"} website`}
                  onClick={() => onApply?.(job)}
                >
                  Apply now
                  <ExternalLink size={14} />
                </a>
              ) : (
                <button
                  type="button"
                className="w-full rounded-[6px] bg-[#5E5CE6] py-2.5 text-sm font-medium text-white transition hover:bg-[#4A48CC]"
                  onClick={() => onApply?.(job)}
                >
                  Apply now
                </button>
              )}
              <button
                type="button"
                className="w-full rounded-[6px] border border-[#E8E8E6] py-2.5 text-sm font-medium text-[#3D3D3A] transition hover:bg-[#F7F7F5]"
                onClick={() => onMarkApplied?.(job)}
              >
                I already applied to this job
              </button>
            </div>
          )}

          <div className="mt-5 space-y-4 overflow-y-auto text-xs text-[#3D3D3A]">
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A85]">
                Overview
              </h3>
              <p className="mt-1 text-[#3D3D3A]">{job.description}</p>
            </section>
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A85]">
                Responsibilities
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {(job.responsibilities || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A85]">
                Requirements
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {(job.requirements || []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A85]">
                AI summary
              </h3>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-[#3D3D3A]">
                <li>
                  Strong alignment with your recent activity in{" "}
                  <span className="font-medium text-[#1A1A1A]">{job.category || "this role"}</span>.
                </li>
                <li>High overlap with your saved skills and preferred tech stack.</li>
                <li>Compensation and location preferences are within your target range.</li>
              </ul>
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
