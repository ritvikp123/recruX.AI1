import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { SiteFooter } from "../components/SiteFooter";
import { applyLandingPageSeo } from "../lib/pageSeo";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Briefcase,
  Code2,
  FileText,
  Layers,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
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
          <h3 className="recrux-heading" style={{ fontSize: 15, fontWeight: 700, color: R.darkest, margin: 0 }}>
            {title}
          </h3>
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
  useEffect(() => {
    applyLandingPageSeo();
  }, []);

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
        className="landing-header"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          height: 56,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(12px, 4vw, 22px)",
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
        <div className="landing-header-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <Link
            to="/signin"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: R.primary,
              textDecoration: "none",
              padding: "8px 12px",
              whiteSpace: "nowrap",
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
              whiteSpace: "nowrap",
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
                fontSize: "clamp(28px, 6vw, 44px)",
                fontWeight: 700,
                color: R.darkest,
                marginTop: 14,
                marginBottom: 0,
                lineHeight: 1.12,
                letterSpacing: "-0.03em",
              }}
            >
              AI job matching &amp; resume analysis for roles that fit{" "}
              <span style={{ color: R.primary, textDecoration: "underline", textDecorationThickness: 2, textUnderlineOffset: 4 }}>
                you
              </span>
            </h1>
            <p
              className="landing-hero-subtitle"
              style={{
                fontSize: "clamp(15px, 3.8vw, 17px)",
                color: R.deep,
                marginTop: 18,
                marginBottom: 0,
                lineHeight: 1.55,
              }}
            >
              Run a focused tech job search with skill gap insights—see how listings line up with your resume, then tune
              bullets and keywords in one workspace.
            </p>
            <div className="landing-hero-cta" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
              <Link
                to="/get-started"
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

        {/* How it works */}
        <section
          aria-labelledby="how-it-works-heading"
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            borderTop: hairline,
            padding: "clamp(40px, 6vw, 56px) 20px clamp(48px, 6vw, 64px)",
          }}
        >
          <h2
            id="how-it-works-heading"
            className="recrux-heading"
            style={{
              fontSize: "clamp(22px, 4.5vw, 30px)",
              fontWeight: 700,
              color: R.darkest,
              textAlign: "center",
              margin: "0 auto 12px",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            How Recrux.ai Works
          </h2>
          <p
            style={{
              fontSize: "clamp(15px, 3.5vw, 17px)",
              fontWeight: 500,
              color: R.deep,
              textAlign: "center",
              margin: "0 auto 10px",
              maxWidth: 680,
              lineHeight: 1.55,
            }}
          >
            Upload your resume, let AI analyze your skills, and discover smarter job matches tailored to your experience.
          </p>
          <p
            style={{
              fontSize: 13,
              color: R.body,
              textAlign: "center",
              margin: "0 auto 0",
              maxWidth: 640,
              lineHeight: 1.5,
            }}
          >
            Resume analysis, AI job matching, and personalized recommendations—built for tech careers who want a calmer,
            clearer search.
          </p>

          <div className="landing-how-grid">
            {[
              {
                step: 1,
                title: "Upload Your Resume",
                description:
                  "Upload your resume securely and let Recrux.ai analyze your experience, skills, and career background.",
                icon: <Upload size={22} strokeWidth={2} aria-hidden />,
              },
              {
                step: 2,
                title: "AI Analyzes Your Profile",
                description:
                  "Our AI evaluates your resume, identifies strengths and skill gaps, and matches you with relevant opportunities.",
                icon: <Sparkles size={22} strokeWidth={2} aria-hidden />,
              },
              {
                step: 3,
                title: "Get Matched to Better Jobs",
                description:
                  "Receive personalized job recommendations designed to align with your skills, goals, and career interests.",
                icon: <Target size={22} strokeWidth={2} aria-hidden />,
              },
            ].map((item) => (
              <article
                key={item.step}
                className="landing-how-card"
                style={{
                  position: "relative",
                  background: R.card,
                  border: hairline,
                  borderRadius: 14,
                  padding: "22px 20px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  minWidth: 0,
                }}
              >
                <span
                  className="recrux-heading"
                  aria-label={`Step ${item.step}`}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: R.light,
                    color: R.primary,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.step}
                </span>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: R.light,
                    color: R.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  {item.icon}
                </div>
                <h3 className="recrux-heading" style={{ fontSize: 17, fontWeight: 700, color: R.darkest, margin: "0 36px 10px 0", lineHeight: 1.25 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 14, color: R.body, margin: 0, lineHeight: 1.55 }}>{item.description}</p>
              </article>
            ))}
          </div>

          <div className="landing-how-cta-wrap" style={{ textAlign: "center", marginTop: 32 }}>
            <Link
              to="/get-started"
              className="landing-how-cta"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 600,
                color: "#fff",
                background: R.primary,
                padding: "14px 28px",
                borderRadius: 999,
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(24, 95, 165, 0.3)",
              }}
            >
              Get Started Free
              <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
            </Link>
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
                fontSize: "clamp(18px, 4vw, 22px)",
                fontWeight: 700,
                color: R.darkest,
                textAlign: "center",
                margin: "0 auto 12px",
                maxWidth: 720,
                lineHeight: 1.25,
              }}
            >
              Resume analysis, skill gap insights &amp; smarter AI job matching
            </h2>
            <p
              style={{
                fontSize: "clamp(15px, 3.5vw, 17px)",
                fontWeight: 500,
                color: R.deep,
                textAlign: "center",
                margin: "0 auto 36px",
                maxWidth: 640,
                lineHeight: 1.55,
              }}
            >
              Everything for your tech job search in one calm workspace—live roles, match signals, saved and applied
              tracking, and resume tools side by side.
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
          <h2
            className="recrux-heading"
            style={{ fontSize: "clamp(20px, 4.5vw, 24px)", fontWeight: 700, color: R.darkest, margin: "0 0 28px" }}
          >
            Start your tech job search in three steps
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
              {
                title: "Create your free account",
                body: "Set your target field so AI job matching and recommendations stay relevant.",
              },
              {
                title: "Upload your resume for analysis",
                body: "We extract skills and gaps so match scores and skill gap insights reflect your real profile.",
              },
              {
                title: "Browse, save, and apply with clarity",
                body: "Use live listings, shortlists, and application tracking while you refine your resume for each role.",
              },
            ].map((step, i) => (
              <li
                key={step.title}
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
                <div style={{ minWidth: 0 }}>
                  <h3 className="recrux-heading" style={{ fontSize: 16, fontWeight: 700, color: R.darkest, margin: "4px 0 6px" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 15, color: R.deep, margin: 0, lineHeight: 1.5 }}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            to="/get-started"
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

        <SiteFooter showAuthLinks showWordmark />
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
        @media (max-width: 520px) {
          .landing-hero-cta {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            max-width: 360px;
            margin-left: auto;
            margin-right: auto;
          }
          .landing-hero-cta a {
            justify-content: center;
            width: 100%;
            box-sizing: border-box;
          }
          .landing-header .landing-header-actions {
            gap: 6px;
          }
        }

        .landing-how-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 32px;
        }
        @media (min-width: 900px) {
          .landing-how-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }
        .landing-how-card {
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        @media (hover: hover) and (pointer: fine) {
          .landing-how-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(4, 44, 83, 0.12);
          }
        }
        @media (max-width: 520px) {
          .landing-how-cta-wrap {
            width: 100%;
            max-width: 360px;
            margin-left: auto;
            margin-right: auto;
          }
          .landing-how-cta {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
}
