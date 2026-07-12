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
    <div className="min-h-screen bg-[#f7f5ef] text-[#17201a]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#17201a] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[#fffdf8]"
      >
        본문으로 건너뛰기
      </a>

      <header className="border-b border-[#ded8cb] bg-[#f7f5ef]/95">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <Link href="/" className="text-lg font-semibold text-[#17201a]">
            MillionMoa
          </Link>
          <nav aria-label="주요 메뉴" className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-[#536057] hover:bg-[#ebe6da] hover:text-[#17201a]"
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
