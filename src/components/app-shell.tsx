"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/cn";

type AppRole = "student" | "tutor";

interface AppShellProps {
  role: AppRole;
  userName: string;
  userInitials: string;
  children: ReactNode;
  demoMode?: boolean;
  demoDesktopControl?: ReactNode;
  demoMobileControl?: ReactNode;
}

interface NavigationItem {
  href: Route;
  label: string;
  symbol: string;
}

const navigation: Record<AppRole, NavigationItem[]> = {
  student: [
    { href: "/student/today", label: "Today", symbol: "○" },
    { href: "/student/mistake-map", label: "Mistake Map", symbol: "⌁" },
    { href: "/student/progress", label: "Progress", symbol: "↗" },
    { href: "/student/weekly-report", label: "Weekly", symbol: "▤" },
  ],
  tutor: [
    { href: "/tutor/dashboard", label: "Dashboard", symbol: "◇" },
    { href: "/tutor/students", label: "Students", symbol: "◎" },
    { href: "/tutor/content", label: "Content", symbol: "▱" },
  ],
};

function NavigationLinks({
  role,
  mobile = false,
}: {
  role: AppRole;
  mobile?: boolean;
}) {
  const pathname = usePathname();

  return navigation[role].map((item) => {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group flex items-center rounded-2xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral",
          mobile
            ? "min-h-14 flex-1 flex-col justify-center gap-0.5 px-1 text-[0.65rem]"
            : "min-h-12 gap-3 px-4 text-sm",
          active
            ? "bg-violet text-white"
            : "text-ink-muted hover:bg-ink/5 hover:text-ink",
        )}
      >
        <span
          className={cn(
            "grid place-items-center font-editorial text-xl",
            mobile ? "h-6" : "size-7",
          )}
          aria-hidden="true"
        >
          {item.symbol}
        </span>
        <span>{item.label}</span>
      </Link>
    );
  });
}

export function AppShell({
  role,
  userName,
  userInitials,
  children,
  demoMode = true,
  demoDesktopControl,
  demoMobileControl,
}: AppShellProps) {
  const pathname = usePathname();
  const practiceMode = pathname.startsWith("/student/practice/");
  const otherRoleHref: Route =
    role === "student" ? "/tutor/dashboard" : "/student/today";

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <a
        href="#main-content"
        className="fixed top-3 left-3 z-50 -translate-y-24 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      {!practiceMode ? (
        <aside className="app-shell-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-ink/10 bg-white px-5 py-6 lg:flex">
          <div className="px-2">
            <BrandMark
              href={role === "student" ? "/student/today" : "/tutor/dashboard"}
            />
            <p className="mt-2 pl-12 text-[0.65rem] font-bold tracking-[0.12em] text-ink-muted uppercase">
              {role === "student" ? "Correction Sprint" : "Tutor Workspace"}
            </p>
          </div>

          <nav
            className="mt-10 flex flex-col gap-2"
            aria-label={`${role} navigation`}
          >
            <NavigationLinks role={role} />
          </nav>

          <div className="mt-auto">
            {demoDesktopControl ? (
              <div className="mb-3">{demoDesktopControl}</div>
            ) : null}
            {demoMode ? (
              <Link
                href={otherRoleHref}
                className="mb-4 flex min-h-12 items-center justify-between rounded-2xl border border-violet/15 bg-violet-soft px-4 text-sm font-semibold text-violet-deep transition-colors hover:bg-violet/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
              >
                <span>
                  Switch to {role === "student" ? "Tutor" : "Student"}
                </span>
                <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
            <div className="flex items-center gap-3 border-t border-ink/10 pt-5">
              <span className="grid size-10 place-items-center rounded-full bg-mint font-bold text-mint-deep">
                {userInitials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{userName}</p>
                <p className="text-xs text-ink-muted capitalize">{role} demo</p>
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      <div className={practiceMode ? "" : "lg:pl-72"}>
        <header className="app-shell-header sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-ink/10 bg-cream/90 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
          {practiceMode ? (
            <Link
              href="/student/today"
              className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-bold text-ink-muted transition hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet"
            >
              <span aria-hidden="true">←</span> Today
            </Link>
          ) : (
            <>
              <div className="lg:hidden">
                <BrandMark compact />
              </div>
              <p className="hidden text-xs font-bold tracking-[0.15em] text-ink-muted uppercase lg:block">
                {role === "student"
                  ? "Ten focused minutes. One repeating mistake."
                  : "See the pattern before the lesson."}
              </p>
            </>
          )}
          <div className="flex items-center gap-2">
            {demoMode ? <Badge tone="violet">Demo Mode</Badge> : null}
            {!practiceMode && demoMobileControl ? demoMobileControl : null}
            {demoMode && !practiceMode ? (
              <Link
                href={otherRoleHref}
                className="grid size-9 place-items-center rounded-full border border-ink/10 bg-white text-sm font-bold text-ink transition-colors hover:bg-violet-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet lg:hidden"
                aria-label={`Switch to ${role === "student" ? "Tutor" : "Student"} demo`}
              >
                ⇄
              </Link>
            ) : null}
          </div>
        </header>

        <main
          id="main-content"
          className={cn(
            "mx-auto min-h-[calc(100dvh-4rem)] w-full px-4 pt-7 sm:px-6 sm:pt-10 lg:px-10 lg:pb-12",
            practiceMode ? "max-w-6xl pb-10" : "max-w-[92rem] pb-28",
          )}
        >
          {children}
          {!practiceMode ? (
            <footer className="no-print mt-14 border-t border-ink/10 pt-6 text-xs leading-5 text-ink-muted">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <p className="max-w-2xl">
                  TraceTutor is independent practice software, not endorsed by
                  ETS. Practice feedback is not an official TOEFL score.
                </p>
                <nav
                  className="flex flex-wrap gap-x-4 gap-y-2"
                  aria-label="Product policies"
                >
                  <Link href="/trust" className="font-semibold hover:text-ink">
                    Trust
                  </Link>
                  <Link
                    href="/privacy"
                    className="font-semibold hover:text-ink"
                  >
                    Privacy
                  </Link>
                  <Link
                    href="/content-standards"
                    className="font-semibold hover:text-ink"
                  >
                    Content standards
                  </Link>
                  <Link href="/method" className="font-semibold hover:text-ink">
                    Method
                  </Link>
                </nav>
              </div>
            </footer>
          ) : null}
        </main>
      </div>

      {!practiceMode ? (
        <nav
          className="app-shell-mobile-nav fixed inset-x-0 bottom-0 z-40 flex border-t border-ink/10 bg-white/95 px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(36,31,28,0.08)] backdrop-blur-xl lg:hidden"
          aria-label={`${role} mobile navigation`}
        >
          <NavigationLinks role={role} mobile />
        </nav>
      ) : null}
    </div>
  );
}
