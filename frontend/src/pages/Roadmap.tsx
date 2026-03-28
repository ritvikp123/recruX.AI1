import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Check, Circle, Sparkles } from "lucide-react";
import { R } from "../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

type Item = { title: string; detail?: string };

type RoleOption = string;
type TimeframeOption = string;

const ROLE_OPTIONS: { value: RoleOption; label: string }[] = [
  { value: "Software Engineer", label: "Software Engineer" },
  { value: "Frontend Engineer", label: "Frontend Engineer" },
  { value: "Backend Engineer", label: "Backend Engineer" },
  { value: "Full Stack Engineer", label: "Full Stack Engineer" },
  { value: "DevOps / SRE", label: "DevOps / SRE" },
  { value: "Data Analyst", label: "Data Analyst" },
  { value: "Data Scientist", label: "Data Scientist" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "UX Designer", label: "UX Designer" },
  { value: "Cybersecurity Analyst", label: "Cybersecurity Analyst" },
  { value: "Mobile Developer", label: "Mobile Developer" },
];

const TIMEFRAME_OPTIONS: { value: TimeframeOption; label: string }[] = [
  { value: "1 month", label: "1 month" },
  { value: "2 months", label: "2 months" },
  { value: "3 months", label: "3 months" },
  { value: "6 months", label: "6 months" },
  { value: "9 months", label: "9 months" },
  { value: "12 months", label: "12 months" },
  { value: "18 months", label: "18 months" },
  { value: "24 months", label: "24 months" },
];

function buildRoadmap(role: RoleOption, timeframe: TimeframeOption): {
  shipped: Item[];
  inProgress: Item[];
  planned: Item[];
  blurb: string;
} {
  const generic = (prefix: string): { shipped: Item[]; inProgress: Item[]; planned: Item[]; blurb: string } => ({
    shipped: [
      { title: `Core concepts for ${prefix}`, detail: "Learn the fundamentals and make sure you can explain them simply." },
      { title: `Build a proof-of-skill`, detail: "Ship a small project that demonstrates the essentials end-to-end." },
      { title: `Document + present`, detail: "Write a clear README and track what you learned and improved." },
    ],
    inProgress: [
      { title: `Deepen your practice`, detail: "Add one complex feature and iterate based on feedback." },
      { title: `Practice evaluation`, detail: "Run weekly tests/mini-mocks so you improve predictably." },
      { title: `Polish stories`, detail: "Create 2–3 ‘talk track’ explanations for your project choices." },
    ],
    planned: [
      { title: `Apply with confidence`, detail: "Target roles and tailor your resume to match the job description keywords." },
      { title: `Repeat the loop`, detail: "Collect outcomes, refine your projects, and keep improving steadily." },
    ],
    blurb: "This is a template roadmap — use it as your baseline and adjust based on job postings you care about.",
  });

  if (role !== "Software Engineer") return generic(role);

  switch (timeframe) {
    case "3 months":
      return {
        shipped: [
          { title: "DSA + core CS basics", detail: "Arrays/strings, hash maps, trees, Big-O. Aim for 5–6 short practice sessions/week." },
          { title: "Ship a full-stack starter", detail: "Auth + database + one meaningful feature (search/filter, profiles, or saved lists)." },
          { title: "Interview fundamentals", detail: "Behavioral STAR answers + a consistent DSA practice routine." },
        ],
        inProgress: [
          { title: "Portfolio polish", detail: "Make your project demo easy to follow and add measurable outcomes (speed, UX, reliability)." },
          { title: "Systems basics", detail: "Learn how your app works end-to-end: APIs, caching, auth flow, and failure states." },
          { title: "Debug + iterate", detail: "Weekly refactor + improve performance and edge cases." },
        ],
        planned: [
          { title: "Apply smarter", detail: "Apply to roles that match your current stack; track outcomes and update your resume." },
          { title: "Craft 2 system stories", detail: "Turn your project into 2–3 interview narratives (tradeoffs, scaling, design decisions)." },
        ],
        blurb: "For Software Engineer in 3 months: focus on fundamentals + a shippable project, then start interview loops early.",
      };
    case "6 months":
      return {
        shipped: [
          { title: "Stronger DSA foundation", detail: "Move from easy problems to medium patterns (graphs, dynamic programming basics)." },
          { title: "Full project v2", detail: "Upgrade your app: add auth, better data model, and one ‘wow’ feature with tests." },
          { title: "Resume story map", detail: "Write 3 story blocks that connect skills -> impact -> result for each project." },
        ],
        inProgress: [
          { title: "Mock interviews (weekly)", detail: "Do one mock session/week and review answers for improvement." },
          { title: "Intro system design", detail: "APIs, queues, caching, and data storage tradeoffs — map them to your project." },
          { title: "Portfolio credibility", detail: "Add small metrics: latency, error rates, user flows, and what you optimized." },
        ],
        planned: [
          { title: "Target internships / junior roles", detail: "Apply broadly, but optimize your resume per role and double down on feedback loops." },
          { title: "Deepen system design stories", detail: "Prepare 3 interview-ready system explanations from your projects." },
        ],
        blurb: "For Software Engineer in 6 months: build a real project, practice interview loops, and start system design thinking.",
      };
    case "12 months":
    default:
      return {
        shipped: [
          { title: "Advanced DSA + fundamentals refresh", detail: "Consistency first: patterns, complexity, and clean explanations." },
          { title: "End-to-end product", detail: "Build a larger app with deployment, monitoring, and meaningful user flows." },
          { title: "Shipping rhythm", detail: "Deploy regularly and treat reliability as a feature." },
        ],
        inProgress: [
          { title: "System design at depth", detail: "Scaling, data modeling, caching strategies, and tradeoffs — tied to your app." },
          { title: "Interview mastery loop", detail: "Mock → review → refine weekly. Keep notes and update your stories." },
          { title: "Networking + referrals", detail: "Engage with communities and mentors, and track who gives the best feedback." },
        ],
        planned: [
          { title: "Role targeting + negotiation", detail: "Use project evidence to negotiate and tailor your applications precisely." },
          { title: "Next specialization", detail: "Pick one focus (backend, frontend, infra, data) and build a capstone project." },
        ],
        blurb: "For Software Engineer in 12 months: aim for an end-to-end product + system design depth, with continuous iteration.",
      };
  }
}

function Column({
  label,
  tone,
  icon,
  items,
}: {
  label: string;
  tone: "done" | "active" | "soon";
  icon: ReactNode;
  items: Item[];
}) {
  const labelColor =
    tone === "done" ? "#166534" : tone === "active" ? R.primary : R.deep;
  const bar =
    tone === "done"
      ? `linear-gradient(90deg, #22c55e, ${R.mid})`
      : tone === "active"
        ? `linear-gradient(90deg, ${R.primary}, ${R.mid})`
        : `linear-gradient(90deg, ${R.muted}, ${R.border})`;

  return (
    <div
      style={{
        background: R.card,
        border: hairline,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(4, 44, 83, 0.06)",
      }}
    >
      <div style={{ height: 3, background: bar }} />
      <div style={{ padding: "18px 18px 16px", borderBottom: hairline, display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: R.light,
            color: R.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: labelColor, margin: 0 }}>
            {label}
          </p>
          <p style={{ fontSize: 13, fontWeight: 600, color: R.darkest, margin: "2px 0 0" }}>{items.length} items</p>
        </div>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((item, i) => (
          <li
            key={item.title}
            style={{
              padding: "14px 18px",
              borderTop: i === 0 ? undefined : hairline,
            }}
          >
            <p className="recrux-heading" style={{ fontSize: 15, fontWeight: 600, color: R.darkest, margin: 0 }}>
              {item.title}
            </p>
            {item.detail && (
              <p style={{ fontSize: 13, color: R.body, margin: "6px 0 0", lineHeight: 1.45 }}>{item.detail}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

type PhasePlan = { title: string; durationLabel: string; bullets: string[] };

function parseMonths(tf: TimeframeOption): number {
  const m = String(tf).match(/(\d+)/);
  const n = m ? Number(m[1]) : 6;
  return Number.isFinite(n) && n > 0 ? n : 6;
}

function allocatePhaseRanges(totalWeeks: number, phaseCount = 4): { start: number; end: number }[] {
  const base = Math.floor(totalWeeks / phaseCount);
  let remainder = totalWeeks - base * phaseCount;

  const sizes: number[] = Array.from({ length: phaseCount }, () => base);
  for (let i = 0; i < remainder; i++) sizes[i] += 1;

  const ranges: { start: number; end: number }[] = [];
  let cursor = 1;
  for (let i = 0; i < phaseCount; i++) {
    const start = cursor;
    const end = cursor + sizes[i] - 1;
    cursor = end + 1;
    ranges.push({ start, end });
  }
  return ranges;
}

function buildPhasePlan(role: RoleOption, timeframe: TimeframeOption): PhasePlan[] {
  const months = parseMonths(timeframe);
  const totalWeeks = Math.max(4, Math.round(months * 4));
  const ranges = allocatePhaseRanges(totalWeeks, 4);

  const roleKey = role.trim();

  // Phase bullets are written to be actionable; keep them short for the UI.
  const phaseBulletsByRole: Record<string, PhasePlan[]> = {
    "Software Engineer": [
      {
        title: "Phase 1 · Fundamentals",
        durationLabel: "",
        bullets: [
          "Build strong basics: data structures, debugging, and code clarity.",
          "Set up a real dev workflow (linting, tests, scripts, version control).",
          "Learn to explain tradeoffs in simple terms (what/why/how).",
        ],
      },
      {
        title: "Phase 2 · Ship a portfolio project",
        durationLabel: "",
        bullets: [
          "Create a full feature end-to-end (auth + data + one key user flow).",
          "Add quality signals: tests, error handling, and performance checks.",
          "Write a crisp README and capture what you improved each iteration.",
        ],
      },
      {
        title: "Phase 3 · Systems + interview prep",
        durationLabel: "",
        bullets: [
          "Practice system thinking: APIs, storage, caching, and failure modes.",
          "Run weekly interview loops (mock + review + targeted practice).",
          "Turn your project into 2–3 interview stories with metrics and decisions.",
        ],
      },
      {
        title: "Phase 4 · Apply + iterate",
        durationLabel: "",
        bullets: [
          "Target roles that match your current stack; keep a pipeline log.",
          "Tailor resume keywords to each job description and track outcomes.",
          "Continuously refine your portfolio based on recruiter feedback.",
        ],
      },
    ],
    "Frontend Engineer": [
      {
        title: "Phase 1 · Web fundamentals",
        durationLabel: "",
        bullets: [
          "Master HTML/CSS + browser performance (layout, repaint, network).",
          "Learn React patterns: state, effects, data fetching, and UI composition.",
          "Build accessibility habits (keyboard navigation, contrast, semantics).",
        ],
      },
      {
        title: "Phase 2 · Ship a UI that feels great",
        durationLabel: "",
        bullets: [
          "Create a polished app with real interactions (filters, forms, empty states).",
          "Add UI quality signals: responsiveness, skeletons, and predictable loading/error states.",
          "Instrument improvements: measure speed and reduce UI jank where possible.",
        ],
      },
      {
        title: "Phase 3 · Testing + delivery",
        durationLabel: "",
        bullets: [
          "Add frontend tests (unit + basic integration) for critical flows.",
          "Practice debugging and performance profiling on real devices.",
          "Prepare interview stories about tradeoffs and user-centric decisions.",
        ],
      },
      {
        title: "Phase 4 · Apply strategically",
        durationLabel: "",
        bullets: [
          "Target frontend / UI-heavy roles and tailor your projects accordingly.",
          "Keep a shortlist of strengths and map them to job requirements.",
          "Iterate your portfolio after each round (what you learned, what you changed).",
        ],
      },
    ],
    "Backend Engineer": [
      {
        title: "Phase 1 · APIs + data",
        durationLabel: "",
        bullets: [
          "Learn REST principles, request lifecycles, and auth patterns.",
          "Model data carefully; validate inputs and handle errors gracefully.",
          "Practice performance basics: indexes, pagination, and query planning.",
        ],
      },
      {
        title: "Phase 2 · Build production-like services",
        durationLabel: "",
        bullets: [
          "Ship one end-to-end backend feature with real constraints (latency, reliability).",
          "Add logging + structured errors so debugging is fast.",
          "Include tests for edge cases and failure paths.",
        ],
      },
      {
        title: "Phase 3 · Systems depth",
        durationLabel: "",
        bullets: [
          "Study queues, caching, rate limiting, and retries/timeouts.",
          "Write system design narratives from your own project.",
          "Practice mock interviews focused on tradeoffs and reliability.",
        ],
      },
      {
        title: "Phase 4 · Apply + refine",
        durationLabel: "",
        bullets: [
          "Apply to backend / platform roles aligned with your project evidence.",
          "Tailor resume bullet points to the job’s stack and metrics.",
          "Iterate architecture based on feedback and recurring questions.",
        ],
      },
    ],
    "Full Stack Engineer": [
      {
        title: "Phase 1 · End-to-end basics",
        durationLabel: "",
        bullets: [
          "Connect frontend + backend fundamentals (auth, data, state, APIs).",
          "Build clean boundaries so your app is testable and understandable.",
          "Practice debugging across the full request lifecycle.",
        ],
      },
      {
        title: "Phase 2 · Ship a complete app",
        durationLabel: "",
        bullets: [
          "Deliver one complete workflow: browse -> decide -> act -> track outcomes.",
          "Add reliability: retries, validation, and predictable loading states.",
          "Create project evidence: metrics, logs, and a clear architecture diagram.",
        ],
      },
      {
        title: "Phase 3 · Systems + interview stories",
        durationLabel: "",
        bullets: [
          "Prepare system design from your stack: caching, storage, and scaling basics.",
          "Practice interview loops and refine your narratives weekly.",
          "Write 3 stories that map directly to common interview prompts.",
        ],
      },
      {
        title: "Phase 4 · Apply + iterate",
        durationLabel: "",
        bullets: [
          "Apply to full-stack roles; tailor resume bullets to each requirement.",
          "Update portfolio after rounds based on what recruiters ask.",
          "Keep a steady shipping cadence so progress compounds.",
        ],
      },
    ],
    "DevOps / SRE": [
      {
        title: "Phase 1 · Foundations & tooling",
        durationLabel: "",
        bullets: [
          "Learn Linux basics, networking, and deployments.",
          "Practice CI/CD basics (build, test, deploy) with a small app.",
          "Get comfortable with logs, alerts, and incident-style debugging.",
        ],
      },
      {
        title: "Phase 2 · Automate deployment",
        durationLabel: "",
        bullets: [
          "Deploy to a real environment and automate repeatable changes.",
          "Add observability: dashboards + useful structured logs.",
          "Improve reliability with timeouts, retries, and safe rollouts.",
        ],
      },
      {
        title: "Phase 3 · Scale thinking",
        durationLabel: "",
        bullets: [
          "Learn scaling patterns: caching, queues, and rate limiting.",
          "Create an ops playbook: common incidents + responses.",
          "Practice system/design explanations focused on reliability tradeoffs.",
        ],
      },
      {
        title: "Phase 4 · Apply with evidence",
        durationLabel: "",
        bullets: [
          "Target SRE/DevOps roles and show your automation + observability work.",
          "Tailor your resume to reliability outcomes and measurable improvements.",
          "Iterate your stack after each feedback loop and keep shipping.",
        ],
      },
    ],
    "Data Analyst": [
      {
        title: "Phase 1 · SQL + analysis workflow",
        durationLabel: "",
        bullets: [
          "Master SQL: joins, windows, aggregation, and data cleaning.",
          "Learn basic metrics definitions and how to avoid misleading charts.",
          "Practice translating business questions into queries and checks.",
        ],
      },
      {
        title: "Phase 2 · Build dashboards",
        durationLabel: "",
        bullets: [
          "Create a dashboard with clear KPIs, filters, and definitions.",
          "Add QA steps: data validation and sanity checks.",
          "Document insights: assumptions, limitations, and next actions.",
        ],
      },
      {
        title: "Phase 3 · Statistics basics",
        durationLabel: "",
        bullets: [
          "Learn A/B testing fundamentals and interpret results correctly.",
          "Practice making recommendations from analysis (not just reporting).",
          "Turn your work into clear case study writeups.",
        ],
      },
      {
        title: "Phase 4 · Apply + tell the story",
        durationLabel: "",
        bullets: [
          "Target analytics roles and tailor case studies to the business domain.",
          "Keep a pipeline log and improve based on interview feedback.",
          "Strengthen storytelling: problem -> method -> impact.",
        ],
      },
    ],
    "Data Scientist": [
      {
        title: "Phase 1 · ML fundamentals",
        durationLabel: "",
        bullets: [
          "Learn core ML concepts: features, evaluation, and model behavior.",
          "Practice clean data pipelines and reproducible experiments.",
          "Build intuition for tradeoffs: bias/variance, metrics, and baselines.",
        ],
      },
      {
        title: "Phase 2 · Ship models with evidence",
        durationLabel: "",
        bullets: [
          "Create 1–2 model projects with strong evaluation and clear baselines.",
          "Add practical concerns: data leakage checks and robust preprocessing.",
          "Write experiment notes so you can explain decisions confidently.",
        ],
      },
      {
        title: "Phase 3 · Deployment + interpretation",
        durationLabel: "",
        bullets: [
          "Learn how to serve/monitor models and interpret predictions.",
          "Practice model explainability and error analysis.",
          "Prepare interview narratives with metrics and lessons learned.",
        ],
      },
      {
        title: "Phase 4 · Apply strategically",
        durationLabel: "",
        bullets: [
          "Target DS roles that match your project evidence.",
          "Tailor resumes with measurable results and dataset details.",
          "Iterate projects based on what interviewers focus on.",
        ],
      },
    ],
    "Product Manager": [
      {
        title: "Phase 1 · Product fundamentals",
        durationLabel: "",
        bullets: [
          "Learn discovery, framing problems, and defining success metrics.",
          "Practice writing short PRDs and clear user journeys.",
          "Build confidence in stakeholder communication and prioritization.",
        ],
      },
      {
        title: "Phase 2 · Ship a small product spec",
        durationLabel: "",
        bullets: [
          "Create a feature plan with scope, milestones, risks, and experiments.",
          "Draft a rollout plan and measurement approach.",
          "Document tradeoffs and what you’d do next with more time.",
        ],
      },
      {
        title: "Phase 3 · Execution + metrics",
        durationLabel: "",
        bullets: [
          "Practice running simple experiments and interpreting results.",
          "Improve your story around prioritization and why-now decisions.",
          "Prepare examples for roadmap reviews and stakeholder updates.",
        ],
      },
      {
        title: "Phase 4 · Apply + refine",
        durationLabel: "",
        bullets: [
          "Target PM roles; tailor your artifacts to job requirements.",
          "Update your portfolio after interviews and keep improving your narrative.",
          "Keep a feedback log and iterate your positioning.",
        ],
      },
    ],
    "UX Designer": [
      {
        title: "Phase 1 · UX fundamentals",
        durationLabel: "",
        bullets: [
          "Learn research basics: user goals, workflows, and testing methods.",
          "Practice wireframing and information architecture.",
          "Create accessible designs (contrast, typography, and usability).",
        ],
      },
      {
        title: "Phase 2 · Ship UX case studies",
        durationLabel: "",
        bullets: [
          "Build 1–2 case studies: problem -> process -> outcomes.",
          "Prototype quickly and test with realistic scenarios.",
          "Write clear decisions: what you tried and why it worked.",
        ],
      },
      {
        title: "Phase 3 · Interaction + polish",
        durationLabel: "",
        bullets: [
          "Improve usability and interaction details (states, empty/error flows).",
          "Design system thinking: components, consistency, and scale.",
          "Prepare interview stories that show your process end-to-end.",
        ],
      },
      {
        title: "Phase 4 · Apply + iterate",
        durationLabel: "",
        bullets: [
          "Tailor portfolios to the product domain you’re targeting.",
          "Use feedback to improve your case studies and prototypes.",
          "Stay consistent: small improvements weekly make a big difference.",
        ],
      },
    ],
    "Cybersecurity Analyst": [
      {
        title: "Phase 1 · Security basics",
        durationLabel: "",
        bullets: [
          "Learn the basics: threat models, common attacks, and defense patterns.",
          "Practice safe lab workflows with logs and evidence capture.",
          "Get comfortable with security terminology and incident basics.",
        ],
      },
      {
        title: "Phase 2 · Build security evidence",
        durationLabel: "",
        bullets: [
          "Do 1–2 lab investigations and write clear findings summaries.",
          "Practice detection logic and understand false positives.",
          "Add documentation: what you tested, what you observed, what you learned.",
        ],
      },
      {
        title: "Phase 3 · Operational thinking",
        durationLabel: "",
        bullets: [
          "Learn incident response flow: triage -> contain -> eradicate -> recover.",
          "Practice explaining tradeoffs and risk levels confidently.",
          "Prepare interview stories focused on outcomes and evidence.",
        ],
      },
      {
        title: "Phase 4 · Apply with confidence",
        durationLabel: "",
        bullets: [
          "Target cybersecurity roles; tailor case studies and evidence artifacts.",
          "Improve resume bullets with measurable outcomes and skills evidence.",
          "Iterate based on interview questions and feedback.",
        ],
      },
    ],
    "Mobile Developer": [
      {
        title: "Phase 1 · Mobile fundamentals",
        durationLabel: "",
        bullets: [
          "Learn platform basics and UI architecture patterns.",
          "Practice state management and networking best practices.",
          "Build accessible, responsive UI for small screens.",
        ],
      },
      {
        title: "Phase 2 · Ship a mobile app",
        durationLabel: "",
        bullets: [
          "Create a complete app with a real user flow (auth + main feature).",
          "Add offline/edge-case handling and predictable loading states.",
          "Polish UX: smooth transitions, empty states, and helpful feedback.",
        ],
      },
      {
        title: "Phase 3 · Performance + reliability",
        durationLabel: "",
        bullets: [
          "Profile performance and optimize expensive paths.",
          "Improve reliability with retries, error boundaries, and tests.",
          "Prepare interview stories about constraints and tradeoffs.",
        ],
      },
      {
        title: "Phase 4 · Apply + iterate",
        durationLabel: "",
        bullets: [
          "Tailor your app evidence to the job description stack.",
          "Track outcomes and iterate your portfolio after each round.",
          "Keep a shipping cadence so your app evolves with you.",
        ],
      },
    ],
  };

  const fallback = phaseBulletsByRole["Software Engineer"] || [];
  const phasesTemplate = phaseBulletsByRole[roleKey] || fallback;

  return phasesTemplate.map((p, i) => {
    const r = ranges[i];
    return { ...p, durationLabel: `Weeks ${r.start}–${r.end}` };
  });
}

function shorten(s: string, max = 38) {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1))}…`;
}

type DiagramPhase = PhasePlan & { phaseIndex: number };

function RoadmapDiagram({
  phases,
  role,
  timeframe,
}: {
  phases: PhasePlan[];
  role: RoleOption;
  timeframe: TimeframeOption;
}) {
  const normalized: DiagramPhase[] = phases.map((p, idx) => ({ ...p, phaseIndex: idx }));
  const phaseTitles = normalized.map((p) => {
    const parts = p.title.split("·").map((x) => x.trim());
    return {
      phase: parts[0] || `Phase ${p.phaseIndex + 1}`,
      subtitle: parts.slice(1).join("·") || p.title,
    };
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        background: "#ffffff",
        borderRadius: 12,
        border: hairline,
        padding: 24,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
      aria-label={`Roadmap diagram for ${role} (${timeframe})`}
    >
      {/* Decorative arrows (kept), placed in whitespace to avoid overlapping card text */}
      <svg
        viewBox="0 0 1000 250"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: 250, pointerEvents: "none", zIndex: 0 }}
      >
        <defs>
          <marker id="roadmapArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill={R.primary} />
          </marker>
        </defs>
        <path d="M 160 62 C 245 24, 255 24, 340 62" fill="none" stroke={R.primary} strokeWidth="2" markerEnd="url(#roadmapArrow)" />
        <path d="M 410 62 C 495 24, 505 24, 590 62" fill="none" stroke={R.primary} strokeWidth="2" markerEnd="url(#roadmapArrow)" />
        <path d="M 660 62 C 745 24, 755 24, 840 62" fill="none" stroke={R.primary} strokeWidth="2" markerEnd="url(#roadmapArrow)" />

        <path d="M 160 120 C 160 156, 160 156, 160 188" fill="none" stroke={R.border} strokeWidth="1.2" strokeDasharray="4 5" />
        <path d="M 410 120 C 410 156, 410 156, 410 188" fill="none" stroke={R.border} strokeWidth="1.2" strokeDasharray="4 5" />
        <path d="M 660 120 C 660 156, 660 156, 660 188" fill="none" stroke={R.border} strokeWidth="1.2" strokeDasharray="4 5" />
        <path d="M 910 120 C 910 156, 910 156, 910 188" fill="none" stroke={R.border} strokeWidth="1.2" strokeDasharray="4 5" />
      </svg>

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Equal-width phase headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          {normalized.map((p, i) => {
            const h = phaseTitles[i];
            const headerBg = i === 3 ? "#93c5fd" : i === 2 ? "#fff3bf" : "#fde68a";
            const color = i === 3 ? "#0b3b78" : R.darkest;
            return (
              <div
                key={p.title}
                style={{
                  background: headerBg,
                  border: "1px solid rgba(15, 23, 42, 0.5)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  minHeight: 72,
                  boxSizing: "border-box",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.05em", color }}>{shorten(h.phase, 14)}</div>
                <div className="recrux-heading" style={{ marginTop: 2, fontSize: 15, fontWeight: 800, color, lineHeight: 1.2 }}>
                  {shorten(h.subtitle, 32)}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color }}>{p.durationLabel}</div>
              </div>
            );
          })}
        </div>

        {/* Weekly loop centered banner row */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              minWidth: 340,
              maxWidth: 420,
              width: "100%",
              background: "rgba(255,255,255,0.9)",
              border: hairline,
              borderRadius: 12,
              padding: "10px 14px",
              boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: R.deep, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Weekly loop
            </div>
            <div className="recrux-heading" style={{ marginTop: 4, fontSize: 16, fontWeight: 800, color: R.darkest }}>
              Plan → Build → Review → Apply
            </div>
          </div>
        </div>

        {/* Strict vertical stacks under matching phase */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, alignItems: "start" }}>
          {normalized.map((p, i) => {
            const bulletBg = i === 3 ? "#e8f1ff" : "#fff7d6";
            const bulletColor = i === 3 ? "#0b3b78" : R.darkest;
            return (
              <div key={`${p.title}-stack`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {p.bullets.slice(0, 3).map((b) => (
                  <div
                    key={b}
                    style={{
                      background: bulletBg,
                      border: "1px solid rgba(15, 23, 42, 0.42)",
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: 13,
                      fontWeight: 650,
                      color: bulletColor,
                      lineHeight: 1.25,
                      minHeight: 48,
                      boxSizing: "border-box",
                    }}
                  >
                    {shorten(b, 64)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function Roadmap() {
  const [role, setRole] = useState<RoleOption>("Software Engineer");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("6 months");

  const roadmap = useMemo(() => buildRoadmap(role, timeframe), [role, timeframe]);
  const phases = useMemo(() => buildPhasePlan(role, timeframe), [role, timeframe]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "none",
        margin: 0,
        minHeight: "calc(100vh - 56px)",
        boxSizing: "border-box",
        background: R.card,
        border: hairline,
        borderRadius: 16,
        boxShadow: "0 4px 28px rgba(4, 44, 83, 0.1), 0 1px 3px rgba(0, 0, 0, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${R.primary}, ${R.mid})` }} />
      <div style={{ padding: "40px 22px 48px", flex: 1, minHeight: 0, overflowY: "auto" }}>
        <header style={{ marginBottom: 28, textAlign: "center" }}>
        <p
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: R.primary,
            margin: 0,
          }}
        >
          <Sparkles size={14} strokeWidth={2.5} aria-hidden />
          Career roadmap
        </p>
        <h1
          className="recrux-heading"
          style={{ fontSize: 30, fontWeight: 700, color: R.darkest, margin: "12px 0 0", letterSpacing: "-0.03em" }}
        >
          Your {role} Roadmap
        </h1>
        <p style={{ fontSize: 15, color: R.body, margin: "12px 0 0", lineHeight: 1.55 }}>
          Choose your target role and timeframe to get a suggested plan you can follow step-by-step.
        </p>
      </header>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <div style={{ width: 320, maxWidth: "100%" }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: R.deep, marginBottom: 6 }}>
            Target role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as RoleOption)}
            style={{ width: "100%", padding: "12px 12px", borderRadius: 12, border: hairline, background: R.card, color: R.darkest, fontFamily: "inherit", cursor: "pointer" }}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: 280, maxWidth: "100%" }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: R.deep, marginBottom: 6 }}>
            Timeframe
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as TimeframeOption)}
            style={{ width: "100%", padding: "12px 12px", borderRadius: 12, border: hairline, background: R.card, color: R.darkest, fontFamily: "inherit", cursor: "pointer" }}
          >
            {TIMEFRAME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ overflowX: "auto", paddingBottom: 8 }}>
          <div style={{ minWidth: 1040 }}>
            <RoadmapDiagram phases={phases} role={role} timeframe={timeframe} />
          </div>
        </div>

        <p style={{ fontSize: 13, color: R.body, margin: "14px 0 0", lineHeight: 1.55, textAlign: "center" }}>
          {roadmap.blurb} This diagram is split into phases; follow the sticky notes left-to-right and keep the weekly loop going.
        </p>

        <p style={{ fontSize: 12, color: R.body, marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
          Pro tip: use <strong style={{ color: R.darkest, fontWeight: 700 }}>Settings</strong> to keep your profile up to date — better signals lead to better recommendations.
        </p>
      </div>
      </div>
    </div>
  );
}
