import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { name: "계좌별 배분" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "대출 영향" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "입력 완성도" })).toBeInTheDocument();
    expect(screen.getByLabelText("현재 순자산")).toHaveValue("1,000");
    expect(screen.getByLabelText("월 저축/투자 가능액")).toHaveValue("100");
    expect(screen.getAllByRole("button", { name: "+50만원" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("대출 상환").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "대출 영향" })).toBeInTheDocument();
    expect(screen.getByText(/실제 결과는 홈택스 자료로 확인해야 합니다/)).toBeInTheDocument();
  });
});
