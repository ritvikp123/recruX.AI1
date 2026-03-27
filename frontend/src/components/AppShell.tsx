import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { R } from "../recrux/theme";

export function AppShell({ children }: { children: ReactNode }) {
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
    </div>
  );
}
