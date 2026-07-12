import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { label: "대시보드", href: "/" },
  { label: "월급 설계", href: "/dashboard" },
  { label: "목표 시뮬레이터", href: "/dashboard" },
  { label: "절세 플래너", href: "/dashboard" },
  { label: "가계부", href: "/dashboard" },
  { label: "리포트", href: "/dashboard" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f4f7f2] text-[#17201a]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#17201a] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#fffdf8]"
      >
        본문으로 건너뛰기
      </a>

      <header className="sticky top-0 z-40 border-b border-[#dce5da] bg-[#fbfdf8]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-[#17201a]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#17201a] text-sm font-bold text-[#fffdf8]">
                M
              </span>
              MillionMoa
            </Link>
            <span className="rounded-md bg-[#fff1b8] px-2.5 py-1 text-xs font-semibold text-[#725b12] lg:hidden">
              1억 설계
            </span>
          </div>
          <nav aria-label="주요 메뉴" className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-[#536057] hover:bg-[#e7efe5] hover:text-[#17201a]"
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
