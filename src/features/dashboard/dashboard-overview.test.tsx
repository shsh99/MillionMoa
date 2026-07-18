import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { StrictMode } from "react";
import { DashboardOverview, formatExpectedMonth, formatKoreanReferenceDate, initialFinanceScenario } from "./dashboard-overview";
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

  it("uses the Korean calendar date around a UTC month boundary", () => {
    expect(formatKoreanReferenceDate(new Date("2026-01-31T15:30:00.000Z"))).toBe("2026-02-01");
  });
});

describe("DashboardOverview", () => {
  it("renders a stable non-editable loading state before persistence hydration", () => {
    const html = renderToString(<DashboardOverview />);

    expect(html).toContain("계획 불러오는 중");
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain('name="monthly-income"');
    expect(html).not.toContain('aria-label="자산 및 대출 편집"');
  });

  it("shows one coherent multi-account scenario with visual evidence", () => {
    render(<DashboardOverview referenceDate={new Date(Date.UTC(2026, 0, 1))} />);

    expect(screen.getByRole("heading", { name: "1억을 향한 자산 지도" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "사회초년생 시작 체크" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이번 달 시작 체크" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "대시보드 카테고리" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /실수령액 확인/ })).toHaveAttribute("href", "#finance-calculators");
    expect(screen.getByRole("link", { name: /고정비 점검/ })).toHaveAttribute("href", "#expense-management");
    expect(screen.getByRole("link", { name: /상품/ })).toHaveAttribute("href", "#finance-products");
    expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("7,000,000원");
    expect(screen.getByRole("region", { name: "자산 및 대출 편집" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "향후 10년 순자산과 부채 반영 순자산 추이" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "대출별 상환 현황" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "지출 관리" })).toBeInTheDocument();
  });

  it("prioritizes expense action when a beginner plan starts in monthly deficit", async () => {
    localStorage.setItem(ownerStorageKey, JSON.stringify({
      version: 2,
      scenario: {
        ...initialFinanceScenario,
        monthlyIncome: 1_800_000,
      },
    }));

    render(<DashboardOverview referenceDate={new Date(Date.UTC(2026, 0, 1))} />);

    await waitFor(() => expect(screen.getByText("적자 위험")).toBeInTheDocument());
    expect(screen.getByText(/이번 달 .*부족/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /지출 줄이기/ })).toHaveAttribute("href", "#expense-management");
  });

  it("uses categorized expenses as the single cash-flow source", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByRole("region", { name: "지출 관리" })).toBeVisible());
    expect(screen.queryByRole("textbox", { name: "월 생활 지출" })).not.toBeInTheDocument();
    expect(screen.getByTestId("overview-monthly-expense")).toHaveTextContent("2,200,000원");

    await user.click(screen.getByRole("tab", { name: /생활비/ }));
    await user.click(screen.getByRole("button", { name: "식비 선택" }));
    await user.click(screen.getByRole("button", { name: "금액에 10만원 더하기" }));

    expect(screen.getByTestId("overview-monthly-expense")).toHaveTextContent("2,300,000원");
    expect(screen.getByTestId("overview-monthly-surplus")).toHaveTextContent("814,465원");
  });

  it("excludes future expenses from the current dashboard month", async () => {
    localStorage.setItem(ownerStorageKey, JSON.stringify({
      version: 2,
      scenario: {
        ...initialFinanceScenario,
        expenses: [{ ...initialFinanceScenario.expenses[0], startDate: "2026-02-01" }],
        monthlyNonLoanExpense: 700_000,
      },
    }));

    render(<DashboardOverview referenceDate={new Date(Date.UTC(2026, 0, 1))} />);

    await waitFor(() => expect(screen.getByTestId("overview-monthly-expense")).toHaveTextContent(/^0원$/));
  });

  it("restores an edited expense item after remounting", async () => {
    const user = userEvent.setup();
    const view = render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByRole("region", { name: "지출 관리" })).toBeVisible());

    await user.click(screen.getByRole("tab", { name: /생활비/ }));
    await user.click(screen.getByRole("button", { name: "식비 선택" }));
    await user.click(screen.getByRole("button", { name: "금액에 10만원 더하기" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(ownerStorageKey) ?? "null")?.version).toBe(2));

    view.unmount();
    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByTestId("overview-monthly-expense")).toHaveTextContent("2,300,000원"));
  });

  it("persists the first user edit under Strict Mode", async () => {
    const user = userEvent.setup();
    localStorage.setItem(ownerStorageKey, JSON.stringify({
      version: 2,
      scenario: { ...initialFinanceScenario, monthlyIncome: 3_300_000 },
    }));
    render(<StrictMode><DashboardOverview /></StrictMode>);
    await waitFor(() => expect(screen.getByRole("region", { name: "지출 관리" })).toBeVisible());

    await user.click(screen.getByRole("tab", { name: /생활비/ }));
    await user.click(screen.getByRole("button", { name: "식비 선택" }));
    await user.click(screen.getByRole("button", { name: "금액에 10만원 더하기" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(ownerStorageKey) ?? "null");
      expect(saved.scenario.expenses.find((item: { id: string }) => item.id === "food").amount).toBe(800_000);
    });
  });

  it("provides visible destinations for wallet navigation", () => {
    render(<DashboardOverview />);

    for (const id of ["planner-cash-flow", "finance-calculators", "finance-products", "finance-accounts", "finance-loans"]) {
      expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
      expect(document.getElementById(id)).toBeVisible();
    }
  });

  it("adds quick amounts cumulatively and updates the summary", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 수입에서 50만원 빼기" }));

    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("470");
    expect(screen.getByTestId("overview-monthly-surplus")).toHaveTextContent("2,414,465원");
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

  it("saves updates as a version 2 envelope under the owner-scoped key", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "월 수입" })).toBeEnabled());

    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(ownerStorageKey) ?? "null");
      expect(saved.version).toBe(2);
      expect(saved.scenario.monthlyIncome).toBe(4_200_000);
      expect(saved.scenario.expenses.length).toBeGreaterThan(0);
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

    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));

    expect(await screen.findByRole("status")).toHaveTextContent("변경 내용은 유지되지만 이 기기에 저장하지 못했습니다.");
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("420");
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
