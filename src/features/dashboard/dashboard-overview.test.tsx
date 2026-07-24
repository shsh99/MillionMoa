import { act, render, screen, waitFor, within } from "@testing-library/react";
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
  window.history.replaceState(null, "", "/");
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

    expect(html).toContain("대시보드 카테고리");
    expect(html).not.toContain('name="monthly-income"');
    expect(html).not.toContain('aria-label="자산 및 대출 편집"');
  });

  it("shows one coherent multi-account scenario with visual evidence", () => {
    render(<DashboardOverview referenceDate={new Date(Date.UTC(2026, 0, 1))} />);

    expect(screen.getByRole("heading", { name: "1억을 향한 자산 지도" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "사회초년생 시작 체크" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이번 달 할 일" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "대시보드 카테고리" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "월 수입 사용 비율" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "계좌와 대출" })).toBeInTheDocument();
    expect(screen.getByText("생활비 파킹통장")).toBeInTheDocument();
    expect(screen.getByText("학자금 대출")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /실수령액 확인/ })).toHaveAttribute("href", "#finance-calculators");
    expect(screen.getByRole("link", { name: /고정비 점검/ })).toHaveAttribute("href", "#expense-management");
    expect(screen.getByRole("link", { name: /상품/ })).toHaveAttribute("href", "#finance-products");
    expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("7,000,000원");
    expect(screen.getByRole("region", { name: "자산 요약" })).toHaveClass(
      "bg-[var(--wallet-surface)]",
      "text-[var(--wallet-ink)]",
    );
    expect(screen.getByRole("region", { name: "자산 요약" })).not.toHaveClass(
      "bg-[#4f46a5]",
      "text-white",
    );
    expect(within(screen.getByRole("navigation", { name: "대시보드 카테고리" })).getByRole("link", { name: /요약/ })).toHaveClass("bg-[var(--wallet-primary)]", "text-white");
    expect(screen.queryByRole("region", { name: "자산 및 대출 편집" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "향후 10년 순자산과 부채 반영 순자산 추이" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "지출 관리" })).not.toBeInTheDocument();
  });

  it("uses Korean banking copy and soft consumer-finance surfaces on the overview", () => {
    render(<DashboardOverview referenceDate={new Date(Date.UTC(2026, 0, 1))} />);

    expect(screen.getByRole("heading", { name: "이번 달 할 일" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "월급 흐름" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "계좌와 대출" })).toBeInTheDocument();
    expect(screen.queryByText("NEXT ACTION")).not.toBeInTheDocument();
    expect(screen.queryByText("MONEY FLOW")).not.toBeInTheDocument();
    expect(screen.queryByText("MY ACCOUNTS")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "자산 요약" })).toHaveClass("rounded-[34px]");
  });

  it("switches category panels from hash links instead of stacking every section", async () => {
    const user = userEvent.setup();
    render(<DashboardOverview />);

    const categoryNav = screen.getByRole("navigation", { name: "대시보드 카테고리" });
    expect(within(categoryNav).getByRole("link", { name: /요약/ })).toHaveAttribute("aria-current", "location");
    expect(screen.queryByRole("heading", { name: "청년 금융상품 비교" })).not.toBeInTheDocument();

    await user.click(within(categoryNav).getByRole("link", { name: /상품/ }));

    await waitFor(() => expect(within(categoryNav).getByRole("link", { name: /상품/ })).toHaveAttribute("aria-current", "location"));
    expect(screen.getByRole("heading", { name: "청년 금융상품 비교" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "자산 요약" })).not.toBeInTheDocument();
  });

  it("moves deep-link focus to the panel heading instead of outlining the whole panel", async () => {
    window.history.replaceState(null, "", "#finance-loans");
    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "순자산 전망" })).toHaveFocus());
    const loansPanel = document.getElementById("finance-loans");
    expect(loansPanel).not.toHaveFocus();
    expect(loansPanel).toHaveClass("scroll-mt-36");
  });

  it("moves focus when navigating between anchors in the same category", async () => {
    window.history.replaceState(null, "", "#planner-cash-flow");
    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "월 현금흐름" })).toHaveFocus());
    act(() => {
      window.history.replaceState(null, "", "#expense-management");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    await waitFor(() => expect(screen.getByRole("heading", { name: "지출 관리" })).toHaveFocus());
  });

  it("shows one calculator at a time instead of stacking long forms", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#finance-calculators");
    render(<DashboardOverview />);

    expect(await screen.findByRole("region", { name: "내 월급 실수령액" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "세액공제 환급 후보" })).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("heading", { name: "내 월급 실수령액" })).toHaveFocus());
    const salaryTab = screen.getByRole("tab", { name: "실수령액" });
    salaryTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("heading", { name: "세액공제 환급 후보" })).toBeVisible();
    expect(screen.queryByRole("region", { name: "내 월급 실수령액" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "연말정산" })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "연말정산" })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: "실수령액" }));
    expect(screen.getByRole("tabpanel", { name: "실수령액" })).toBeVisible();
  });

  it("keeps salary input values when switching calculators", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#finance-calculators");
    render(<DashboardOverview />);

    const grossSalary = await screen.findByRole("textbox", { name: "월 세전 급여" });
    await user.clear(grossSalary);
    await user.type(grossSalary, "999");
    await user.click(screen.getByRole("tab", { name: "연말정산" }));
    await user.click(screen.getByRole("tab", { name: "실수령액" }));

    expect(screen.getByRole("textbox", { name: "월 세전 급여" })).toHaveValue("999");
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
    window.history.replaceState(null, "", "#expense-management");
    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByRole("region", { name: "지출 관리" })).toBeVisible());
    expect(screen.queryByRole("textbox", { name: "월 생활 지출" })).not.toBeInTheDocument();
    expect(screen.getByTestId("expense-total-announcement")).toHaveTextContent("월 환산 지출 합계 2,200,000원");

    await user.click(screen.getByRole("tab", { name: /생활비/ }));
    await user.click(screen.getByRole("button", { name: "식비 선택" }));
    await user.click(screen.getByRole("button", { name: "금액에 10만원 더하기" }));

    await user.click(screen.getByRole("link", { name: /현금흐름/ }));
    expect(screen.getAllByText("2,300,000원").length).toBeGreaterThan(0);
    expect(screen.getByText("814,465원")).toBeInTheDocument();
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
    window.history.replaceState(null, "", "#expense-management");
    const view = render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByRole("region", { name: "지출 관리" })).toBeVisible());

    await user.click(screen.getByRole("tab", { name: /생활비/ }));
    await user.click(screen.getByRole("button", { name: "식비 선택" }));
    await user.click(screen.getByRole("button", { name: "금액에 10만원 더하기" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(ownerStorageKey) ?? "null")?.version).toBe(2));

    view.unmount();
    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByTestId("expense-total-announcement")).toHaveTextContent("2,300,000원"));
  });

  it("persists the first user edit under Strict Mode", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#expense-management");
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

    expect(document.getElementById("planner-cash-flow")).not.toBeInTheDocument();
    const categoryNav = screen.getByRole("navigation", { name: "대시보드 카테고리" });
    expect(within(categoryNav).getByRole("link", { name: /입력/ })).toHaveAttribute("href", "#planner-cash-flow");
    expect(within(categoryNav).getByRole("link", { name: /계산/ })).toHaveAttribute("href", "#finance-calculators");
    expect(within(categoryNav).getByRole("link", { name: /상품/ })).toHaveAttribute("href", "#finance-products");
    expect(within(categoryNav).getByRole("link", { name: /그래프/ })).toHaveAttribute("href", "#finance-loans");
  });

  it("renders one money workspace at a time from deep links", async () => {
    window.history.replaceState(null, "", "#finance-assets");
    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "자산 계좌" })).toHaveFocus());
    expect(screen.getByRole("region", { name: "자산 및 대출 편집" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "자산 계좌 추가" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "대출 추가" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "월 현금흐름" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "지출 관리" })).not.toBeInTheDocument();

    act(() => {
      window.history.replaceState(null, "", "#finance-loans-input");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    await waitFor(() => expect(screen.getByRole("heading", { name: "대출 관리" })).toHaveFocus());
    expect(screen.getByRole("button", { name: "대출 추가" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "자산 계좌 추가" })).not.toBeInTheDocument();
  });

  it("keeps edited drafts across money workspace switches and supports explicit save", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-cash-flow");
    render(<DashboardOverview />);

    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
    await waitFor(() => expect(screen.getByTestId("finance-save-status")).toHaveTextContent("저장됨"));
    const workspaceNav = screen.getByRole("navigation", { name: "입력 작업공간" });
    await user.click(within(workspaceNav).getByRole("link", { name: /자산/ }));
    await user.click(within(workspaceNav).getByRole("link", { name: /현금흐름/ }));

    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("420");
    await user.click(screen.getByRole("button", { name: "현재 계획 저장" }));

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(ownerStorageKey) ?? "null");
      expect(saved.savedAt).toEqual(expect.stringMatching(/^20\d{2}-/));
      expect(saved.scenario.monthlyIncome).toBe(4_200_000);
    });
    expect(screen.getByTestId("finance-save-status")).toHaveTextContent("저장됨");
  });

  it("keeps an in-memory draft and exposes retry when local save fails", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-cash-flow");
    render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "월 수입" })).toBeEnabled());
    const setItem = vi.spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => { throw new DOMException("quota", "QuotaExceededError"); })
      .mockImplementation(() => undefined);

    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));

    expect(await screen.findByTestId("finance-save-status")).toHaveTextContent("저장 실패");
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("420");
    await user.click(screen.getByRole("button", { name: "저장 재시도" }));

    await waitFor(() => expect(screen.getByTestId("finance-save-status")).toHaveTextContent("저장됨"));
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it("adds quick amounts cumulatively and updates the summary", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-cash-flow");
    render(<DashboardOverview />);

    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
    await user.click(screen.getByRole("button", { name: "월 수입에서 50만원 빼기" }));

    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("470");
    expect(screen.getByText("2,414,465원")).toBeInTheDocument();
  });

  it("hydrates from the saved owner scenario without showing a fallback notice", async () => {
    window.history.replaceState(null, "", "#planner-cash-flow");
    localStorage.setItem(ownerStorageKey, JSON.stringify({
      version: 1,
      scenario: { ...initialFinanceScenario, monthlyIncome: 4_500_000 },
    }));
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    render(<DashboardOverview />);

    await waitFor(() => expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("450"));
    expect(screen.queryByText("저장된 계획을 불러오지 못해 기본값을 사용합니다.")).not.toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
  });

  it("saves updates as a version 2 envelope under the owner-scoped key", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-cash-flow");
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
    window.history.replaceState(null, "", "#planner-cash-flow");
    localStorage.setItem(ownerStorageKey, "not-json");

    render(<DashboardOverview />);

    expect(await screen.findByText("저장된 계획을 불러오지 못해 기본값을 사용합니다.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("320");
  });

  it("recovers when local storage access fails", async () => {
    window.history.replaceState(null, "", "#planner-cash-flow");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new DOMException("denied", "SecurityError"); });

    render(<DashboardOverview />);

    expect(await screen.findByText("저장된 계획을 불러오지 못해 기본값을 사용합니다.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("320");
  });

  it("keeps edits and reports a recoverable notice when saving fails", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#planner-cash-flow");
    render(<DashboardOverview />);
    await waitFor(() => expect(screen.getByRole("textbox", { name: "월 수입" })).toBeEnabled());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("quota", "QuotaExceededError"); });

    await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));

    expect(await screen.findByText("변경 내용은 유지되지만 이 기기에 저장하지 못했습니다.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("420");
  });

  it("supports multiple loans and negative net worth", async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, "", "#finance-loans-input");
    render(<DashboardOverview />);

    const accountEditor = screen.getByRole("region", { name: "자산 및 대출 편집" });
    await user.click(within(accountEditor).getByRole("button", { name: "대출 추가" }));
    const principal = screen.getByRole("textbox", { name: "대출 원금" });
    await user.clear(principal);
    await user.type(principal, "2000");

    await user.click(screen.getByRole("link", { name: /요약/ }));
    await waitFor(() => expect(screen.getByTestId("overview-net-worth")).toBeInTheDocument());
    expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("-13,000,000원");
  });
});
