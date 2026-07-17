import { act, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  it("preserves navigation anchors and exposes an active icon-based mobile nav", () => {
    render(
      <AppShell>
        <p>대시보드 내용</p>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: "본문으로 건너뛰기" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");

    const shell = screen.getByRole("main").parentElement;
    expect(shell).toHaveClass("pb-[calc(4rem+env(safe-area-inset-bottom))]");

    const header = screen.getByRole("banner");
    expect(header.firstElementChild).toHaveClass("h-[60px]");

    const main = screen.getByRole("main");
    expect(main).not.toHaveClass("max-w-6xl", "px-4", "sm:px-6", "lg:px-8");

    const desktopNav = screen.getByRole("navigation", { name: "주요 메뉴" });
    expect(within(desktopNav).getByRole("link", { name: "대시보드" })).toHaveAttribute("href", "/");
    expect(within(desktopNav).getByRole("link", { name: "월급 배분" })).toHaveAttribute(
      "href",
      "#allocation-title",
    );
    expect(within(desktopNav).getByRole("link", { name: "계산기" })).toHaveAttribute(
      "href",
      "#goal-quick-planner-title",
    );

    const mobileNav = screen.getByRole("navigation", { name: "모바일 주요 메뉴" });
    expect(mobileNav).toHaveClass("pb-[env(safe-area-inset-bottom)]");
    const expectedItems = [
      ["홈", "/"],
      ["계산", "#goal-quick-planner-title"],
      ["계좌", "#allocation-title"],
      ["대출", "#loan-impact-title"],
    ] as const;

    for (const [label, href] of expectedItems) {
      const link = within(mobileNav).getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      expect(link.querySelector("svg")).toBeInTheDocument();
    }

    expect(within(mobileNav).getByRole("link", { name: "홈" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    act(() => {
      window.history.replaceState(null, "", "#allocation-title");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(within(mobileNav).getByRole("link", { name: "홈" })).not.toHaveAttribute("aria-current");
    expect(within(mobileNav).getByRole("link", { name: "계좌" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
