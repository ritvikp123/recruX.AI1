import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "./Navbar";
import { R } from "../recrux/theme";
import { useAuth } from "../context/AuthContext";

type TutorialSlide = {
  title: string;
  body: string;
  tryPath?: string;
  tryLabel?: string;
};

type TutorialState = {
  finished?: boolean;
  skipped?: boolean;
};

const hairline = `0.5px solid ${R.border}`;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialKey = user?.id ? `recrux-onboarding-tutorial-v3:${user.id}` : null;

  const slides: TutorialSlide[] = useMemo(
    () => [
      {
        title: "Welcome to Recrux",
        body: "This short tutorial walks through the main areas of the app. You can skip anytime with Skip tutorial.",
      },
      {
        title: "Dashboard",
        body: "Your home base for high-match roles, saved jobs, and a quick view of how your profile lines up.",
        tryPath: "/dashboard",
        tryLabel: "Open Dashboard",
      },
      {
        title: "Resume",
        body: "Upload a resume, keep up to five versions, and set your main one so matching uses the right profile.",
        tryPath: "/resume",
        tryLabel: "Open Resume",
      },
      {
        title: "Jobs",
        body: "Search listings, save roles you like, and apply—your activity feeds into Progress over time.",
        tryPath: "/jobs",
        tryLabel: "Open Jobs",
      },
      {
        title: "Progress",
        body: "Track momentum, weekly activity, and use Skill Gap links to focus your learning.",
        tryPath: "/progress",
        tryLabel: "Open Progress",
      },
      {
        title: "You're set",
        body: "Explore the nav anytime. You can adjust your career profile under Settings when you're ready.",
      },
    ],
    []
  );

  useEffect(() => {
    if (!tutorialKey) {
      setTutorialOpen(false);
      return;
    }
    try {
      const raw = window.localStorage.getItem(tutorialKey);
      const data: TutorialState = raw ? JSON.parse(raw) : {};
      if (!data.finished) {
        setTutorialStep(0);
        setTutorialOpen(true);
      } else {
        setTutorialOpen(false);
      }
    } catch {
      setTutorialStep(0);
      setTutorialOpen(true);
    }
  }, [tutorialKey]);

  const persistFinish = (skipped: boolean) => {
    if (!tutorialKey) return;
    try {
      window.localStorage.setItem(tutorialKey, JSON.stringify({ finished: true, skipped }));
    } catch {
      /* ignore */
    }
  };

  const skipTutorial = () => {
    persistFinish(true);
    setTutorialOpen(false);
  };

  const finishTutorial = () => {
    persistFinish(false);
    setTutorialOpen(false);
  };

  const slide = slides[tutorialStep] ?? slides[0];
  const isLast = tutorialStep >= slides.length - 1;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: R.bg,
        fontFamily: "var(--font-body)",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <Navbar />
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>

      {tutorialOpen && slide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recrux-tutorial-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 400,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) skipTutorial();
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              background: R.card,
              border: hairline,
              borderRadius: 14,
              boxShadow: "0 18px 48px rgba(2, 6, 23, 0.28)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ height: 4, background: `linear-gradient(90deg, ${R.primary}, ${R.mid})` }} />
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: R.primary,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Tutorial · Step {tutorialStep + 1} of {slides.length}
                </p>
                <button
                  type="button"
                  onClick={skipTutorial}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: R.body,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Skip tutorial
                </button>
              </div>
              <h2 id="recrux-tutorial-title" style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700, color: R.darkest }}>
                {slide.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: R.deep, lineHeight: 1.55 }}>{slide.body}</p>

              {slide.tryPath && (
                <button
                  type="button"
                  onClick={() => navigate(slide.tryPath!)}
                  style={{
                    marginTop: 14,
                    border: `0.5px solid ${R.primary}`,
                    background: R.light,
                    color: R.primary,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {slide.tryLabel ?? "Open page"}
                </button>
              )}

              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  disabled={tutorialStep === 0}
                  onClick={() => setTutorialStep((s) => Math.max(0, s - 1))}
                  style={{
                    border: hairline,
                    background: R.card,
                    color: tutorialStep === 0 ? R.muted : R.darkest,
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: tutorialStep === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  Back
                </button>
                <div style={{ display: "flex", gap: 8 }}>
                  {!isLast ? (
                    <button
                      type="button"
                      onClick={() => setTutorialStep((s) => Math.min(slides.length - 1, s + 1))}
                      style={{
                        border: "none",
                        background: R.primary,
                        color: "#fff",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={finishTutorial}
                      style={{
                        border: "none",
                        background: R.primary,
                        color: "#fff",
                        borderRadius: 8,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Get started
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
