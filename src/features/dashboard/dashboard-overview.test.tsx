import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview", () => {
  it("shows the bank-style planning dashboard and action feed", () => {
    render(<DashboardOverview />);

    expect(screen.getByRole("heading", { name: "1억까지 남은 돈" })).toBeInTheDocument();
    expect(screen.getByText("90,000,000원")).toBeInTheDocument();
    expect(screen.getByText("샘플 데이터")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "1억 목표 달성률" })).toHaveAttribute(
      "aria-valuenow",
      "10",
    );
    expect(screen.getByRole("heading", { name: "1억 달성 계산기" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "현재 자산" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "매달 가능액" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "예상 기간" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "월급 배분" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "다음에 할 일" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "절세 체크" })).toBeInTheDocument();
    expect(screen.getByText("월말 남은 돈 스윕")).toBeInTheDocument();
    expect(screen.getByText(/실제 결과는 홈택스 자료로 확인해야 합니다/)).toBeInTheDocument();
  });
});
