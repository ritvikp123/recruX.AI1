/**
 * Best-effort redaction for PII in resume text.
 * This prevents emails/phones/links from polluting optimization prompts and UI previews.
 *
 * Note: this is not a guarantee; it's a pragmatic local dev safeguard.
 */
export function sanitizeResumeText(input: string): string {
  const raw = String(input ?? "");
  if (!raw.trim()) return "";

  let s = raw;

  // Emails
  s = s.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]");

  // Phone numbers (broad)
  s = s.replace(
    /\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g,
    "[redacted phone]"
  );

  // URLs (including LinkedIn/GitHub/portfolio)
  s = s.replace(/\bhttps?:\/\/[^\s)]+/gi, "[redacted url]");
  s = s.replace(/\bwww\.[^\s)]+/gi, "[redacted url]");

  // Common handle-style lines (linkedin.com/in/..., github.com/...)
  s = s.replace(/\blinkedin\.com\/[^\s)]+/gi, "[redacted url]");
  s = s.replace(/\bgithub\.com\/[^\s)]+/gi, "[redacted url]");

  // Clean up repeated redactions / whitespace
  s = s.replace(/\[redacted url\](\s*\[redacted url\])+/g, "[redacted url]");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{4,}/g, "\n\n\n");

  return s.trim();
}

