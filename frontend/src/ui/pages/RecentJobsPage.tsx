import { useState, useEffect } from "react";
import { Clock, Heart, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import type { Job } from "../../types/jobs";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "viewed" | "saved" | "applied";

const STATUS_STYLES: Record<string, string> = {
  Submitted: "bg-primary/20 text-primary",
  "Under Review": "bg-amber-100 text-amber-800",
  Interview: "bg-bg-teal text-accent",
  Rejected: "bg-red-100 text-red-700",
  Offer: "bg-green-100 text-green-700",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

function groupByDate(items: { viewed_at?: string; saved_at?: string; applied_at?: string }[]) {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const groups: { label: string; items: typeof items }[] = [];
  const todayItems = items.filter((i) => new Date(i.viewed_at || i.saved_at || i.applied_at || 0).toDateString() === today);
  const yesterdayItems = items.filter((i) => new Date(i.viewed_at || i.saved_at || i.applied_at || 0).toDateString() === yesterday);
  const olderItems = items.filter((i) => {
    const d = new Date(i.viewed_at || i.saved_at || i.applied_at || 0).toDateString();
    return d !== today && d !== yesterday;
  });
  if (todayItems.length) groups.push({ label: "TODAY", items: todayItems });
  if (yesterdayItems.length) groups.push({ label: "YESTERDAY", items: yesterdayItems });
  if (olderItems.length) groups.push({ label: "LAST WEEK", items: olderItems });
  return groups;
}

export function RecentJobsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("viewed");
  const [viewed, setViewed] = useState<{ job_data: Job; viewed_at: string }[]>([]);
  const [saved, setSaved] = useState<{ job_data: Job; saved_at: string }[]>([]);
  const [applied, setApplied] = useState<{ id: string; job_data: Job; applied_at: string; status: string }[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("job_views")
      .select("job_data, viewed_at")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setViewed((data || []).map((r) => ({ job_data: r.job_data as Job, viewed_at: r.viewed_at }))));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("saved_jobs")
      .select("job_data, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .then(({ data }) => setSaved((data || []).map((r) => ({ job_data: r.job_data as Job, saved_at: r.saved_at }))));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("applications")
      .select("id, job_data, applied_at, status")
      .eq("user_id", user.id)
      .order("applied_at", { ascending: false })
      .then(({ data }) => setApplied((data || []).map((r) => ({ id: r.id, job_data: r.job_data as Job, applied_at: r.applied_at, status: r.status || "Submitted" }))));
  }, [user?.id]);

  const unsave = async (jobId: string) => {
    if (!user?.id) return;
    await supabase.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
    setSaved((s) => s.filter((x) => x.job_data.id !== jobId));
  };

  const unapply = async (jobId: string) => {
    if (!user?.id) return;
    await supabase.from("applications").delete().eq("user_id", user.id).eq("job_id", jobId);
    setApplied((s) => s.filter((x) => x.job_data.id !== jobId));
  };

  const tabs = [
    { id: "viewed" as Tab, label: "Recently Viewed", icon: Clock },
    { id: "saved" as Tab, label: "Saved Jobs", icon: Heart },
    { id: "applied" as Tab, label: "Applied", icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-semibold text-text-primary">Recent Jobs</h1>

      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === id ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "viewed" && (
        <div className="space-y-6">
          {viewed.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-card border py-16" style={{ borderColor: "var(--border)" }}>
              <Clock size={48} className="text-text-muted" />
              <p className="mt-4 text-text-muted">Jobs you view will appear here</p>
            </div>
          ) : (
            groupByDate(viewed).map((g) => (
              <div key={g.label}>
                <p className="mb-2 text-xs font-semibold uppercase text-text-muted">{g.label}</p>
                <div className="space-y-2">
                  {g.items.map(({ job_data: job, viewed_at }) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between rounded-card border bg-bg-card p-3"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg ${job.logoColor} flex items-center justify-center text-xs font-semibold text-white`}>
                          {job.company.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{job.title}</p>
                          <p className="text-xs text-text-muted">{job.company} · {job.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted">{formatTime(viewed_at)}</span>
                        <button type="button" className="rounded-button border-2 border-primary px-2 py-1 text-xs font-medium text-primary">View again</button>
                        <button type="button" className="text-accent">♡</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "saved" && (
        <div className="space-y-2">
          {saved.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-card border py-16" style={{ borderColor: "var(--border)" }}>
              <Heart size={48} className="text-text-muted" />
              <p className="mt-4 text-text-muted">Save jobs to find them later</p>
            </div>
          ) : (
            saved.map(({ job_data: job, saved_at }) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between rounded-card border bg-bg-card p-3"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${job.logoColor} flex items-center justify-center text-xs font-semibold text-white`}>
                    {job.company.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{job.title}</p>
                    <p className="text-xs text-text-muted">{job.company} · {job.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">♥</span>
                  <button type="button" onClick={() => unsave(job.id)} className="text-xs text-text-muted hover:text-red-600">Unsave</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {tab === "applied" && (
        <div>
          {applied.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-card border py-16" style={{ borderColor: "var(--border)" }}>
              <CheckCircle size={48} className="text-text-muted" />
              <p className="mt-4 text-text-muted">Jobs you apply to appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-card border" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-bg-page" style={{ borderColor: "var(--border)" }}>
                    <th className="p-3 text-left text-text-muted">Job</th>
                    <th className="p-3 text-left text-text-muted">Company</th>
                    <th className="p-3 text-left text-text-muted">Applied Date</th>
                    <th className="p-3 text-left text-text-muted">Status</th>
                    <th className="p-3 text-left text-text-muted">Days Since</th>
                    <th className="p-3 text-left text-text-muted">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applied.map(({ id, job_data: job, applied_at, status }) => {
                    const days = Math.floor((Date.now() - new Date(applied_at).getTime()) / 86400000);
                    return (
                      <tr key={id} className="border-b" style={{ borderColor: "var(--border-light)" }}>
                        <td className="p-3 font-medium text-text-primary">{job.title}</td>
                        <td className="p-3 text-text-secondary">{job.company}</td>
                        <td className="p-3 text-text-muted">{new Date(applied_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-800"}`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-3 text-text-muted">{days}d</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {job.applyUrl && (
                              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                                Open job
                              </a>
                            )}
                            <button type="button" className="text-sm text-text-muted hover:underline" onClick={() => unapply(job.id)}>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
