import { ReactNode } from "react";
import { IconSidebar } from "./components/IconSidebar";
import { BottomNav } from "./components/BottomNav";

interface Props {
  children: ReactNode;
}

export function Layout({ children }: Props) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F7F5] text-[#1A1A1A]">
      <IconSidebar />

      <div className="dashboard-main flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="flex items-center justify-between border-b bg-white px-6 py-4"
          style={{ borderColor: "#E8E8E6" }}
        >
          <span className="text-sm font-semibold tracking-tight" style={{ color: "#1A1A1A" }}>
            Recruix
          </span>
          <span className="text-xs" style={{ color: "#8A8A85" }}>Dashboard</span>
        </header>

        <main className="flex-1 min-w-0 overflow-y-auto pb-24 md:pb-8">
          <div className="mx-auto max-w-[1100px] px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
