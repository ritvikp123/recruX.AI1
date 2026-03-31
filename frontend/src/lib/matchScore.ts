import type { Job } from "../types/job";

function clampPct(n: number): number {
  return Math.max(0, Math.min(99, Math.round(n)));
}

/** Stable pseudo-score when resume is empty (no random — avoids UI jitter). */
function emptyResumeScore(job: Job): number {
  let h = 0;
  const seed = `${job.id}|${job.title}|${job.company}`;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return 55 + (h % 25);
}

export function computeMatchScore(resumeText: string | undefined, job: Job): number {
  if (!resumeText?.trim()) {
    return emptyResumeScore(job);
  }
  const blob = `${job.description || ""} ${(job.skills || []).join(" ")}`.toLowerCase();
  const words = resumeText
    .toLowerCase()
    .split(/[\s,./]+/)
    .filter((w) => w.length > 2);
  const unique = [...new Set(words)];
  const hits = unique.filter((w) => blob.includes(w)).length;
  const ratio = unique.length ? hits / Math.min(unique.length, 40) : 0;
  return Math.min(99, Math.round(45 + ratio * 50));
}

/** Title + description word overlap (excludes structured `job.skills` — used for Keywords row). */
function keywordOverlapRatio(resumeText: string, job: Job): number {
  const blob = `${job.title || ""} ${job.description || ""}`.toLowerCase();
  const words = resumeText
    .toLowerCase()
    .split(/[\s,./]+/)
    .filter((w) => w.length > 2);
  const unique = [...new Set(words)];
  const cap = Math.min(unique.length, 45);
  if (cap === 0) return 0;
  const hits = unique.slice(0, 45).filter((w) => blob.includes(w)).length;
  return hits / cap;
}

/** When API does not list skills, infer overlap from longer tokens in JD vs resume. */
function inferSkillOverlapFromText(resumeLower: string, jdTitle: string): number {
  const blob = jdTitle.toLowerCase();
  const tokens = blob
    .split(/[\s,./()+#]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && t.length <= 32);
  const seen = new Set<string>();
  const interesting: string[] = [];
  for (const t of tokens) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    if (/^\d+$/.test(k)) continue;
    interesting.push(k);
    if (interesting.length >= 40) break;
  }
  if (interesting.length === 0) return 0.35;
  const hits = interesting.filter((w) => resumeLower.includes(w)).length;
  return hits / interesting.length;
}

function experienceAlignment(resumeLower: string, title: string, jd: string): number {
  const blob = `${title} ${jd}`.toLowerCase();
  let base = 50;

  const seniorityRe = /\b(senior|sr\.|lead|principal|staff|manager|director|head of)\b/i;
  const jobSenior = seniorityRe.test(blob);
  const resSenior = seniorityRe.test(resumeLower);
  if (jobSenior && resSenior) base += 24;
  else if (jobSenior && !resSenior) base -= 6;
  else if (!jobSenior && resSenior) base += 8;

  const yrRe = /(\d+)\s*\+?\s*(?:years?|yrs?)\b|(\d+)\s+years?\s+(?:of\s+)?experience/i;
  const jm = blob.match(yrRe);
  const rm = resumeLower.match(yrRe);
  if (jm && rm) {
    const jn = parseInt(jm[1] || jm[2] || "0", 10) || 0;
    const rn = parseInt(rm[1] || rm[2] || "0", 10) || 0;
    if (jn > 0 && rn >= jn) base += 14;
    else if (jn > 0 && rn >= jn - 1) base += 5;
    else if (jn > 0) base -= 8;
  }

  const roleBits = blob
    .split(/[\s,./]+/)
    .filter((w) => w.length > 4)
    .slice(0, 24);
  const overlap = roleBits.filter((w) => resumeLower.includes(w.toLowerCase())).length;
  base += Math.min(14, overlap * 1.2);

  return base;
}

function educationAlignment(resumeLower: string, jd: string): number {
  const terms = [
    "bachelor",
    "b.s.",
    "bs ",
    "b.s ",
    "master",
    "m.s.",
    "ms ",
    "mba",
    "phd",
    "doctorate",
    "undergraduate",
    "computer science",
  ];
  const jdMentions = terms.filter((t) => jd.includes(t));
  const resMentions = terms.filter((t) => resumeLower.includes(t));
  if (jdMentions.length === 0) return 72;
  if (resMentions.length === 0) return 46;
  const anyShared = jdMentions.some((j) => resMentions.some((r) => j.slice(0, 3) === r.slice(0, 3)));
  return anyShared ? 86 : 58;
}

/**
 * Per-job breakdown from resume text + resume skills vs this listing (deterministic, no API).
 * Dimensions differ by design: Skills uses structured/required skills; Keywords uses JD/title text.
 */
export function computeMatchBreakdown(
  resumeText: string | undefined,
  resumeSkills: string[] | undefined,
  job: Job
): { label: string; pct: number }[] {
  const rt = (resumeText || "").trim();
  if (!rt) {
    const b = emptyResumeScore(job);
    return [
      { label: "Skills", pct: clampPct(b - 4) },
      { label: "Experience", pct: clampPct(b - 2) },
      { label: "Keywords", pct: clampPct(b) },
      { label: "Education", pct: clampPct(48 + (b % 20)) },
    ];
  }

  const resumeLower = rt.toLowerCase();
  const rs = new Set((resumeSkills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));
  const jskills = (job.skills || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  const jd = (job.description || "").toLowerCase();
  const title = (job.title || "").toLowerCase();

  let skillsPct: number;
  if (jskills.length > 0) {
    let hit = 0;
    for (const s of jskills) {
      if (rs.has(s) || resumeLower.includes(s)) hit++;
    }
    skillsPct = 38 + (hit / jskills.length) * 58;
  } else {
    const r = inferSkillOverlapFromText(resumeLower, `${job.title || ""} ${job.description || ""}`);
    skillsPct = 40 + r * 52;
  }

  const kwRatio = keywordOverlapRatio(rt, { ...job, skills: [] });
  const keywordsPct = 44 + kwRatio * 54;

  const experiencePct = experienceAlignment(resumeLower, job.title || "", jd);
  const educationPct = educationAlignment(resumeLower, jd);

  return [
    { label: "Skills", pct: clampPct(skillsPct) },
    { label: "Experience", pct: clampPct(experiencePct) },
    { label: "Keywords", pct: clampPct(keywordsPct) },
    { label: "Education", pct: clampPct(educationPct) },
  ];
}

/** Strip simple HTML from job descriptions (JSearch sometimes returns markup). */
function stripJobHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Multi-word and compound terms; longer phrases first so "machine learning" wins over "learning". */
const JD_SKILL_PHRASES: { raw: string; label: string }[] = [
  { raw: "machine learning", label: "Machine learning" },
  { raw: "deep learning", label: "Deep learning" },
  { raw: "data science", label: "Data science" },
  { raw: "artificial intelligence", label: "Artificial intelligence" },
  { raw: "natural language", label: "Natural language processing" },
  { raw: "object oriented", label: "Object-oriented design" },
  { raw: "distributed systems", label: "Distributed systems" },
  { raw: "microservices", label: "Microservices" },
  { raw: "event driven", label: "Event-driven architecture" },
  { raw: "system design", label: "System design" },
  { raw: "ci/cd", label: "CI/CD" },
  { raw: "continuous integration", label: "Continuous integration" },
  { raw: "continuous deployment", label: "Continuous deployment" },
  { raw: "test driven", label: "Test-driven development" },
  { raw: "rest api", label: "REST APIs" },
  { raw: "restful", label: "REST" },
  { raw: "web services", label: "Web services" },
  { raw: "cloud native", label: "Cloud-native" },
  { raw: "infrastructure as code", label: "Infrastructure as code" },
  { raw: "site reliability", label: "Site reliability (SRE)" },
  { raw: "agile development", label: "Agile" },
  { raw: "scrum", label: "Scrum" },
  { raw: "devops", label: "DevOps" },
  { raw: "full stack", label: "Full stack" },
  { raw: "front end", label: "Front-end" },
  { raw: "back end", label: "Back-end" },
  { raw: "big data", label: "Big data" },
  { raw: "data pipeline", label: "Data pipelines" },
  { raw: "etl", label: "ETL" },
  { raw: "cyber security", label: "Cybersecurity" },
  { raw: "penetration testing", label: "Penetration testing" },
];

/** Single-token tech keywords if they appear as whole words in the JD. */
const JD_SKILL_TOKENS: { raw: string; label: string }[] = [
  { raw: "kubernetes", label: "Kubernetes" },
  { raw: "docker", label: "Docker" },
  { raw: "terraform", label: "Terraform" },
  { raw: "ansible", label: "Ansible" },
  { raw: "jenkins", label: "Jenkins" },
  { raw: "github", label: "GitHub" },
  { raw: "gitlab", label: "GitLab" },
  { raw: "graphql", label: "GraphQL" },
  { raw: "grpc", label: "gRPC" },
  { raw: "kafka", label: "Kafka" },
  { raw: "rabbitmq", label: "RabbitMQ" },
  { raw: "redis", label: "Redis" },
  { raw: "elasticsearch", label: "Elasticsearch" },
  { raw: "mongodb", label: "MongoDB" },
  { raw: "postgresql", label: "PostgreSQL" },
  { raw: "mysql", label: "MySQL" },
  { raw: "dynamodb", label: "DynamoDB" },
  { raw: "snowflake", label: "Snowflake" },
  { raw: "spark", label: "Apache Spark" },
  { raw: "hadoop", label: "Hadoop" },
  { raw: "airflow", label: "Airflow" },
  { raw: "tableau", label: "Tableau" },
  { raw: "powerbi", label: "Power BI" },
  { raw: "react", label: "React" },
  { raw: "angular", label: "Angular" },
  { raw: "vue", label: "Vue" },
  { raw: "svelte", label: "Svelte" },
  { raw: "typescript", label: "TypeScript" },
  { raw: "javascript", label: "JavaScript" },
  { raw: "nodejs", label: "Node.js" },
  { raw: "node.js", label: "Node.js" },
  { raw: "python", label: "Python" },
  { raw: "django", label: "Django" },
  { raw: "flask", label: "Flask" },
  { raw: "fastapi", label: "FastAPI" },
  { raw: "java", label: "Java" },
  { raw: "kotlin", label: "Kotlin" },
  { raw: "scala", label: "Scala" },
  { raw: "spring", label: "Spring" },
  { raw: "dotnet", label: ".NET" },
  { raw: "csharp", label: "C#" },
  { raw: "c#", label: "C#" },
  { raw: "golang", label: "Go" },
  { raw: "rust", label: "Rust" },
  { raw: "ruby", label: "Ruby" },
  { raw: "rails", label: "Ruby on Rails" },
  { raw: "php", label: "PHP" },
  { raw: "laravel", label: "Laravel" },
  { raw: "swift", label: "Swift" },
  { raw: "aws", label: "AWS" },
  { raw: "azure", label: "Azure" },
  { raw: "gcp", label: "GCP" },
  { raw: "lambda", label: "AWS Lambda" },
  { raw: "openshift", label: "OpenShift" },
  { raw: "nginx", label: "Nginx" },
  { raw: "linux", label: "Linux" },
  { raw: "unix", label: "Unix" },
  { raw: "sql", label: "SQL" },
  { raw: "nosql", label: "NoSQL" },
  { raw: "oauth", label: "OAuth" },
  { raw: "openid", label: "OpenID Connect" },
  { raw: "ldap", label: "LDAP" },
  { raw: "saml", label: "SAML" },
  { raw: "blockchain", label: "Blockchain" },
  { raw: "tensorflow", label: "TensorFlow" },
  { raw: "pytorch", label: "PyTorch" },
  { raw: "pandas", label: "Pandas" },
  { raw: "numpy", label: "NumPy" },
  { raw: "opencv", label: "OpenCV" },
];

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Start index of `raw` in `jd` (lowercase), or -1. Multi-word phrases use substring match; single tokens use word boundaries. */
function firstJdHitIndex(jd: string, raw: string): number {
  const r = raw.toLowerCase();
  if (!r) return -1;
  if (r.includes(" ")) return jd.indexOf(r);
  if (r.includes(".") || r.includes("#") || r.includes("/")) return jd.includes(r) ? jd.indexOf(r) : -1;
  const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(r)}([^a-z0-9]|$)`, "i");
  const m = re.exec(jd);
  return m ? m.index : -1;
}

function resumeCovers(resumeLower: string, rawLower: string): boolean {
  if (!rawLower) return false;
  if (resumeLower.includes(rawLower)) return true;
  const compact = rawLower.replace(/[\s.#/+-]+/g, "");
  if (compact.length >= 3 && resumeLower.includes(compact)) return true;
  return false;
}

/**
 * Tech terms mentioned in title + description that do not appear to be covered by the resume text + skills.
 */
function extractJdSkillGaps(title: string, description: string, resumeLower: string): string[] {
  const jd = stripJobHtml(`${title} ${description}`).toLowerCase();
  if (jd.length < 8) return [];

  const found: { label: string; pos: number }[] = [];
  const used = new Set<string>();

  for (const { raw, label } of JD_SKILL_PHRASES) {
    const r = raw.toLowerCase();
    const pos = firstJdHitIndex(jd, raw);
    if (pos === -1) continue;
    const key = label.toLowerCase();
    if (used.has(key)) continue;
    if (resumeCovers(resumeLower, r)) continue;
    used.add(key);
    found.push({ label, pos });
  }

  for (const { raw, label } of JD_SKILL_TOKENS) {
    const r = raw.toLowerCase();
    const pos = firstJdHitIndex(jd, raw);
    if (pos === -1) continue;
    const key = label.toLowerCase();
    if (used.has(key)) continue;
    if (resumeCovers(resumeLower, r)) continue;
    used.add(key);
    found.push({ label, pos });
  }

  found.sort((a, b) => a.pos - b.pos);
  return found.map((x) => x.label);
}

/**
 * Skill gaps for UI: structured `job.skills` first, then JD-derived tech keywords missing from resume.
 */
export function computeSkillGapsFromJob(
  job: Job | null | undefined,
  resumeText: string | undefined,
  resumeSkills: string[] | undefined
): string[] {
  if (!job) return [];
  const resumeLower = `${resumeText || ""} ${(resumeSkills || []).join(" ")}`.toLowerCase();

  const fromListed: string[] = [];
  const listed = Array.isArray(job.skills) ? job.skills : [];
  for (const s of listed) {
    const t = String(s).trim();
    if (!t) continue;
    if (!resumeCovers(resumeLower, t.toLowerCase())) fromListed.push(t);
  }

  const fromJd = extractJdSkillGaps(job.title || "", job.description || "", resumeLower);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of [...fromListed, ...fromJd]) {
    const k = x.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
    if (out.length >= 6) break;
  }

  return out;
}

export function isGreatFit(score: number): boolean {
  return score >= 72;
}
