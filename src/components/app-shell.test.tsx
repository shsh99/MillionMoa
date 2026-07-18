import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

describe("AppShell", () => {
  it("preserves navigation anchors and exposes an active icon-based mobile nav", () => {
    render(
      <AppShell>
        <DashboardOverview />
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "본문으로 건너뛰기" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");

    const shell = screen.getByRole("main").parentElement;
    expect(shell).toHaveClass("pb-[calc(4rem+env(safe-area-inset-bottom))]");

    const header = screen.getByRole("link", { name: /MillionMoa/ }).closest("header")!;
    expect(header.firstElementChild).toHaveClass("h-[60px]");
    expect(screen.getByTestId("brand-mark")).toHaveClass(
      "rounded-full",
      "bg-[var(--wallet-primary-soft)]",
      "text-[var(--wallet-primary-strong)]",
    );

    const main = screen.getByRole("main");
    expect(main).not.toHaveClass("max-w-6xl", "px-4", "sm:px-6", "lg:px-8");

    const desktopNav = screen.getByRole("navigation", { name: "주요 메뉴" });
    expect(within(desktopNav).getByRole("link", { name: "대시보드" })).toHaveAttribute("href", "/");
    expect(within(desktopNav).getByRole("link", { name: "월급 배분" })).toHaveAttribute(
      "href",
      "#planner-cash-flow",
    );
    expect(within(desktopNav).getByRole("link", { name: "계산기" })).toHaveAttribute(
      "href",
      "#finance-calculators",
    );

    const mobileNav = screen.getByRole("navigation", { name: "모바일 주요 메뉴" });
    expect(mobileNav).toHaveClass("pb-[env(safe-area-inset-bottom)]");
    const expectedItems = [
      ["홈", "/"],
      ["계산", "#finance-calculators"],
      ["계좌", "#finance-accounts"],
      ["대출", "#finance-loans"],
    ] as const;

    expect(new Set(expectedItems.map(([, href]) => href)).size).toBe(4);

    for (const [label, href] of expectedItems) {
      const link = within(mobileNav).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      expect(link.querySelector("svg")).toBeInTheDocument();
      if (href.startsWith("#")) expect(document.querySelector(href)).toBeVisible();
    }

    expect(within(mobileNav).getByRole("link", { name: "홈" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.replaceState(null, "", "#finance-accounts");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(within(mobileNav).getByRole("link", { name: "홈" })).not.toHaveAttribute("aria-current");
    expect(within(mobileNav).getByRole("link", { name: "계좌" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.replaceState(null, "", "#finance-loans");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(within(mobileNav).getByRole("link", { name: "계좌" })).not.toHaveAttribute("aria-current");
    expect(within(mobileNav).getByRole("link", { name: "대출" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
