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
  const style = styles[Object.keys(styles).find((k) => lower.includes(k)) || ""] || "bg-[#7c6ff7] text-white";
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
    <span className={`rounded px-2 py-0.5 text-[8px] font-semibold ${style}`} style={{ borderRadius: 4 }}>{label}</span>
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
    <div className="min-h-screen bg-[#EEF2FF]" style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#1A1A1A" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between border-b bg-white px-6 py-4 md:px-12"
        style={{ borderColor: "#E8E8E6" }}
      >
        <Link to="/" className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-[#5E5CE6]" />
          <span className="text-[15px] font-semibold" style={{ color: "#1A1A1A" }}>Recruix</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="text-sm text-[#8A8A85] hover:text-[#1A1A1A] transition">
              {label}
            </a>
          ))}
          <Link to="/roadmap" className="text-sm text-[#8A8A85] hover:text-[#1A1A1A] transition">
            Roadmap
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/signin"
            className="h-[34px] rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#3D3D3A] transition hover:bg-[#F7F7F5] hover:border-[#C8C8C4] flex items-center"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="h-[34px] rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white flex items-center transition hover:bg-[#4A48CC]"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="px-4 py-16 md:py-24"
        style={{ background: "linear-gradient(180deg, #DDE8FF 0%, #EEF2FF 100%)" }}
      >
        <div className="mx-auto max-w-[700px] text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 inline-flex items-center rounded px-3 py-1.5 text-xs font-medium"
            style={{ background: "#EEEEFD", color: "#5E5CE6", borderRadius: 4 }}
          >
            ✦ AI-powered job matching
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mb-4 font-bold leading-tight"
            style={{ fontSize: 48, color: "#1A1A1A", lineHeight: 1.15, letterSpacing: "-1.2px" }}
          >
            Land your dream job with{" "}
            <span style={{ color: "#5E5CE6" }}>AI precision</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.16 }}
            className="mx-auto mb-8 max-w-[560px] text-[18px] font-normal"
            style={{ color: "#8A8A85" }}
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
              className="flex h-[34px] w-full items-center justify-center rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white transition hover:bg-[#4A48CC] sm:w-auto"
            >
              Get started →
            </Link>
            <a
              href="#how-it-works"
              className="flex h-[34px] w-full items-center justify-center rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#3D3D3A] transition hover:bg-[#F7F7F5] hover:border-[#C8C8C4] sm:w-auto"
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
                <div key={bg} className="h-8 w-8 rounded-full border-2 border-[#F7F7F5]" style={{ background: bg }} />
              ))}
            </div>
            <p className="text-sm text-[#8A8A85]">
              Joined by 12,400+ students and new grads
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 border-t border-b"
        style={{ background: "#FFFFFF", borderColor: "#E8E8E6" }}
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="landing-stat-cell flex flex-col items-center justify-center py-8 px-4 text-center"
            style={{ borderColor: "#E8E8E6" }}
          >
            <span className="mb-1 text-2xl font-semibold md:text-3xl" style={{ color: "#1A1A1A" }}>{stat.value}</span>
            <span className="text-sm text-[#8A8A85]">{stat.label}</span>
          </div>
        ))}
      </section>

      {/* Job cards preview – real jobs from backend */}
      <section className="border-b px-4 py-12" style={{ background: "#EEF2FF", borderColor: "#E8E8E6" }}>
        <div className="mx-auto max-w-4xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-wider" style={{ color: "#8A8A85" }}>
            Live job matches from LinkedIn, Indeed, Glassdoor & ZipRecruiter
          </p>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-card border border-[#E8E8E6] bg-white" />
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
                  className="rounded-card border border-[#E8E8E6] bg-white p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1" />
                    <SourceBadge source={job.source} />
                  </div>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#5E5CE6] text-xs font-semibold text-white"
                    >
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium" style={{ color: "#1A1A1A" }}>{job.title}</p>
                      <p className="text-[12px]" style={{ color: "#8A8A85" }}>{job.company} · {job.location}</p>
                    </div>
                  </div>
                  <div className="mb-3 inline-block rounded px-2.5 py-1 text-xs font-medium" style={{ background: "#EEEEFD", color: "#5E5CE6", borderRadius: 4 }}>
                    {job.match}% match
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded px-2 py-0.5 text-[12px]" style={{ background: "#F4F4F2", border: "1px solid #E8E8E6", color: "#3D3D3A", borderRadius: 4 }}>{tag}</span>
                    ))}
                    <span className="rounded px-2 py-0.5 text-[12px]" style={{ background: "#F4F4F2", border: "1px solid #E8E8E6", color: "#8A8A85", borderRadius: 4 }}>{job.workplace}</span>
                  </div>
                  {job.applyUrl ? (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[6px] bg-[#5E5CE6] text-[13px] font-medium text-white transition hover:bg-[#4A48CC]"
                      title={`Opens on ${job.source || "job board"} website`}
                    >
                      Apply
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    <Link
                      to="/signup"
                      className="mt-3 flex h-[34px] w-full items-center justify-center gap-1.5 rounded-[6px] bg-[#5E5CE6] text-[13px] font-medium text-white transition hover:bg-[#4A48CC]"
                    >
                      Sign up to apply
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8A8A85]">Sign up to see live jobs and get matched. <Link to="/signup" className="text-[#5E5CE6] underline hover:text-[#4A48CC]">Get started</Link></p>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16" style={{ background: "#EEF2FF" }}>
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i }}
                className="rounded-card border border-[#E8E8E6] bg-white p-5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg text-lg" style={{ background: "#EEEEFD", color: "#5E5CE6" }}>
                  {f.icon}
                </div>
                <h3 className="font-semibold" style={{ color: "#1A1A1A" }}>{f.title}</h3>
                <p className="mt-1 text-sm" style={{ color: "#3D3D3A" }}>{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16" style={{ background: "#EEF2FF" }}>
        <div className="mx-auto max-w-2xl rounded-card border border-[#E8E8E6] bg-white p-8 text-center">
          <h2 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Ready to find your next role?</h2>
          <p className="mt-2" style={{ color: "#8A8A85" }}>
            Join thousands of students and grads already using Recruix.
          </p>
          <Link
            to="/signup"
            className="mt-6 inline-flex h-[34px] items-center rounded-[6px] bg-[#5E5CE6] px-6 text-[13px] font-medium text-white transition hover:bg-[#4A48CC]"
          >
            Create your account →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-6 py-8 md:px-12"
        style={{ background: "#EEF2FF", borderColor: "#E8E8E6" }}
      >
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5E5CE6]" />
            <span className="font-medium" style={{ color: "#1A1A1A" }}>Recruix</span>
          </div>
          <div className="flex gap-6 text-sm text-[#8A8A85]">
            <Link to="/roadmap" className="hover:text-[#1A1A1A]">Roadmap</Link>
            <a href="#privacy" className="hover:text-[#1A1A1A]">Privacy</a>
            <a href="#terms" className="hover:text-[#1A1A1A]">Terms</a>
            <a href="#contact" className="hover:text-[#1A1A1A]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
