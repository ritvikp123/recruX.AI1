import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { searchJobs } from "../api/jobs";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Blog", href: "#blog" },
];

const STATS = [
  { value: "94%", label: "Match accuracy" },
  { value: "50K+", label: "Jobs daily" },
  { value: "3.2x", label: "Faster offers" },
  { value: "12K+", label: "Active users" },
];

const FEATURES = [
  {
    icon: "✦",
    title: "AI Match Scoring",
    description: "See exactly how well you fit each role.",
  },
  {
    icon: "⚡",
    title: "Autofill Applications",
    description: "Apply in seconds automatically.",
  },
  {
    icon: "◎",
    title: "AI Copilot",
    description: "Ask anything about any job or company.",
  },
];

interface PreviewJob {
  id: string;
  title: string;
  company: string;
  location: string;
  match: number;
  tags: string[];
  workplace: string;
  applyUrl?: string;
  source?: string;
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const lower = source.toLowerCase();
  const styles: Record<string, string> = {
    linkedin: "bg-[#0A66C2] text-white",
    indeed: "bg-[#2557a7] text-white",
    glassdoor: "bg-[#0CAA41] text-white",
    ziprecruiter: "bg-purple-600 text-white",
  };
  const style = styles[Object.keys(styles).find((k) => lower.includes(k)) || ""] || "bg-primary text-white";
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
    <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${style}`}>{label}</span>
  );
}

export function LandingPage() {
  const [previewJobs, setPreviewJobs] = useState<PreviewJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    searchJobs({ query: "AI Engineer", page: 1 })
      .then((data) => {
        const normalized: PreviewJob[] = (data || []).slice(0, 3).map((j) => ({
          id: j.id,
          title: j.job_title,
          company: j.company_name,
          location: j.location || "Remote",
          match: 78 + Math.floor(Math.random() * 20),
          tags: (j.skills_required || []).slice(0, 2),
          workplace: j.remote_allowed ? "Remote" : "On-site",
          applyUrl: j.job_listing_link,
          source: undefined,
        }));
        setPreviewJobs(normalized);
      })
      .catch(() => setPreviewJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-bg-page text-text-primary" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 md:px-12"
        style={{
          background: "var(--primary)",
          paddingTop: 18,
          paddingBottom: 18,
          borderBottom: "0.5px solid rgba(255,255,255,0.15)",
        }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium"
            style={{ background: "var(--secondary)", color: "#fff" }}
          >
            R
          </div>
          <span className="text-base font-medium text-white">Recruix.ai</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="text-sm text-white/70 hover:text-white transition">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="rounded-button border border-white/80 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-button px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-bg-hero px-4 py-16 md:py-24">
        <div className="mx-auto max-w-[700px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium"
            style={{ background: "var(--bg-badge)", color: "var(--primary)" }}
          >
            ✦ AI-powered job matching
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mb-4 font-bold leading-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 52px)", letterSpacing: "-1.2px", color: "var(--text-primary)" }}
          >
            Land your dream job with{" "}
            <span style={{ color: "var(--primary)" }}>AI precision</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.16 }}
            className="mx-auto mb-8 max-w-[560px] text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            Recruix matches you to the right roles based on your skills, experience, and goals — automatically.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.24 }}
            className="mb-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/signup"
              className="w-full rounded-button px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
              style={{ background: "var(--accent)" }}
            >
              Get started →
            </Link>
            <a
              href="#how-it-works"
              className="w-full rounded-button border-2 px-5 py-2.5 text-sm font-medium sm:w-auto"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              See how it works
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.32 }}
            className="flex items-center justify-center gap-2"
          >
            <div className="flex -space-x-2">
              {["#14B8A6", "#3B82F6", "#8B5CF6", "#EC4899"].map((bg) => (
                <div key={bg} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: bg }} />
              ))}
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Joined by 12,400+ students and new grads
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 border-t border-b bg-bg-card"
        style={{ borderColor: "var(--border)" }}
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`landing-stat-cell flex flex-col items-center justify-center py-8 px-4 text-center`}
            style={{ borderColor: "var(--border)" }}
          >
            <span className="mb-1 text-2xl font-medium text-text-primary md:text-3xl">{stat.value}</span>
            <span className="text-sm text-text-secondary">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Job cards preview – real jobs from backend */}
      <section className="border-b px-4 py-12" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Live job matches from LinkedIn, Indeed, Glassdoor & ZipRecruiter
          </p>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-card bg-bg-badge" />
              ))}
            </div>
          ) : previewJobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {previewJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i }}
                  className="rounded-card border bg-bg-card p-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1" />
                    <SourceBadge source={job.source} />
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                      style={{ background: "var(--secondary)" }}
                    >
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-text-primary">{job.title}</p>
                      <p className="text-xs text-text-secondary">{job.company} · {job.location}</p>
                    </div>
                  </div>
                  <div className="mb-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "var(--bg-teal)", color: "var(--accent)" }}>
                    {job.match}% match
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--bg-badge)", color: "var(--primary)" }}>{tag}</span>
                    ))}
                    <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "var(--bg-purple)", color: "var(--secondary)" }}>{job.workplace}</span>
                  </div>
                  {job.applyUrl ? (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-button py-2 text-xs font-semibold text-white"
                      style={{ background: "var(--accent)" }}
                      title={`Opens on ${job.source || "job board"} website`}
                    >
                      Apply
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <Link
                      to="/signup"
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-button py-2 text-xs font-semibold text-white"
                      style={{ background: "var(--accent)" }}
                    >
                      Sign up to apply
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Sign up to see live jobs and get matched. <Link to="/signup" className="text-accent underline">Get started</Link></p>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-bg-hero px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i }}
                className="rounded-card border bg-bg-card p-5"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg" style={{ background: "var(--bg-badge)", color: "var(--primary)" }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-text-primary">{f.title}</h3>
                <p className="mt-1 text-sm text-text-secondary">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div
          className="mx-auto max-w-2xl rounded-card border-2 p-8 text-center"
          style={{ background: "var(--bg-badge)", borderColor: "var(--primary)" }}
        >
          <h2 className="text-2xl font-bold text-text-primary">Ready to find your next role?</h2>
          <p className="mt-2 text-text-secondary">
            Join thousands of students and grads already using Recruix.
          </p>
          <Link
            to="/signup"
            className="mt-6 inline-block rounded-button px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--accent)" }}
          >
            Create your account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 md:px-12"
        style={{ background: "var(--primary)" }}
      >
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium text-white" style={{ background: "var(--secondary)" }}>
              R
            </div>
            <span className="font-medium text-white">Recruix.ai</span>
          </div>
          <div className="flex gap-6 text-sm text-white/70">
            <a href="#privacy" className="hover:text-white">Privacy</a>
            <a href="#terms" className="hover:text-white">Terms</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
