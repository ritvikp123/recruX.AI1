import React from "react";
import { R } from "../recrux/theme";

export function ApplyConfirmModal({
  open,
  title = "Did you apply?",
  subtitle = "If you applied, we’ll add this role to Applied so you can track it.",
  onYes,
  onNo,
}: {
  open: boolean;
  title?: string;
  subtitle?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  if (!open) return null;

  const hairline = `0.5px solid ${R.border}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(3, 18, 38, 0.45)",
        zIndex: 5000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onMouseDown={(e) => {
        // click outside to dismiss (treat as "No")
        if (e.currentTarget === e.target) onNo();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: R.card,
          border: hairline,
          borderRadius: 14,
          boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
          padding: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="recrux-heading" style={{ fontSize: 16, fontWeight: 800, color: R.darkest }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: R.deep, lineHeight: 1.45 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
          <button
            type="button"
            onClick={onNo}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: "9px 12px",
              borderRadius: 10,
              border: hairline,
              background: "transparent",
              color: R.darkest,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            No
          </button>
          <button
            type="button"
            onClick={onYes}
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "9px 12px",
              borderRadius: 10,
              border: "none",
              background: R.primary,
              color: "#fff",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Yes, I applied
          </button>
        </div>
      </div>
    </div>
  );
}

