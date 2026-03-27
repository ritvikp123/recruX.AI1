import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Briefcase,
  Code2,
  FileText,
  Layers,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";
import { R } from "../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

const PREVIEW_MATCH_CARDS = [
  {
    title: "Product Engineer",
    subtitle: "Northwind Labs · Remote",
    pct: 89,
    badge: "Strong match",
    badgeBg: "var(--match-high-bg)",
    badgeColor: "var(--match-high-text)",
    blurb: "Stack lines up with your React and API experience.",
    icon: <Briefcase size={20} strokeWidth={2} />,
  },
  {
    title: "Full Stack Developer",
    subtitle: "Aurora Systems · Hybrid",
    pct: 76,
    badge: "Good match",
    badgeBg: "var(--match-mid-bg)",
    badgeColor: "var(--match-mid-text)",
    blurb: "Strong on frontend; add one backend project to climb higher.",
    icon: <Code2 size={20} strokeWidth={2} />,
  },
  {
    title: "Software Engineer II",
    subtitle: "Contoso Analytics · San Francisco",
    pct: 68,
    badge: "Stretch role",
    badgeBg: "var(--gap-bg)",
    badgeColor: "var(--gap-text)",
    blurb: "Keywords overlap — tighten system design on your resume.",
    icon: <Layers size={20} strokeWidth={2} />,
  },
] as const;

function LandingPreviewMatchCard({
  title,
  subtitle,
  pct,
  badge,
  badgeBg,
  badgeColor,
  blurb,
  icon,
}: (typeof PREVIEW_MATCH_CARDS)[number]) {
  return (
    <div
      style={{
        background: R.card,
        border: hairline,
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 8px 28px rgba(4, 44, 83, 0.1)",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: R.light,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: R.primary,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p className="recrux-heading" style={{ fontSize: 15, fontWeight: 700, color: R.darkest, margin: 0 }}>
            {title}
          </p>
          <p style={{ fontSize: 12, color: R.primary, fontWeight: 500, margin: "3px 0 0" }}>{subtitle}</p>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: R.primary,
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              {pct}%
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 999,
                background: badgeBg,
                color: badgeColor,
              }}
            >
              {badge}
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              height: 3,
              borderRadius: 2,
              background: R.muted,
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${pct}%`, height: "100%", background: R.primary, borderRadius: 2 }} />
          </div>
        </div>
      </div>
      <p style={{ fontSize: 11, color: R.body, margin: "12px 0 0", lineHeight: 1.45 }}>{blurb}</p>
    </div>
  );
}

export function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: R.bg, position: "relative", overflow: "hidden" }}>
      {/* soft background depth */}
      <div
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(24, 95, 165, 0.18), transparent 55%),
            radial-gradient(ellipse 60% 40% at 100% 30%, rgba(55, 138, 221, 0.12), transparent 50%),
            radial-gradient(ellipse 50% 35% at 0% 70%, rgba(133, 183, 235, 0.2), transparent 45%)
          `,
        }}
      />

      <header
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          height: 56,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: hairline,
        }}
      >
        <span
          className="recrux-heading"
          style={{ fontSize: 17, fontWeight: 600, color: R.primary, textTransform: "lowercase" }}
        >
          rec<span style={{ fontStyle: "italic" }}>r</span>ux
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            to="/signin"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: R.primary,
              textDecoration: "none",
              padding: "8px 12px",
            }}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: R.primary,
              padding: "8px 16px",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(24, 95, 165, 0.25)",
            }}
          >
            Get started
          </Link>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <section
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "clamp(40px, 8vw, 72px) 20px 48px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 36,
          }}
        >
          <div className="landing-hero-copy">
            <p
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: R.primary,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              <Zap size={14} strokeWidth={2.5} aria-hidden />
              Smarter job search
            </p>
            <h1
              className="recrux-heading landing-hero-title"
              style={{
                fontSize: "clamp(32px, 6vw, 44px)",
                fontWeight: 700,
                color: R.darkest,
                marginTop: 14,
                marginBottom: 0,
                lineHeight: 1.12,
                letterSpacing: "-0.03em",
              }}
            >
              Land roles that fit{" "}
              <span style={{ color: R.primary, textDecoration: "underline", textDecorationThickness: 2, textUnderlineOffset: 4 }}>
                your
              </span>{" "}
              resume
            </h1>
            <p
              className="landing-hero-subtitle"
              style={{
                fontSize: 17,
                color: R.deep,
                marginTop: 18,
                marginBottom: 0,
                lineHeight: 1.55,
              }}
            >
              Browse live listings, see match scores against your profile, and tune your resume — without juggling ten
              browser tabs.
            </p>
            <div className="landing-hero-cta" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <Link
                to="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#fff",
                  background: R.primary,
                  padding: "14px 26px",
                  borderRadius: 999,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(24, 95, 165, 0.35)",
                }}
              >
                Get started free
                <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
              </Link>
              <Link
                to="/signin"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: R.primary,
                  background: R.card,
                  padding: "14px 26px",
                  borderRadius: 999,
                  textDecoration: "none",
                  border: hairline,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                I have an account
              </Link>
            </div>
            <ul className="landing-hero-bullets" style={{ listStyle: "none", padding: 0, margin: "32px 0 0", display: "flex", flexWrap: "wrap", gap: "12px 24px", fontSize: 13, color: R.body, fontWeight: 500 }}>
              {["Live job data", "Saved & applied tracking", "Resume optimizer"].map((t) => (
                <li key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: R.mid,
                      flexShrink: 0,
                    }}
                  />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Preview cards — one row, side by side */}
          <div style={{ width: "100%" }}>
            <div className="landing-hero-cards-row">
              {PREVIEW_MATCH_CARDS.map((card) => (
                <LandingPreviewMatchCard key={card.title} {...card} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: R.body, textAlign: "center", margin: "12px 0 0", opacity: 0.9 }}>
              Example match cards — not live listings
            </p>
          </div>
        </section>

        {/* Features */}
        <section
          style={{
            background: "rgba(255, 255, 255, 0.45)",
            borderTop: hairline,
            borderBottom: hairline,
            padding: "56px 20px",
          }}
        >
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <h2
              className="recrux-heading"
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: R.deep,
                textAlign: "center",
                margin: "0 0 8px",
              }}
            >
              What you get
            </h2>
            <p
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: R.darkest,
                textAlign: "center",
                margin: "0 0 36px",
                fontFamily: "var(--font-heading)",
              }}
            >
              Everything in one calm workspace
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {[
                {
                  icon: <Search size={22} strokeWidth={2} />,
                  title: "Search & filter",
                  body: "Query real roles and narrow by location, remote, and salary so you spend time on fits.",
                },
                {
                  icon: <BarChart3 size={22} strokeWidth={2} />,
                  title: "Match scores",
                  body: "See how each posting lines up with your resume and where to tighten your story.",
                },
                {
                  icon: <Bookmark size={22} strokeWidth={2} />,
                  title: "Saved & applied",
                  body: "Keep a shortlist and log applications so you always know what’s in flight.",
                },
                {
                  icon: <FileText size={22} strokeWidth={2} />,
                  title: "Resume tools",
                  body: "Upload, parse, and experiment with rewrites tailored to the jobs you want.",
                },
                {
                  icon: <Layers size={22} strokeWidth={2} />,
                  title: "Dashboard",
                  body: "High-match picks, streaks, and stats at a glance when you open the app.",
                },
                {
                  icon: <TrendingUp size={22} strokeWidth={2} />,
                  title: "Progress",
                  body: "Track momentum over time with simple charts — nudges to stay consistent.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: R.card,
                    border: hairline,
                    borderRadius: 14,
                    padding: 22,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: R.light,
                      color: R.primary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="recrux-heading" style={{ fontSize: 16, fontWeight: 700, color: R.darkest, margin: "0 0 8px" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: R.body, margin: 0, lineHeight: 1.5 }}>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps + CTA */}
        <section style={{ padding: "56px 20px 64px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <h2 className="recrux-heading" style={{ fontSize: 24, fontWeight: 700, color: R.darkest, margin: "0 0 28px" }}>
            Start in three steps
          </h2>
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: "0 0 36px",
              textAlign: "left",
              counterReset: "step",
            }}
          >
            {[
              "Create your free account and set your target field.",
              "Upload a resume or paste skills so matches mean something.",
              "Browse jobs, save favorites, and apply with your stats in view.",
            ].map((step, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  marginBottom: i < 2 ? 20 : 0,
                  counterIncrement: "step",
                }}
              >
                <span
                  className="recrux-heading"
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: R.primary,
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </span>
                <p style={{ fontSize: 16, color: R.deep, margin: "6px 0 0", lineHeight: 1.5 }}>{step}</p>
              </li>
            ))}
          </ol>
          <Link
            to="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              color: "#fff",
              background: R.primary,
              padding: "16px 32px",
              borderRadius: 999,
              textDecoration: "none",
              boxShadow: "0 4px 16px rgba(24, 95, 165, 0.3)",
            }}
          >
            Create your account
            <ArrowRight size={18} strokeWidth={2.2} />
          </Link>
        </section>

        <footer
          style={{
            borderTop: hairline,
            padding: "24px 20px 32px",
            background: "rgba(255,255,255,0.5)",
          }}
        >
          <div
            style={{
              maxWidth: 1040,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <span className="recrux-heading" style={{ fontSize: 15, fontWeight: 600, color: R.primary }}>
              rec<span style={{ fontStyle: "italic" }}>r</span>ux
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 13 }}>
              <Link to="/signin" style={{ color: R.body, textDecoration: "none", fontWeight: 500 }}>
                Sign in
              </Link>
              <Link to="/signup" style={{ color: R.body, textDecoration: "none", fontWeight: 500 }}>
                Sign up
              </Link>
            </div>
            <p style={{ fontSize: 12, color: R.body, margin: 0, width: "100%", textAlign: "center" }}>
              © {new Date().getFullYear()} Recrux. Built for focused job seekers.
            </p>
          </div>
        </footer>
      </main>

      <style>{`
        .landing-hero-copy {
          text-align: center;
          width: 100%;
        }
        .landing-hero-title {
          max-width: 640px;
          margin-left: auto;
          margin-right: auto;
        }
        .landing-hero-subtitle {
          max-width: 520px;
          margin-left: auto;
          margin-right: auto;
        }
        .landing-hero-cta,
        .landing-hero-bullets {
          justify-content: center;
        }
        .landing-hero-cards-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          gap: 12px;
          justify-content: center;
          align-items: stretch;
          width: 100%;
          overflow-x: auto;
          padding-bottom: 4px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .landing-hero-cards-row > * {
          flex: 0 0 min(280px, 82vw);
          min-width: 0;
        }
        @media (min-width: 960px) {
          .landing-hero-cards-row {
            flex-wrap: wrap;
            overflow-x: visible;
            justify-content: center;
          }
          .landing-hero-cards-row > * {
            flex: 1 1 0;
            max-width: 340px;
            min-width: 200px;
          }
        }
      `}</style>
    </div>
  );
}
