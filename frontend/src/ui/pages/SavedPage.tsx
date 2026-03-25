import { useState, useEffect } from "react";
import { Bookmark, ExternalLink } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { Job } from "../../types/jobs";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function SavedPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState<{ job_data: Job; saved_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("saved_jobs")
      .select("job_data, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .then(({ data }) => {
        setSaved((data || []).map((r) => ({ job_data: r.job_data as Job, saved_at: r.saved_at })));
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const unsave = async (jobId: string) => {
    if (!user?.id) return;
    await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
    setSaved((s) => s.filter((x) => x.job_data.id !== jobId));
  };

  const recordApplied = async (job: Job) => {
    if (!user?.id) return;
    const jobData = JSON.parse(JSON.stringify(job));
    await supabase.from("applications").insert({
      user_id: user.id,
      job_id: job.id,
      job_data: jobData,
      status: "Submitted",
      auto_applied: false,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold text-text-primary">Saved jobs</h1>
      <p className="text-sm text-text-secondary">
        Jobs you bookmark from the feed appear here. You can organize and review them before applying.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">Loading…</div>
      ) : saved.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-card border py-16"
          style={{ borderColor: "var(--border)" }}
        >
          <Bookmark size={48} className="text-text-muted" />
          <p className="mt-4 text-text-muted">No saved jobs yet</p>
          <p className="mt-1 text-sm text-text-muted">Save jobs from the Jobs feed to find them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map(({ job_data: job, saved_at }) => (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-card border bg-bg-card p-4"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`h-12 w-12 shrink-0 rounded-lg flex items-center justify-center text-sm font-semibold text-white`}
                  style={{ background: job.logoColor || "var(--primary)" }}
                >
                  {job.company?.slice(0, 2) || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-text-primary truncate">{job.title}</p>
                  <p className="text-sm text-text-muted truncate">{job.company} · {job.location}</p>
                  <p className="text-xs text-text-muted mt-1">{formatTime(saved_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {job.applyUrl && (
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-button px-3 py-1.5 text-sm font-medium text-white"
                    style={{ background: "var(--accent)" }}
                    onClick={() => recordApplied(job)}
                  >
                    Apply
                    <ExternalLink size={12} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => unsave(job.id)}
                  className="text-sm text-text-muted hover:text-red-600"
                >
                  Unsave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
