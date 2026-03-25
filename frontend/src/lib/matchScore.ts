/**
 * Unified match scoring for Search Jobs and Resume Match.
 * Uses keyword overlap: score = fraction of job requirements the resume fulfills.
 */

/** Tech/role keywords to look for in resumes and job descriptions. */
const SKILL_KEYWORDS = [
  // Languages
  "python", "javascript", "typescript", "java", "c#", "c++", "go", "rust", "ruby", "php", "swift", "kotlin", "scala",
  // Frontend
  "react", "vue", "angular", "next.js", "svelte", "html", "css", "tailwind", "redux", "webpack", "vite",
  // Backend & APIs
  "node", "node.js", "express", "fastapi", "django", "flask", "spring", "api", "rest", "graphql", "grpc",
  // Data & ML
  "sql", "postgresql", "mongodb", "redis", "machine learning", "tensorflow", "pytorch", "pandas", "scikit-learn", "data science",
  // DevOps & Cloud
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins", "github actions",
  // Tools & Methods
  "git", "agile", "scrum", "jira", "confluence", "figma", "jest", "cypress", "testing",
  // Roles & Domains
  "frontend", "backend", "full stack", "devops", "data engineer", "mobile", "ios", "android",
  "ux", "ui", "design", "product", "project management", "e-commerce", "shopify", "conversion", "cro",
  "security", "cybersecurity", "blockchain", "fintech", "saas",
];

/**
 * Extract keywords from text using the global skill list.
 */
export function extractKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter((term) => lower.includes(term));
}

/**
 * Compute match score (0–100) from resume vs job.
 * Logic: What fraction of what the job requires does the resume show?
 * This produces different scores for different jobs (Frontend vs UX vs PM).
 */
export function computeMatchScore(
  resumeText: string,
  resumeSkills: string[],
  jobDescription: string,
  jobSkillsRequired: string[] = []
): { score: number; matched: string[]; missing: string[] } {
  const resumeLower = resumeText.toLowerCase();
  const jobLower = jobDescription.toLowerCase();

  // What the user has: profile skills + keywords from resume
  const userKeywords = new Set<string>();
  for (const s of resumeSkills) {
    const t = s.toLowerCase().trim();
    if (t) userKeywords.add(t);
  }
  for (const k of extractKeywords(resumeText)) {
    userKeywords.add(k);
  }

  // What the job needs: explicit skills + keywords from description
  const jobKeywords = new Set<string>();
  for (const s of jobSkillsRequired) {
    const t = s.toLowerCase().trim();
    if (t) jobKeywords.add(t);
  }
  for (const k of extractKeywords(jobDescription)) {
    jobKeywords.add(k);
  }

  if (jobKeywords.size === 0) {
    // Job description has no known keywords: check how much of user's skills appear in job
    const matched = [...userKeywords].filter((u) => jobLower.includes(u));
    const missing = SKILL_KEYWORDS.filter((k) => jobLower.includes(k) && !resumeLower.includes(k)).slice(0, 5);
    const matchRatio = userKeywords.size > 0 ? matched.length / userKeywords.size : 0.3;
    const score = Math.round(Math.min(95, 25 + matchRatio * 55));
    return { score, matched: [...new Set(matched)].slice(0, 8), missing };
  }

  const matched: string[] = [];
  const missing: string[] = [];
  for (const jk of jobKeywords) {
    const hasIt = userKeywords.has(jk) || resumeLower.includes(jk);
    if (hasIt) matched.push(jk);
    else missing.push(jk);
  }

  const matchRatio = matched.length / jobKeywords.size;
  const score = Math.round(Math.min(95, 15 + matchRatio * 80));

  return {
    score,
    matched: [...new Set(matched)].slice(0, 8),
    missing: [...new Set(missing)].slice(0, 6),
  };
}
