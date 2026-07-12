import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview", () => {
  it("shows the bank-style planning dashboard and action feed", () => {
    render(<DashboardOverview />);

    expect(screen.getByRole("heading", { name: "월급으로 1억까지" })).toBeInTheDocument();
    expect(screen.getByText("1억까지 남은 금액")).toBeInTheDocument();
    expect(screen.getByText("현재 자산")).toBeInTheDocument();
    expect(screen.getByText("예상 달성일")).toBeInTheDocument();
    expect(screen.getByText("이번 달 생활비")).toBeInTheDocument();
    expect(screen.getByText("최단경로 단축")).toBeInTheDocument();
    expect(screen.getByText("세액공제 예상 환급")).toBeInTheDocument();
    expect(screen.getByText("이번 달 추천 액션")).toBeInTheDocument();
    expect(screen.getByText("생활비 통장 상태")).toBeInTheDocument();
    expect(screen.getByText("ISA/IRP/적금/배당 재투자 후보")).toBeInTheDocument();
  });
});
