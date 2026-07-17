import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DashboardOverview, formatExpectedMonth } from "./dashboard-overview";

describe("formatExpectedMonth", () => {
  it("normalizes a month-end reference before adding months", () => {
    expect(formatExpectedMonth(1, new Date(Date.UTC(2026, 0, 31)))).toBe("2026년 2월");
    expect(formatExpectedMonth(null)).toBe("계획 조정 필요");
  });
});

describe("DashboardOverview", () => {
  it("shows one coherent multi-account scenario with visual evidence", () => {
    render(<DashboardOverview referenceDate={new Date(Date.UTC(2026, 0, 1))} />);

    expect(screen.getByRole("heading", { name: "1억을 향한 자산 지도" })).toBeInTheDocument();
    expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("7,000,000원");
    expect(screen.getByRole("region", { name: "자산 및 대출 편집" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "향후 10년 순자산과 부채 반영 순자산 추이" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "대출별 상환 현황" })).toBeInTheDocument();
  });

  it("adds quick amounts cumulatively and updates the summary", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    const quickInputs = screen.getByRole("group", { name: "월 수입 빠른 입력" });
    await user.click(quickInputs.querySelectorAll("button")[2]);
    await user.click(quickInputs.querySelectorAll("button")[2]);

    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("520");
    expect(screen.getByTestId("overview-monthly-surplus")).toHaveTextContent("2,914,465원");
  });

  it("supports multiple loans and negative net worth", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    const accountEditor = screen.getByRole("region", { name: "자산 및 대출 편집" });
    await user.click(within(accountEditor).getByRole("tab", { name: "대출" }));
    await user.click(within(accountEditor).getByRole("button", { name: "대출 추가" }));
    const principal = screen.getByRole("spinbutton", { name: "대출 원금" });
    await user.clear(principal);
    await user.type(principal, "2000");

    expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("-13,000,000원");
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });
});
