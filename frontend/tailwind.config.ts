import type { Config } from "tailwindcss";

/** Maps to CSS variables in src/styles.css :root */
const brand = {
  bg: "var(--bg-page)",
  nav: "var(--bg-nav)",
  card: "var(--bg-card)",
  primary: "var(--primary)",
  deep: "var(--text-deep)",
  darkest: "var(--text-primary)",
  border: "var(--border)",
  muted: "var(--muted)",
  light: "var(--light)",
  mid: "var(--mid)",
} as const;

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /** Auth & legacy forms use bg-js-brand-* */
        js: {
          brand,
        },
        /** Alias for any jsc-* classes */
        jsc: {
          brand,
          status: {
            great: { bg: "var(--great-bg)", text: "var(--great-text)" },
            gap: { bg: "var(--gap-bg)", text: "var(--gap-text)" },
          },
        },
      },
      borderWidth: {
        hairline: "0.5px",
      },
    },
  },
  plugins: [],
};

export default config;
