import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { ExternalLink } from "lucide-react";
import type { Job } from "../../types/jobs";

const COLUMNS = ["Submitted", "Under Review", "Interview", "Offer", "Rejected"] as const;
type Status = (typeof COLUMNS)[number];

const STATUS_BADGE_STYLES: Record<string, string> = {
  Submitted: "bg-primary/20 text-primary",
  "Under Review": "bg-amber-100 text-amber-800",
  Interview: "bg-teal-100 text-teal-800",
  Offer: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

interface Application {
  id: string;
  job_data: Job;
  applied_at: string;
  status: string;
}

export function AppliedPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("applications")
      .select("id, job_data, applied_at, status")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false })
      .then(({ data }) => {
        setApplications((data || []).map((r) => ({ id: r.id, job_data: r.job_data as Job, applied_at: r.applied_at, status: r.status || "Submitted" })));
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const getAppsForColumn = (col: Status) => applications.filter((a) => a.status === col);

  const unapply = async (applicationId: string) => {
    if (!user?.id) return;
    await supabase.from("applications").delete().eq("id", applicationId).eq("user_id", user.id);
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
  };

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-lg font-semibold text-text-primary">Applied jobs</h1>
      <p className="text-sm text-text-secondary">
        Track where you are in the process. Your applications are grouped by status.
      </p>

      {loading ? (
        <div className="py-12 text-center text-sm text-text-muted">Loading…</div>
      ) : (
        <div className="grid gap-3 overflow-x-auto pb-4 text-xs md:grid-cols-5">
          {COLUMNS.map((column) => {
            const apps = getAppsForColumn(column);
            return (
              <div
                key={column}
                className="flex min-w-[200px] flex-col rounded-card border p-3"
                style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{column}</span>
                  <span className="rounded-full bg-bg-badge px-2 py-0.5 text-[10px] font-medium text-text-muted">{apps.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {apps.length === 0 ? (
                    <p className="text-[11px] text-text-muted">No jobs yet</p>
                  ) : (
                    apps.map((app) => (
                      <div
                        key={app.id}
                        className="rounded-button border p-2"
                        style={{ borderColor: "var(--border-light)", background: "var(--bg-page)" }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-text-primary line-clamp-2 flex-1">{app.job_data.title}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${STATUS_BADGE_STYLES[app.status] || "bg-gray-100 text-gray-700"}`}>
                            {app.status}
                          </span>
                        </div>
                        <p className="mt-0.5 text-text-muted">{app.job_data.company}</p>
                        <p className="mt-1 text-[10px] text-text-muted">{new Date(app.applied_at).toLocaleDateString()}</p>
                        <div className="mt-2 flex flex-col gap-1">
                          {app.job_data.applyUrl && (
                            <a
                              href={app.job_data.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center justify-center gap-1 rounded border border-primary py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
                            >
                              Open <ExternalLink size={10} />
                            </a>
                          )}
                          <button type="button" className="text-[10px] text-text-muted hover:underline" onClick={() => unapply(app.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
