import { Link } from "react-router-dom";
import { R } from "../../recrux/theme";

function IllustrationSearch() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden style={{ marginBottom: 8 }}>
      <ellipse cx="60" cy="88" rx="40" ry="6" fill={R.muted} opacity={0.6} />
      <rect x="28" y="22" width="56" height="44" rx="8" fill={R.light} stroke={R.border} strokeWidth="1" />
      <path d="M40 38h32M40 48h24M40 58h28" stroke={R.border} strokeWidth="2" strokeLinecap="round" />
      <circle cx="78" cy="32" r="18" fill={R.card} stroke={R.primary} strokeWidth="2" />
      <path d="M90 44l10 10" stroke={R.primary} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="78" cy="32" r="6" fill={R.mid} opacity={0.35} />
    </svg>
  );
}

function IllustrationBriefcase() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" aria-hidden style={{ marginBottom: 8 }}>
      <ellipse cx="60" cy="88" rx="40" ry="6" fill={R.muted} opacity={0.6} />
      <rect x="32" y="36" width="56" height="40" rx="6" fill={R.light} stroke={R.primary} strokeWidth="1.5" />
      <path d="M44 36V30a8 8 0 0116 0v6" stroke={R.primary} strokeWidth="1.5" fill="none" />
      <rect x="52" y="48" width="16" height="10" rx="2" fill={R.muted} />
      <circle cx="60" cy="42" r="3" fill={R.mid} opacity={0.5} />
    </svg>
  );
}

type Variant = "search" | "saved" | "applications";

export function RecruxEmptyState({
  variant = "search",
  title,
  description,
  ctaLabel,
  ctaTo,
  onCtaClick,
  compact,
}: {
  variant?: Variant;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTo?: string;
  onCtaClick?: () => void;
  compact?: boolean;
}) {
  const illo = variant === "saved" ? <IllustrationBriefcase /> : <IllustrationSearch />;

  const ctaStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: compact ? 12 : 16,
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    background: R.primary,
    padding: compact ? "8px 16px" : "10px 20px",
    borderRadius: 24,
    textDecoration: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
  } as const;

  const inner = (
    <>
      {!compact && illo}
      <h3
        style={{
          fontSize: compact ? 13 : 15,
          fontWeight: 600,
          color: R.darkest,
          margin: 0,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: compact ? 11 : 12,
          color: R.deep,
          margin: compact ? "6px 0 0" : "8px 0 0",
          lineHeight: 1.5,
          maxWidth: 320,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {description}
      </p>
      {ctaTo ? (
        <Link to={ctaTo} style={ctaStyle}>
          {ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <button type="button" style={ctaStyle} onClick={onCtaClick}>
          {ctaLabel}
          <span aria-hidden>→</span>
        </button>
      )}
    </>
  );

  if (compact) {
    return (
      <div
        style={{
          background: R.card,
          border: `0.5px dashed ${R.border}`,
          borderRadius: 10,
          padding: "16px 14px",
          textAlign: "center",
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <div
      style={{
        background: R.card,
        border: `0.5px solid ${R.border}`,
        borderRadius: 10,
        padding: "28px 20px 24px",
        textAlign: "center",
      }}
    >
      {inner}
    </div>
  );
}
