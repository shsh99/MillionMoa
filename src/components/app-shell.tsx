import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "대시보드", href: "/" },
  { label: "월급 배분", href: "#allocation-title" },
  { label: "계산기", href: "#goal-quick-planner-title" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#111827]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#111827] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        본문으로 건너뛰기
      </a>

      <header className="sticky top-0 z-40 border-b border-[#e7ebf0] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[#111827]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563eb] text-sm font-bold text-white">
                M
              </span>
              MillionMoa
            </Link>
            <span className="rounded-md bg-[#eef4ff] px-3 py-1 text-xs font-bold text-[#2563eb] lg:hidden">
              목표 1억
            </span>
          </div>
          <nav aria-label="주요 메뉴" className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-[#687385] transition-colors hover:bg-[#f1f4f8] hover:text-[#111827]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="main-content">{children}</main>
    </div>
  );
}
