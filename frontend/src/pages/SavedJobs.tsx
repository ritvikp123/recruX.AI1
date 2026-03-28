import { useNavigate } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useJobStore } from "../store/useJobStore";
import { mapJobToRecruxCard } from "../recrux/mapJobToCard";
import { R } from "../recrux/theme";
import { RecruxJobCard } from "../components/recrux/RecruxJobCard";
import { RecruxEmptyState } from "../components/recrux/RecruxEmptyState";
import { RecruxListPageShell } from "../components/recrux/RecruxListPageShell";

export function SavedJobs() {
  const navigate = useNavigate();
  const savedJobs = useJobStore((s) => s.savedJobs);
  const toggleSaveJob = useJobStore((s) => s.toggleSaveJob);
  const recordApplication = useJobStore((s) => s.recordApplication);

  const count = savedJobs.length;

  return (
    <RecruxListPageShell
      title="Saved jobs"
      subtitle="Your shortlist of roles from search and the dashboard — open, compare, and apply when you’re ready."
      icon={<Bookmark size={28} strokeWidth={2} />}
      statLabel="Bookmarked roles"
      statValue={count}
      accent="primary"
      asideNote="Revisit saved roles often: new matches land daily, and stale listings close fast. Remove what you’re no longer pursuing so this stays actionable."
    >
      {count === 0 ? (
        <RecruxEmptyState
          variant="saved"
          title="No saved jobs yet"
          description="Save roles from Jobs or your dashboard to see them here."
          ctaLabel="Browse jobs"
          ctaTo="/jobs"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {savedJobs.map((job) => (
            <RecruxJobCard
              key={job.id}
              job={mapJobToRecruxCard(job)}
              saved
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
