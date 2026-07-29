"use client";

import Link from "next/link";
import { Bell, Calculator, ChartNoAxesCombined, CircleUserRound, Home, Menu, Sparkles, WalletCards } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

const bottomNavItems = [
  { label: "홈", href: "/", icon: Home, hashes: ["", "#dashboard-overview-title"] },
  { label: "입력", href: "#planner-cash-flow", icon: WalletCards, hashes: ["#planner-cash-flow", "#expense-management", "#finance-accounts", "#finance-assets", "#finance-loans-input"] },
  { label: "계산", href: "#finance-calculators", icon: Calculator, hashes: ["#finance-calculators"] },
  { label: "상품", href: "#finance-products", icon: Sparkles, hashes: ["#finance-products"] },
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
    <div className="min-h-[100dvh] bg-[var(--wallet-page)] pb-[calc(5.75rem+env(safe-area-inset-bottom))] text-[var(--wallet-ink)] md:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[#111827] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        본문으로 건너뛰기
      </a>

      <header className="sticky top-0 z-40 border-b border-white/70 bg-[#fbfcff]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-[3.75rem] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2.5 text-[15px] font-black text-[var(--wallet-ink)]">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[16px] bg-[linear-gradient(145deg,#1463ff,#0050d8)] text-base font-black text-white shadow-[0_10px_22px_rgba(0,100,255,0.24)]"
                data-testid="brand-mark"
              >
                M
              </span>
              <span className="leading-none">
                <span className="block">MillionMoa</span>
                <span className="mt-1 hidden text-[11px] font-bold text-[var(--wallet-muted)] sm:block">첫 월급 머니 홈</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1.5">
            <button aria-label="알림" className="grid size-10 place-items-center rounded-full text-[var(--wallet-muted)] transition-colors hover:bg-[var(--wallet-surface-tint)] hover:text-[var(--wallet-ink)]" type="button">
              <Bell aria-hidden="true" size={20} strokeWidth={1.9} />
            </button>
            <button aria-label="내 정보" className="grid size-10 place-items-center rounded-full bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary-strong)] transition-colors hover:bg-[var(--wallet-primary-subtle)]" type="button">
              <CircleUserRound aria-hidden="true" size={21} strokeWidth={2} />
            </button>
            <button aria-label="전체 메뉴" className="grid size-10 place-items-center rounded-full text-[var(--wallet-muted)] transition-colors hover:bg-[var(--wallet-surface-tint)] hover:text-[var(--wallet-ink)]" type="button">
              <Menu aria-hidden="true" size={21} strokeWidth={1.9} />
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <nav
        aria-label="모바일 주요 메뉴"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[28px] border border-white/80 bg-white/94 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_18px_48px_rgba(26,34,56,0.18)] backdrop-blur-xl md:hidden"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isCurrent = item.hashes.includes(activeHash);

          return (
            <Link
              aria-current={isCurrent ? "page" : undefined}
              className={`my-1 flex min-h-14 touch-manipulation flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-black transition-[background-color,color,transform] active:scale-[0.98] ${isCurrent ? "bg-[var(--wallet-primary-soft)] text-[var(--wallet-primary)]" : "text-[var(--wallet-muted)] hover:text-[var(--wallet-ink)]"}`}
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
