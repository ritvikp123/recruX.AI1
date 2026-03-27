import type { CSSProperties } from "react";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import type { RecruxJobCardData } from "../../types/recruxJobCard";
import { R } from "../../recrux/theme";

const hairline = `0.5px solid ${R.border}`;

const FIT_STYLES: Record<
  RecruxJobCardData["fit"],
  { background: string; color: string }
> = {
  great: { background: R.matchHighBg, color: R.matchHighText },
  gap: { background: R.matchMidBg, color: R.matchMidText },
  warn: { background: R.warnBg, color: R.warnText },
};

function ghostBtn(): CSSProperties {
  return {
    fontSize: 12,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 8,
    border: hairline,
    background: "transparent",
    color: R.darkest,
    cursor: "pointer",
    fontFamily: "inherit",
  };
}

export function RecruxJobCard({
  job,
  onApply,
  onOptimize,
  onWhy,
  saved,
  onToggleSave,
}: {
  job: RecruxJobCardData;
  onApply?: (url?: string) => void;
  onOptimize?: () => void;
  onWhy?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const {
    title,
    company,
    location,
    pay,
    matchPct,
    fit,
    fitLabel,
    iconBg,
    iconColor,
    iconLetter,
    matchColor,
    logoUrl,
    applyUrl,
  } = job;

  const handleApply = () => {
    if (onApply) onApply(applyUrl);
    else if (applyUrl) window.open(applyUrl, "_blank", "noopener");
  };

  const showLogo = logoUrl && !logoFailed;

  return (
    <div
      style={{
        background: R.card,
        border: hairline,
        borderRadius: 10,
        padding: 14,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        width: "100%",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: showLogo ? "#ffffff" : iconBg,
          color: iconColor,
          border: showLogo ? hairline : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 600,
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {showLogo ? (
          <img
            src={logoUrl}
            alt=""
            style={{ width: "70%", height: "70%", objectFit: "contain" }}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          iconLetter
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div
            className="recrux-heading"
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: R.darkest,
              lineHeight: 1.25,
            }}
          >
            {title}
          </div>
          {onToggleSave && (
            <button
              type="button"
              aria-label={saved ? "Remove from saved" : "Save job"}
              title={saved ? "Saved" : "Save job"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              style={{
                flexShrink: 0,
                padding: 4,
                border: "none",
                background: saved ? R.light : "transparent",
                borderRadius: 8,
                cursor: "pointer",
                color: R.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bookmark size={18} color={R.primary} fill={saved ? R.primary : "none"} strokeWidth={2} />
            </button>
          )}
        </div>
        <div style={{ fontSize: 13, color: R.primary, fontWeight: 500 }}>
          {company} · {location}
          {pay ? ` · ${pay}` : ""}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: R.primary,
              color: "#ffffff",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleApply();
            }}
          >
            Apply
          </button>
          <button
            type="button"
            style={ghostBtn()}
            onClick={(e) => {
              e.stopPropagation();
              onOptimize?.();
            }}
          >
            Optimize
          </button>
          {onWhy && (
            <button
              type="button"
              style={ghostBtn()}
              onClick={(e) => {
                e.stopPropagation();
                onWhy();
              }}
            >
              Why rejected?
            </button>
          )}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 56 }}>
        <div
          className="recrux-heading"
          style={{
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: matchColor || R.primary,
            lineHeight: 1.1,
          }}
        >
          {matchPct}%
        </div>
        <div
          style={{
            width: 56,
            height: 3,
            background: R.muted,
            borderRadius: 2,
            overflow: "hidden",
            marginTop: 6,
            marginLeft: "auto",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${Math.min(100, matchPct)}%`,
              background: matchColor || R.primary,
              borderRadius: 2,
            }}
          />
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 10,
            display: "inline-block",
            marginTop: 8,
            ...FIT_STYLES[fit],
          }}
        >
          {fitLabel}
        </div>
      </div>
    </div>
  );
}
