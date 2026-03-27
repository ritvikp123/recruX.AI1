import type { ReactNode } from "react";

/** Optional sidebar shell for future layouts */
export function Sidebar({ children }: { children?: ReactNode }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-js-brand-border bg-js-brand-nav lg:block">
      <nav className="p-3 text-sm text-js-brand-deep">{children}</nav>
    </aside>
  );
}
