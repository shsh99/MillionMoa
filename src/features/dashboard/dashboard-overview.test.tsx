import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview", () => {
  it("shows the MillionMoa planning metrics", () => {
    render(<DashboardOverview />);

    expect(screen.getByRole("heading", { name: "월급으로 1억까지" })).toBeInTheDocument();
    expect(screen.getByText("현재 자산")).toBeInTheDocument();
    expect(screen.getByText("예상 달성일")).toBeInTheDocument();
    expect(screen.getByText("이번 달 생활비")).toBeInTheDocument();
    expect(screen.getByText("최단경로 단축")).toBeInTheDocument();
  });
});
