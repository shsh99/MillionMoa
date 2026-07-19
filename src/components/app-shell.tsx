"use client";

import Link from "next/link";
import { Calculator, ChartNoAxesCombined, Home, WalletCards } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

const navItems = [
  { label: "대시보드", href: "/" },
  { label: "월급 배분", href: "#planner-cash-flow" },
  { label: "계산기", href: "#finance-calculators" },
];

const bottomNavItems = [
  { label: "홈", href: "/", icon: Home, hashes: [""] },
  { label: "입력", href: "#planner-cash-flow", icon: WalletCards, hashes: ["#planner-cash-flow", "#expense-management", "#finance-accounts"] },
  { label: "계산", href: "#finance-calculators", icon: Calculator, hashes: ["#finance-calculators"] },
  { label: "그래프", href: "#finance-loans", icon: ChartNoAxesCombined, hashes: ["#finance-loans"] },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash);

    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[var(--wallet-page)] pb-[calc(4rem+env(safe-area-inset-bottom))] text-[var(--wallet-ink)] md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#111827] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        본문으로 건너뛰기
      </a>

      <header className="sticky top-0 z-40 border-b border-[var(--wallet-line)] bg-[var(--wallet-surface-tint)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2 text-sm font-black text-[var(--wallet-ink)]">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--wallet-primary-soft)] text-xs font-black text-[var(--wallet-primary-strong)]"
                data-testid="brand-mark"
              >
                M
              </span>
              MillionMoa
            </Link>
          </div>
          <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-bold text-[var(--wallet-muted)] transition-colors hover:bg-[var(--wallet-primary-soft)] hover:text-[var(--wallet-primary-strong)]"
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
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--wallet-line)] bg-[var(--wallet-surface)]/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[var(--wallet-shadow)] backdrop-blur-xl md:hidden"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isCurrent = item.hashes.includes(activeHash);

          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={`flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-md text-[11px] font-bold transition-colors active:bg-[var(--wallet-primary-soft)] ${isCurrent ? "text-[var(--wallet-primary-strong)]" : "text-[var(--wallet-muted)] hover:text-[var(--wallet-ink)]"}`}
              href={item.href}
              key={item.label}
            >
              <Icon aria-hidden="true" size={21} strokeWidth={isCurrent ? 2.4 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
