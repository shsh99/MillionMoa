import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  calculateFinanceScenario,
  createFinanceProjectionSeries,
  type FinanceScenarioInput,
} from "./finance-scenario-model";
import { FinanceVisualizations, walletChartColors } from "./finance-visualizations";

const input: FinanceScenarioInput = {
  assets: [
    { id: "parking", name: "생활비 파킹", category: "parking", balance: 2_000_000 },
    { id: "saving", name: "청년 적금", category: "savings", balance: 3_000_000 },
  ],
  loans: [
    {
      id: "credit",
      name: "신용대출",
      category: "credit",
      principal: 7_000_000,
      annualRate: 0.06,
      remainingMonths: 24,
      repaymentMethod: "equal-payment",
    },
    {
      id: "student",
      name: "학자금대출",
      category: "student",
      principal: 4_000_000,
      annualRate: 0.02,
      remainingMonths: 36,
      repaymentMethod: "equal-principal",
    },
  ],
  expenses: [{ id: "living", name: "생활비", kind: "living", categoryId: "living.other", amount: 2_800_000, frequency: "monthly", startDate: "2026-01-01", autoRenewal: false }],
  monthlyIncome: 3_200_000,
  monthlyNonLoanExpense: 2_800_000,
};

function renderVisualizations() {
  render(
    <FinanceVisualizations
      assets={input.assets}
      loans={input.loans}
      scenario={calculateFinanceScenario(input)}
      projection={createFinanceProjectionSeries(input)}
    />,
  );
}

describe("FinanceVisualizations", () => {
  it("uses the selected wallet chart palette", () => {
    expect(walletChartColors).toEqual(["#087a63", "#43a98c", "#cf6673", "#4f8494", "#ad7a2b", "#7a9b8e"]);
  });

  it("gives each visualization icon a semantic pastel tone", () => {
    renderVisualizations();

    expect(screen.getByTestId("visualization-icon-lilac")).toBeInTheDocument();
    expect(screen.getByTestId("visualization-icon-mint")).toBeInTheDocument();
    expect(screen.getByTestId("visualization-icon-blue")).toBeInTheDocument();
    expect(screen.getByTestId("visualization-icon-coral")).toBeInTheDocument();
  });

  it("renders accessible chart summaries including negative net worth and signed cash flow", () => {
    renderVisualizations();

    expect(screen.getByRole("img", { name: "향후 10년 순자산과 부채 반영 순자산 추이" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "그래프 핵심 요약" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "그래프 핵심 요약" })).toHaveClass(
      "divide-y",
      "sm:divide-x",
      "sm:divide-y-0",
    );
    expect(screen.getByText("현재 순자산 -600만원")).toBeInTheDocument();
    expect(screen.getByText("부채 반영선이 실제 목표 판단 기준입니다.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "이번 달 수입과 지출 및 대출 납입 비교" })).toBeInTheDocument();
    expect(screen.getByLabelText("월급 흐름 단계")).toHaveTextContent("월급 입금+320만원");
    expect(screen.getByLabelText("월급 흐름 단계")).toHaveTextContent("생활·고정비-280만원");
  });

  it("shows asset composition as a donut legend with account-level values", () => {
    renderVisualizations();

    const composition = screen.getByRole("region", { name: "자산 구성" });
    expect(within(composition).getByRole("img", { name: "계좌별 자산 구성 도넛 차트" })).toBeInTheDocument();
    expect(within(composition).getByText("생활비 파킹")).toBeInTheDocument();
    expect(within(composition).getByText("200만원 · 40%")).toBeInTheDocument();
    expect(within(composition).getByText("청년 적금")).toBeInTheDocument();
    expect(within(composition).getByText("300만원 · 60%")).toBeInTheDocument();
  });

  it("renders every loan with repayment method, first payment, and balance", () => {
    renderVisualizations();

    const table = screen.getByRole("table", { name: "대출별 상환 현황" });
    expect(screen.getByRole("list", { name: "모바일 대출 상환 카드" })).toBeInTheDocument();
    expect(within(table).getByText("신용대출")).toBeInTheDocument();
    expect(within(table).getByText("원리금균등")).toBeInTheDocument();
    expect(within(table).getByText("학자금대출")).toBeInTheDocument();
    expect(within(table).getByText("원금균등")).toBeInTheDocument();
    expect(within(table).getAllByText(/만원/).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("region", { name: "대출 상환표 가로 스크롤" })).toHaveAttribute("tabindex", "0");
  });
});
