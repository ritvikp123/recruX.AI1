import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type RoadmapStep = {
  title: string;
  outcomes: string[];
  projects: string[];
  weeks: string;
};

type Track = {
  label: string;
  summary: string;
  phases: {
    foundation: RoadmapStep;
    build: RoadmapStep;
    interview: RoadmapStep;
  };
};

const TRACKS: Record<string, Track> = {
  software_engineer: {
    label: "Software Engineer",
    summary: "Master core CS + full-stack projects to become interview-ready for SWE internships and new grad roles.",
    phases: {
      foundation: {
        title: "Foundation",
        weeks: "Weeks 1-4",
        outcomes: [
          "Learn programming fundamentals deeply (variables, loops, functions, OOP basics).",
          "Get comfortable with Git, GitHub, terminal, and basic Linux workflows.",
          "Understand data structures: arrays, hash maps, stacks, queues, linked lists.",
        ],
        projects: ["CLI task tracker", "Simple REST API", "Personal portfolio site"],
      },
      build: {
        title: "Build & Specialize",
        weeks: "Weeks 5-10",
        outcomes: [
          "Learn frontend + backend integration and database design fundamentals.",
          "Practice system thinking with auth, caching, and scalable architecture basics.",
          "Write clean, tested code and deploy real projects.",
        ],
        projects: ["Full-stack job board clone", "Auth + dashboard app", "Realtime chat app"],
      },
      interview: {
        title: "Interview & Apply",
        weeks: "Weeks 11-14",
        outcomes: [
          "Prepare DSA patterns, behavioral stories, and resume bullet improvements.",
          "Build an application pipeline with tracking, networking, and weekly goals.",
          "Practice mock interviews and optimize weak topics each week.",
        ],
        projects: ["LeetCode pattern sheet", "Target company tracker", "Mock interview notes repo"],
      },
    },
  },
  data_analyst: {
    label: "Data Analyst",
    summary: "Build SQL, BI, and analytics storytelling skills to land analyst internships and entry-level roles.",
    phases: {
      foundation: {
        title: "Foundation",
        weeks: "Weeks 1-4",
        outcomes: [
          "Learn SQL fundamentals and analytical thinking with real datasets.",
          "Strengthen Excel/Sheets, statistics basics, and data cleaning workflows.",
          "Understand KPIs, funnels, cohorts, and business metrics.",
        ],
        projects: ["Sales dashboard in Excel", "SQL analysis notebook", "Data cleaning case study"],
      },
      build: {
        title: "Build & Specialize",
        weeks: "Weeks 5-10",
        outcomes: [
          "Create dashboards with Power BI/Tableau and clear stakeholder narratives.",
          "Develop Python skills for pandas-based analysis and automation.",
          "Present insights with trade-offs and business recommendations.",
        ],
        projects: ["Product metrics dashboard", "A/B test analysis", "Customer churn analysis"],
      },
      interview: {
        title: "Interview & Apply",
        weeks: "Weeks 11-14",
        outcomes: [
          "Prepare SQL and case interview questions with timed practice.",
          "Refine portfolio with high-signal project writeups and outcomes.",
          "Apply with role-specific resume bullets focused on impact.",
        ],
        projects: ["SQL interview workbook", "Analytics portfolio site", "Role-targeted resume versions"],
      },
    },
  },
  cybersecurity: {
    label: "Cybersecurity",
    summary: "Build defensive security fundamentals, tooling, and practical labs for SOC/analyst pathways.",
    phases: {
      foundation: {
        title: "Foundation",
        weeks: "Weeks 1-4",
        outcomes: [
          "Understand networking, operating systems, and common attack vectors.",
          "Learn security fundamentals: CIA triad, IAM, threat modeling.",
          "Set up personal lab environment for safe practice.",
        ],
        projects: ["Home lab setup", "Network traffic analysis", "Threat report writeup"],
      },
      build: {
        title: "Build & Specialize",
        weeks: "Weeks 5-10",
        outcomes: [
          "Practice SOC workflows with logs, SIEM basics, and incident triage.",
          "Use tools like Wireshark, Burp, Nmap, and vulnerability scanners.",
          "Learn cloud security and identity hardening principles.",
        ],
        projects: ["SIEM alert triage simulation", "Web app vuln assessment", "Cloud misconfig audit"],
      },
      interview: {
        title: "Interview & Apply",
        weeks: "Weeks 11-14",
        outcomes: [
          "Prepare security scenario interviews and incident response communication.",
          "Document labs and findings with clear remediation steps.",
          "Target SOC intern, security analyst, and IT security entry roles.",
        ],
        projects: ["Incident response playbook", "Security portfolio", "Cert study plan + tracker"],
      },
    },
  },
};

function StepCard({ step }: { step: RoadmapStep }) {
  return (
    <article className="rounded-card border border-[#E8E8E6] bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[16px] font-medium text-[#1A1A1A]">{step.title}</h3>
        <span className="rounded px-2 py-0.5 text-[12px] text-[#5E5CE6]" style={{ background: "#EEEEFD", borderRadius: 4 }}>
          {step.weeks}
        </span>
      </div>

      <p className="text-[12px] uppercase tracking-[0.06em] text-[#8A8A85]">Learning outcomes</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-6 text-[#3D3D3A]">
        {step.outcomes.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <p className="mt-4 text-[12px] uppercase tracking-[0.06em] text-[#8A8A85]">Suggested projects</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {step.projects.map((project) => (
          <span
            key={project}
            className="rounded px-2 py-1 text-[12px] text-[#3D3D3A]"
            style={{ background: "#F4F4F2", border: "1px solid #E8E8E6", borderRadius: 4 }}
          >
            {project}
          </span>
        ))}
      </div>
    </article>
  );
}

export function RoadmapPage() {
  const { user } = useAuth();
  const [selectedTrack, setSelectedTrack] = useState<keyof typeof TRACKS>("software_engineer");
  const [weeklyHours, setWeeklyHours] = useState("10-15");

  const currentTrack = useMemo(() => TRACKS[selectedTrack], [selectedTrack]);

  return (
    <div className="min-h-screen bg-[#F7F7F5]" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <header className="sticky top-0 z-40 border-b border-[#E8E8E6] bg-white">
        <div className="mx-auto flex h-[60px] w-full max-w-[1100px] items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#5E5CE6]" />
            <span className="text-[14px] font-semibold text-[#1A1A1A]">Recruix</span>
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex h-[34px] items-center rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#3D3D3A] hover:bg-[#F7F7F5] hover:border-[#C8C8C4]"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/signin"
                state={{ from: { pathname: "/roadmap" } }}
                className="inline-flex h-[34px] items-center rounded-[6px] border border-[#E8E8E6] bg-white px-[14px] text-[13px] font-medium text-[#3D3D3A] hover:bg-[#F7F7F5] hover:border-[#C8C8C4]"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-[34px] items-center rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white hover:bg-[#4A48CC]"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-10">
        <div className="mb-6">
          <p className="text-[12px] uppercase tracking-[0.06em] text-[#8A8A85]">Career Roadmap Generator</p>
          <h1 className="mt-2 text-[32px] font-semibold text-[#1A1A1A]">Build your job roadmap</h1>
          <p className="mt-2 max-w-[750px] text-[14px] leading-6 text-[#3D3D3A]">
            Select your target path and get a structured plan with learning goals, project ideas, and application prep.
          </p>
        </div>

        <section className="rounded-card border border-[#E8E8E6] bg-white p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[12px] uppercase tracking-[0.06em] text-[#8A8A85]">Target role</label>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value as keyof typeof TRACKS)}
                className="h-[34px] w-full rounded-[6px] border border-[#E8E8E6] bg-white px-3 text-[14px] text-[#1A1A1A] focus:border-[#5E5CE6] focus:outline-none"
              >
                {Object.entries(TRACKS).map(([key, track]) => (
                  <option key={key} value={key}>
                    {track.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] uppercase tracking-[0.06em] text-[#8A8A85]">Weekly study time</label>
              <select
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(e.target.value)}
                className="h-[34px] w-full rounded-[6px] border border-[#E8E8E6] bg-white px-3 text-[14px] text-[#1A1A1A] focus:border-[#5E5CE6] focus:outline-none"
              >
                <option value="5-8">5-8 hrs / week</option>
                <option value="10-15">10-15 hrs / week</option>
                <option value="15-20">15-20 hrs / week</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="w-full rounded-[6px] border border-[#E8E8E6] bg-[#F4F4F2] px-3 py-[7px] text-[13px] text-[#3D3D3A]">
                Estimated duration: <span className="font-medium text-[#1A1A1A]">{weeklyHours === "5-8" ? "4-6 months" : weeklyHours === "10-15" ? "3-4 months" : "2-3 months"}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-card border border-[#E8E8E6] bg-white p-5">
          <h2 className="text-[16px] font-medium text-[#1A1A1A]">{currentTrack.label} Roadmap</h2>
          <p className="mt-1 text-[14px] leading-6 text-[#3D3D3A]">{currentTrack.summary}</p>
        </section>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <StepCard step={currentTrack.phases.foundation} />
          <StepCard step={currentTrack.phases.build} />
          <StepCard step={currentTrack.phases.interview} />
        </div>

        <section className="mt-6 rounded-card border border-[#E8E8E6] bg-white p-5">
          <h2 className="text-[16px] font-medium text-[#1A1A1A]">Next step</h2>
          <p className="mt-1 text-[14px] leading-6 text-[#3D3D3A]">
            Save this roadmap and start applying with personalized job matches in Recruix.
          </p>
          <div className="mt-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex h-[34px] items-center rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white hover:bg-[#4A48CC]"
              >
                Go to dashboard
              </Link>
            ) : (
              <Link
                to="/signup"
                className="inline-flex h-[34px] items-center rounded-[6px] bg-[#5E5CE6] px-[14px] text-[13px] font-medium text-white hover:bg-[#4A48CC]"
              >
                Create free account
              </Link>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
