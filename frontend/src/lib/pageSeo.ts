/** Production canonical host for SEO (matches index.html defaults). */
export const SITE_ORIGIN = "https://www.recrux.ai";

export const DEFAULT_HOME_SEO = {
  title: "Recrux.ai | AI-Powered Job Matching Platform",
  description:
    "Recrux.ai helps candidates discover smarter job matches through AI-powered resume analysis, skill-gap insights, and personalized career recommendations.",
  path: "/",
} as const;

function setMetaBySelector(selector: string, content: string) {
  const el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (el) el.setAttribute("content", content);
}

function setLinkRel(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export interface PageSeoInput {
  title: string;
  description: string;
  /** Path only, e.g. "/privacy" */
  path: string;
}

export function applyPageSeo({ title, description, path }: PageSeoInput) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const canonical = `${SITE_ORIGIN}${normalized === "/" ? "/" : normalized}`;

  document.title = title;
  setMetaBySelector('meta[name="description"]', description);
  setMetaBySelector('meta[property="og:title"]', title);
  setMetaBySelector('meta[property="og:description"]', description);
  setMetaBySelector('meta[property="og:url"]', canonical);
  setMetaBySelector('meta[property="og:image"]', `${SITE_ORIGIN}/og-image.png`);
  setMetaBySelector('meta[name="twitter:title"]', title);
  setMetaBySelector('meta[name="twitter:description"]', description);
  setMetaBySelector('meta[name="twitter:image"]', `${SITE_ORIGIN}/og-image.png`);
  setLinkRel("canonical", canonical);
}

export function applyLandingPageSeo() {
  applyPageSeo({
    title: DEFAULT_HOME_SEO.title,
    description: DEFAULT_HOME_SEO.description,
    path: DEFAULT_HOME_SEO.path,
  });
}

/** Reset `<title>` and global meta tags to the homepage defaults (SPA route changes). */
export function resetDocumentSeoToHome() {
  applyLandingPageSeo();
}
