import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "대시보드", href: "/" },
  { label: "월급 배분", href: "#allocation-title" },
  { label: "계산기", href: "#goal-quick-planner-title" },
];

const bottomNavItems = [
  { label: "홈", href: "/" },
  { label: "계산", href: "#goal-quick-planner-title" },
  { label: "계좌", href: "#allocation-title" },
  { label: "대출", href: "#loan-impact-title" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f8fb] pb-20 text-[#111827] md:pb-0">
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
          <nav aria-label="주요 메뉴" className="hidden gap-1 overflow-x-auto pb-1 md:flex lg:pb-0">
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

      <nav
        aria-label="모바일 주요 메뉴"
        className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-4 rounded-lg border border-[#dbe3ef] bg-white/95 p-2 shadow-[0_18px_48px_rgba(31,41,55,0.20)] backdrop-blur md:hidden"
      >
        {bottomNavItems.map((item) => (
          <Link
            className="flex min-h-12 flex-col items-center justify-center rounded-lg text-xs font-black text-[#6b7280] transition hover:bg-[#eef6ff] hover:text-[#2563eb] active:scale-[0.98]"
            href={item.href}
            key={item.label}
          >
            <span className="mb-1 h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
