import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview", () => {
  it("shows the bank-style planning dashboard and usable planner surface", () => {
    render(<DashboardOverview />);

    expect(screen.getByRole("heading", { name: "1억 플랜 계좌" })).toBeInTheDocument();
    expect(screen.getAllByText("10,000,000원").length).toBeGreaterThan(0);
    expect(screen.getByText("샘플 데이터")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "1억 목표 달성률" })).toHaveAttribute(
      "aria-valuenow",
      "10",
    );
    expect(screen.getByRole("heading", { name: "1억 플랜 조정" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "한 달 돈 흐름" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "자산 구성" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "대출 영향" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "계산 범위" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "순자산" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "예금·현금 수정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "부채 항목 추가" })).toBeInTheDocument();
    expect(screen.getByText("월 저축 가능액", { selector: "span" })).toBeInTheDocument();
    expect(screen.getAllByText("대출 상환").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "대출 영향" })).toBeInTheDocument();
    expect(screen.getByText(/실제 결과는 홈택스 자료로 확인해야 합니다/)).toBeInTheDocument();
  });

  it("updates the account overview when planner categories change", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    await user.click(screen.getByRole("button", { name: "예금·현금 수정" }));
    const assetInput = screen.getByRole("textbox", { name: "예금·현금 금액" });
    await user.clear(assetInput);
    await user.type(assetInput, "1500");

    expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("15,000,000원");

    await user.click(screen.getByRole("tab", { name: "월 현금흐름" }));
    await user.click(screen.getByRole("button", { name: "생활비 수정" }));
    const expenseInput = screen.getByRole("textbox", { name: "생활비 금액" });
    await user.clear(expenseInput);
    await user.type(expenseInput, "100");

    expect(screen.getByTestId("overview-monthly-surplus")).toHaveTextContent("850,000원");
  });

  it("updates the overview timeline and exposes a loan-driven deficit", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);
    const initialTimeline = screen.getByTestId("overview-goal-months").textContent;

    await user.click(screen.getByRole("tab", { name: "대출" }));
    const principal = screen.getByRole("textbox", { name: "대출 원금" });
    await user.clear(principal);
    await user.type(principal, "10000");

    expect(screen.getByTestId("overview-goal-months")).not.toHaveTextContent(initialTimeline ?? "");
    expect(screen.getByText("대출 상환 후").nextElementSibling).toHaveTextContent("-");
  });
});
