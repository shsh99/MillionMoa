import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview", () => {
  it("shows the bank-style planning dashboard and action feed", () => {
    render(<DashboardOverview />);

    expect(screen.getByRole("heading", { name: "월급으로 1억까지" })).toBeInTheDocument();
    expect(screen.getByText("1억까지 남은 금액")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1억 달성 계산기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1억 달성 시점 계산" })).toBeInTheDocument();
    expect(screen.getByText("현재 자산")).toBeInTheDocument();
    expect(screen.getByText("예상 달성일")).toBeInTheDocument();
    expect(screen.getByText("이번 달 생활비")).toBeInTheDocument();
    expect(screen.getByText("최단경로 단축")).toBeInTheDocument();
    expect(screen.getByText("연말정산 추정 영향")).toBeInTheDocument();
    expect(screen.getByText("이번 달 시뮬레이션 후보")).toBeInTheDocument();
    expect(screen.getByText("생활비 통장 상태")).toBeInTheDocument();
    expect(screen.getByText("ISA/IRP/적금/배당 비교 시나리오")).toBeInTheDocument();
    expect(screen.getByText(/실제 결과는 홈택스에서 확인해야 합니다/)).toBeInTheDocument();
  });
});
