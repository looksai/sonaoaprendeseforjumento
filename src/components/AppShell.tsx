import { ReactNode } from "react";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
  /** Screen intent. Focus screens keep content calm and highly readable. */
  screen?: "focus" | "browse";
  className?: string;
  /** Wider layout for desktop-heavy screens like Community. */
  wide?: boolean;
}

export function AppShell({
  children,
  hideNav,
  screen = "browse",
  className = "",
  wide = false,
}: AppShellProps) {
  return (
    <div
      data-screen={screen}
      className={`app-shell ${wide ? "app-shell--wide" : ""}`.trim()}
    >
      <main
        className={`app-main ${hideNav ? "app-main--no-nav" : "app-main--with-nav"} ${className}`.trim()}
      >
        {children}
      </main>
      {!hideNav && <MobileNav />}
    </div>
  );
}
