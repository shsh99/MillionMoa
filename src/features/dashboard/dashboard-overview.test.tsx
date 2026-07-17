import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardOverview, formatExpectedMonth, initialFinanceScenario } from "./dashboard-overview";
import { getFinanceScenarioStorageKey } from "./finance-scenario-storage";

const ownerStorageKey = getFinanceScenarioStorageKey("local-demo-profile");

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

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

  it("provides visible destinations for wallet navigation", () => {
    render(<DashboardOverview />);

    for (const id of ["planner-cash-flow", "finance-calculators", "finance-accounts", "finance-loans"]) {
      expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
      expect(document.getElementById(id)).toBeVisible();
    }
  });

  it("adds quick amounts cumulatively and updates the summary", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    await user.click(screen.getByRole("button", { name: "월 수입에 500만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 수입에 500만원 더하기" }));

    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("1,320");
    expect(screen.getByTestId("overview-monthly-surplus")).toHaveTextContent("10,914,465원");
  });

  it("hydrates from the saved owner scenario without showing a fallback notice", async () => {
    localStorage.setItem(ownerStorageKey, JSON.stringify({
      version: 1,
      scenario: { ...initialFinanceScenario, monthlyIncome: 4_500_000 },
    }));
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("450"));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("saves updates as a version 1 envelope under the owner-scoped key", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "월 수입" })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: "월 수입에 500만원 더하기" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(ownerStorageKey) ?? "null");
      expect(saved.version).toBe(1);
      expect(saved.scenario.monthlyIncome).toBe(8_200_000);
    });
  });

  it("recovers from malformed saved data and reports a concise notice", async () => {
    localStorage.setItem(ownerStorageKey, "not-json");

    render(<DashboardOverview />);

    expect(await screen.findByRole("status")).toHaveTextContent("저장된 계획을 불러오지 못해 기본값을 사용합니다.");
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("320");
  });

  it("recovers when local storage access fails", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("denied", "SecurityError"); });

    render(<DashboardOverview />);

    expect(await screen.findByRole("status")).toHaveTextContent("저장된 계획을 불러오지 못해 기본값을 사용합니다.");
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("320");
  });

  it("keeps edits and reports a recoverable notice when saving fails", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "월 수입" })).toBeEnabled());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });

    await user.click(screen.getByRole("button", { name: "월 수입에 500만원 더하기" }));

    expect(await screen.findByRole("status")).toHaveTextContent("변경 내용은 유지되지만 이 기기에 저장하지 못했습니다.");
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("820");
  });

  it("supports multiple loans and negative net worth", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    const accountEditor = screen.getByRole("region", { name: "자산 및 대출 편집" });
    await user.click(within(accountEditor).getByRole("tab", { name: "대출" }));
    await user.click(within(accountEditor).getByRole("button", { name: "대출 추가" }));
    const principal = screen.getByRole("textbox", { name: "대출 원금" });
    await user.clear(principal);
    await user.type(principal, "2000");

    expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("-13,000,000원");
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });
});
