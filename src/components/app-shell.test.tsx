import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

describe("AppShell", () => {
  it("preserves navigation anchors and exposes an active icon-based mobile nav", async () => {
    window.history.replaceState(null, "", "/");

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
    expect(shell).toHaveClass("pb-[calc(4.75rem+env(safe-area-inset-bottom))]");

    const header = screen.getByRole("link", { name: /MillionMoa/ }).closest("header")!;
    expect(header.firstElementChild).toHaveClass("h-16");
    expect(screen.getByTestId("brand-mark")).toHaveClass(
      "rounded-2xl",
      "bg-[var(--wallet-primary)]",
      "text-white",
    );
    expect(screen.getByRole("button", { name: "알림" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내 정보" })).toBeInTheDocument();

    const main = screen.getByRole("main");
    expect(main).not.toHaveClass("max-w-6xl", "px-4", "sm:px-6", "lg:px-8");

    expect(screen.queryByRole("navigation", { name: "주요 메뉴" })).not.toBeInTheDocument();

    const mobileNav = screen.getByRole("navigation", { name: "모바일 주요 메뉴" });
    expect(mobileNav).toHaveClass(
      "inset-x-0",
      "bottom-0",
      "pb-[env(safe-area-inset-bottom)]",
    );
    const expectedItems = [
      ["홈", "/"],
      ["입력", "#planner-cash-flow"],
      ["계산", "#finance-calculators"],
      ["상품", "#finance-products"],
      ["그래프", "#finance-loans"],
    ] as const;

    expect(new Set(expectedItems.map(([, href]) => href)).size).toBe(5);

    for (const [label, href] of expectedItems) {
      const link = within(mobileNav).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      expect(link.querySelector("svg")).toBeInTheDocument();
    }

    expect(within(mobileNav).getByRole("link", { name: "홈" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(mobileNav).getByRole("link", { name: "홈" })).toHaveClass(
      "text-[var(--wallet-primary)]",
    );

    act(() => {
      window.history.replaceState(null, "", "#dashboard-overview-title");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(within(mobileNav).getByRole("link", { name: "홈" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.replaceState(null, "", "#finance-calculators");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(await screen.findByRole("region", { name: "내 월급 실수령액" })).toBeVisible();
    expect(within(mobileNav).getByRole("link", { name: "홈" })).not.toHaveAttribute("aria-current");
    expect(within(mobileNav).getByRole("link", { name: "계산" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.replaceState(null, "", "#finance-accounts");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(await screen.findByRole("region", { name: "자산 및 대출 편집" })).toBeVisible();
    expect(within(mobileNav).getByRole("link", { name: "계산" })).not.toHaveAttribute("aria-current");
    expect(within(mobileNav).getByRole("link", { name: "입력" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.replaceState(null, "", "#finance-loans-input");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(await screen.findByRole("button", { name: "대출 추가" })).toBeVisible();
    expect(within(mobileNav).getByRole("link", { name: "입력" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.replaceState(null, "", "#finance-loans");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(await screen.findByRole("img", { name: "향후 10년 순자산과 부채 반영 순자산 추이" })).toBeVisible();
    expect(within(mobileNav).getByRole("link", { name: "입력" })).not.toHaveAttribute("aria-current");
    expect(within(mobileNav).getByRole("link", { name: "그래프" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
