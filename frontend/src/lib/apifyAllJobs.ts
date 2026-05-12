import axios from "axios";
import type { Job } from "../types/job";

/** [All Jobs Scraper](https://apify.com/agentx/all-jobs-scraper) — actor id from Apify Console. */
export const APIFY_ALL_JOBS_ACTOR_ID = "jpraRc4MCUh5ehbHV";

const RUN_SYNC = `https://api.apify.com/v2/acts/${APIFY_ALL_JOBS_ACTOR_ID}/run-sync-get-dataset-items`;

/** Matches prior live-search cap; keeps each Apify run small (pay-per-event per job). */
export const ALL_JOBS_MAX_RESULTS_PER_SEARCH = 10;

/** Actor `country` must match this list exactly (see Apify input schema). */
export const APIFY_ALLOWED_COUNTRIES = [
  "Argentina",
  "Australia",
  "Austria",
  "Bahrain",
  "Bangladesh",
  "Belgium",
  "Bulgaria",
  "Brazil",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Costa Rica",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Ecuador",
  "Egypt",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hong Kong",
  "Hungary",
  "India",
  "Indonesia",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Kuwait",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malaysia",
  "Malta",
  "Mexico",
  "Morocco",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Norway",
  "Oman",
  "Pakistan",
  "Panama",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Saudi Arabia",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sweden",
  "Switzerland",
  "Taiwan",
  "Thailand",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Venezuela",
  "Vietnam",
] as const;

export type ApifyCountry = (typeof APIFY_ALLOWED_COUNTRIES)[number];

const ALLOWED_COUNTRY_BY_LOWER = new Map(
  APIFY_ALLOWED_COUNTRIES.map((c) => [c.toLowerCase(), c] as const)
);

/** Common `.env` / user typos → exact Apify label */
const COUNTRY_ALIASES: Record<string, ApifyCountry> = {
  usa: "United States",
  us: "United States",
  "u.s.a": "United States",
  "u.s.a.": "United States",
  "u.s": "United States",
  "u.s.": "United States",
  america: "United States",
  uk: "United Kingdom",
  "u.k": "United Kingdom",
  "u.k.": "United Kingdom",
  britain: "United Kingdom",
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  "great britain": "United Kingdom",
  uae: "United Arab Emirates",
  emirates: "United Arab Emirates",
  korea: "South Korea",
  "south-korea": "South Korea",
};

function stripSurroundingQuotes(s: string): string {
  let t = s.trim();
  while (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

/**
 * Resolves `VITE_JOBS_SEARCH_COUNTRY` or UI input to a value Apify accepts.
 * Unknown values fall back so a bad `.env` does not break every search.
 */
export function resolveCountryForApify(
  raw: string | undefined | null,
  fallback: ApifyCountry = "United States"
): ApifyCountry {
  const cleaned = stripSurroundingQuotes(String(raw ?? "").trim());
  if (!cleaned) return fallback;
  const lower = cleaned.toLowerCase();
  const alias = COUNTRY_ALIASES[lower];
  if (alias) return alias;
  const exact = ALLOWED_COUNTRY_BY_LOWER.get(lower);
  if (exact) return exact;
  if (import.meta.env.DEV && cleaned) {
    console.warn(
      `[Apify All Jobs Scraper] Unknown country "${cleaned}" — using "${fallback}". ` +
        `Use an exact label from the actor schema (e.g. United States, United Kingdom) or remove VITE_JOBS_SEARCH_COUNTRY.`
    );
  }
  return fallback;
}

function bearer(): string {
  const token =
    import.meta.env.VITE_APIFY_TOKEN?.trim() ||
    import.meta.env.VITE_APIFY_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "Missing VITE_APIFY_TOKEN in .env — create a free account at https://console.apify.com/ → Integrations → API token."
    );
  }
  return token;
}

function formatAxiosError(err: unknown): string {
  if (!axios.isAxiosError(err)) return String(err ?? "Unknown error");
  const status = err.response?.status;
  const statusText = err.response?.statusText;
  const payload = err.response?.data as unknown;
  let detail = "";
  if (payload && typeof payload === "object" && "error" in payload) {
    const e = (payload as { error?: { message?: string; type?: string } }).error;
    if (e?.message) detail = e.message;
    else if (e?.type) detail = e.type;
  } else {
    try {
      if (typeof payload === "string") detail = payload;
      else if (payload && typeof payload === "object") detail = JSON.stringify(payload);
    } catch {
      /* ignore */
    }
  }
  const head = status
    ? `Apify All Jobs Scraper failed (${status}${statusText ? ` ${statusText}` : ""})`
    : "Apify All Jobs Scraper request failed";
  const bits = [head, err.message, detail].map((s) => (s || "").trim()).filter(Boolean);
  return bits.join(" — ");
}

/** Map dashboard/Jobs employment filter to actor `job_type` (schema: all | fulltime | contract). */
export function mapEmploymentTypeToApifyJobType(employmentType: string): string {
  const u = employmentType.trim().toUpperCase();
  if (u === "FULLTIME") return "fulltime";
  if (u === "CONTRACTOR") return "contract";
  /** Part-time / intern filters are not separate enums on this actor — widen search then filter in UI. */
  return "all";
}

function skillsFromApifyField(skills: unknown): string[] | undefined {
  if (Array.isArray(skills)) return skills.map(String).filter(Boolean);
  if (typeof skills === "string" && skills.trim()) {
    return skills
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

export function normalizeApifyAllJobsItem(item: Record<string, unknown>): Job {
  const platformUrl = item.platform_url != null ? String(item.platform_url) : "";
  const officialUrl = item.official_url != null ? String(item.official_url) : "";
  const title = String(item.title ?? "");
  const company = String(item.company_name ?? "");
  const posted = item.posted_date != null ? String(item.posted_date) : undefined;
  const id =
    platformUrl ||
    officialUrl ||
    `apify:${String(item.platform ?? "job")}:${title}:${company}:${posted ?? ""}`;

  return {
    id,
    title,
    company,
    employerLogo: item.company_logo != null ? String(item.company_logo) : undefined,
    location: String(item.location ?? ""),
    description: String(item.description ?? ""),
    applyUrl: officialUrl || platformUrl || undefined,
    salaryMin: typeof item.salary_minimum === "number" ? item.salary_minimum : undefined,
    salaryMax: typeof item.salary_maximum === "number" ? item.salary_maximum : undefined,
    remote: !!item.is_remote,
    skills: skillsFromApifyField(item.skills),
    postedAt: posted,
  };
}

export type SearchApifyAllJobsParams = {
  query?: string;
  page?: number;
  remoteOnly?: boolean;
  employmentType?: string;
  /** City/region (no country — use `country`). */
  location?: string;
  /** e.g. `United States` — default from env or United States. */
  country?: string;
};

/**
 * Runs [All Jobs Scraper](https://apify.com/agentx/all-jobs-scraper) synchronously and returns normalized jobs.
 * Works on Apify’s **Free** plan (sign up at https://apify.com/pricing — monthly usage credits).
 * The actor bills pay-per-event per job scraped; we cap `max_results` and `maxTotalChargeUsd` per request.
 */
export async function searchApifyAllJobs(
  params: SearchApifyAllJobsParams = {}
): Promise<Job[]> {
  const {
    query = "Software Engineer",
    page = 1,
    remoteOnly = false,
    employmentType = "",
    location = "",
    country: countryParam,
  } = params;

  const country = resolveCountryForApify(
    countryParam || import.meta.env.VITE_JOBS_SEARCH_COUNTRY,
    "United States"
  );

  const jobType = mapEmploymentTypeToApifyJobType(employmentType);

  const maxResults = ALL_JOBS_MAX_RESULTS_PER_SEARCH;
  const offset = Math.max(0, (page - 1) * ALL_JOBS_MAX_RESULTS_PER_SEARCH);

  const input: Record<string, unknown> = {
    keyword: query,
    country,
    max_results: Math.min(250, maxResults + offset + 5),
    remote_only: remoteOnly,
    posted_since: "1 month",
    job_type: jobType,
    currency: "USD",
  };
  if (location.trim()) input.location = location.trim();

  const qs = new URLSearchParams({
    timeout: "300",
    limit: String(maxResults),
    offset: String(offset),
    /** Hard cap on actor charges for one request (Apify may require ≥ $1 on some pricing tiers). */
    maxTotalChargeUsd: "1",
  });

  try {
    const { data } = await axios.post<Record<string, unknown>[] | { items?: Record<string, unknown>[] }>(
      `${RUN_SYNC}?${qs}`,
      input,
      {
        headers: {
          Authorization: `Bearer ${bearer()}`,
          "Content-Type": "application/json",
        },
        timeout: 320_000,
      }
    );
    const raw = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return raw.map((row) => normalizeApifyAllJobsItem(row)).slice(0, ALL_JOBS_MAX_RESULTS_PER_SEARCH);
  } catch (err: unknown) {
    throw new Error(formatAxiosError(err));
  }
}
