/**
 * Recrux design tokens — values resolve from CSS variables in styles.css :root.
 * Change colors in one place: :root { --primary: ... }
 */
export const R = {
  bg: "var(--bg-page)",
  nav: "var(--bg-nav)",
  card: "var(--bg-card)",
  primary: "var(--primary)",
  primaryHover: "var(--accent)",
  deep: "var(--text-deep)",
  darkest: "var(--text-primary)",
  body: "var(--text-body)",
  border: "var(--border)",
  muted: "var(--muted)",
  light: "var(--light)",
  mid: "var(--mid)",
  matchHigh: "var(--match-high)",
  matchHighBg: "var(--match-high-bg)",
  matchHighText: "var(--match-high-text)",
  matchMid: "var(--match-mid)",
  matchMidBg: "var(--match-mid-bg)",
  matchMidText: "var(--match-mid-text)",
  warnBg: "var(--warn-bg)",
  warnText: "var(--warn-text)",
  greatBg: "var(--great-bg)",
  greatText: "var(--great-text)",
  gapBg: "var(--gap-bg)",
  gapText: "var(--gap-text)",
} as const;
