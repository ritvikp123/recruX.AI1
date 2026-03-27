import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { useJobStore } from "../store/useJobStore";
import { mapJobToRecruxCard } from "../recrux/mapJobToCard";
import { RecruxJobCard } from "../components/recrux/RecruxJobCard";
import { RecruxEmptyState } from "../components/recrux/RecruxEmptyState";
import { RecruxListPageShell } from "../components/recrux/RecruxListPageShell";
import type { Job } from "../types/job";

function stubJob(id: string): Job {
  return {
    id,
    title: "Applied role",
    company: "Unknown",
    location: "",
    description: "",
  };
}

export function AppliedJobs() {
  const navigate = useNavigate();
  const appliedJobIds = useJobStore((s) => s.appliedJobIds);
  const appliedJobs = useJobStore((s) => s.appliedJobs);
  const savedJobs = useJobStore((s) => s.savedJobs);
  const dashboardJobs = useJobStore((s) => s.dashboardJobs);
  const jobs = useJobStore((s) => s.jobs);
  const toggleSaveJob = useJobStore((s) => s.toggleSaveJob);
  const recordApplication = useJobStore((s) => s.recordApplication);
  const savedIds = useMemo(() => new Set(savedJobs.map((j) => j.id)), [savedJobs]);

  const resolved = useMemo(() => {
    return appliedJobIds.map((id) => {
      return (
        appliedJobs.find((j) => j.id === id) ||
        savedJobs.find((j) => j.id === id) ||
        dashboardJobs.find((j) => j.id === id) ||
        jobs.find((j) => j.id === id) ||
        stubJob(id)
      );
    });
  }, [appliedJobIds, appliedJobs, savedJobs, dashboardJobs, jobs]);

  const count = appliedJobIds.length;

  return (
    <RecruxListPageShell
      title="Applications"
      subtitle="Every role you’ve marked as applied lives here — a simple pipeline view so you know what you’ve already put in motion."
      icon={<Send size={26} strokeWidth={2} style={{ marginLeft: 2 }} />}
      statLabel="Roles applied"
      statValue={count}
      accent="emerald"
      asideNote="Apply from a job card to add it here automatically. Follow up on older entries and celebrate wins — this list is your momentum log."
    >
      {count === 0 ? (
        <RecruxEmptyState
          variant="search"
          title="No applications yet"
          description="When you apply from a job card, we list it here."
          ctaLabel="Find jobs"
          ctaTo="/jobs"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {resolved.map((job) => (
            <RecruxJobCard
              key={job.id}
              job={mapJobToRecruxCard(job)}
              saved={savedIds.has(job.id)}
              onToggleSave={() => toggleSaveJob(job)}
              onApply={(url) => {
                recordApplication(job);
                if (url) window.open(url, "_blank", "noopener");
              }}
              onOptimize={() => navigate("/resume")}
            />
          ))}
        </div>
      )}
    </RecruxListPageShell>
  );
}
