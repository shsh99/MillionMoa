import { describe, expect, it } from "vitest";
import {
  calculateScenarioMonthsToGoal,
  calculateFinanceScenario,
  calculateLoanScheduleSummary,
  createFinanceProjectionSeries,
  financeScenarioSchema,
  type AssetAccount,
  type Loan,
} from "./finance-scenario-model";
import type { ExpenseItem } from "./expense-management-model";

function monthlyExpense(amount: number): ExpenseItem[] {
  return amount === 0 ? [] : [{
    id: `expense-${amount}`,
    name: "Monthly expense",
    kind: "living",
    categoryId: "living.other",
    amount,
    frequency: "monthly",
    startDate: "2026-07-17",
    autoRenewal: true,
  }];
}

const assets: AssetAccount[] = [
  { id: "parking", name: "Parking", category: "parking", balance: 5_000_000 },
  { id: "savings", name: "Savings", category: "savings", balance: 2_000_000 },
];

const loans: Loan[] = [
  {
    id: "credit",
    name: "Credit loan",
    category: "credit",
    principal: 8_000_000,
    annualRate: 0,
    remainingMonths: 10,
    repaymentMethod: "equal-payment",
  },
  {
    id: "jeonse",
    name: "Jeonse loan",
    category: "jeonse",
    principal: 4_000_000,
    annualRate: 0.12,
    remainingMonths: 12,
    repaymentMethod: "bullet",
  },
];

describe("financeScenarioSchema", () => {
  const validScenario = {
    assets: [{
      id: "asset",
      name: "Asset",
      category: "investment",
      balance: 0,
      annualRate: -1,
      monthlyContribution: 0,
      maturityMonth: 0,
    }],
    loans: [{
      id: "loan",
      name: "Loan",
      category: "student",
      principal: 0,
      annualRate: 1,
      remainingMonths: 1_200,
      repaymentMethod: "equal-principal",
    }],
    manualLiabilities: 0,
    monthlyIncome: 0,
    monthlyNonLoanExpense: 0,
    expenses: [],
  };

  it("accepts the current finance scenario contract at its boundaries", () => {
    expect(financeScenarioSchema.parse(validScenario)).toEqual(validScenario);
    expect(financeScenarioSchema.parse({
      ...validScenario,
      assets: [{ ...validScenario.assets[0], balance: -500_000 }],
    }).assets[0].balance).toBe(-500_000);
  });

  it.each([
    ["asset category", { assets: [{ ...validScenario.assets[0], category: "crypto" }] }],
    ["asset balance", { assets: [{ ...validScenario.assets[0], balance: 0.5 }] }],
    ["asset rate", { assets: [{ ...validScenario.assets[0], annualRate: 1.01 }] }],
    ["asset contribution", { assets: [{ ...validScenario.assets[0], monthlyContribution: -1 }] }],
    ["asset maturity", { assets: [{ ...validScenario.assets[0], maturityMonth: -1 }] }],
    ["loan category", { loans: [{ ...validScenario.loans[0], category: "payday" }] }],
    ["loan principal", { loans: [{ ...validScenario.loans[0], principal: -1 }] }],
    ["loan rate", { loans: [{ ...validScenario.loans[0], annualRate: -0.01 }] }],
    ["loan term", { loans: [{ ...validScenario.loans[0], remainingMonths: 1_201 }] }],
    ["repayment method", { loans: [{ ...validScenario.loans[0], repaymentMethod: "interest-only" }] }],
    ["manual liabilities", { manualLiabilities: 0.5 }],
    ["monthly income", { monthlyIncome: -1 }],
    ["monthly expense", { monthlyNonLoanExpense: Number.NaN }],
    ["asset id length", { assets: [{ ...validScenario.assets[0], id: "a".repeat(129) }] }],
    ["asset name length", { assets: [{ ...validScenario.assets[0], name: "a".repeat(81) }] }],
    ["loan id length", { loans: [{ ...validScenario.loans[0], id: "a".repeat(129) }] }],
    ["loan name length", { loans: [{ ...validScenario.loans[0], name: "a".repeat(81) }] }],
    ["asset count", { assets: Array.from({ length: 101 }, () => validScenario.assets[0]) }],
    ["loan count", { loans: Array.from({ length: 101 }, () => validScenario.loans[0]) }],
    ["expense count", { expenses: Array.from({ length: 501 }, () => monthlyExpense(1)[0]) }],
    ["expense amount", { expenses: [{ ...monthlyExpense(1)[0], amount: 0.5 }] }],
    ["expense date", { expenses: [{ ...monthlyExpense(1)[0], startDate: "2026-02-30" }] }],
    ["expense category kind", { expenses: [{ ...monthlyExpense(1)[0], kind: "fixed" }] }],
  ])("rejects an invalid %s", (_label, patch) => {
    expect(financeScenarioSchema.safeParse({ ...validScenario, ...patch }).success).toBe(false);
  });

  it("requires canonical expenses", () => {
    const withoutExpenses = { ...validScenario, expenses: undefined };
    expect(financeScenarioSchema.safeParse(withoutExpenses).success).toBe(false);
  });
});

describe("calculateLoanScheduleSummary", () => {
  it("rejects loan terms beyond the supported projection boundary", () => {
    expect(() => calculateLoanScheduleSummary({
      id: "too-long",
      name: "비현실적 장기 대출",
      category: "other",
      principal: 1_000_000,
      annualRate: 1,
      remainingMonths: 10_000,
      repaymentMethod: "equal-payment",
    })).toThrow("loan remainingMonths must be between 1 and 1200");
  });
  it("calculates equal-payment repayment", () => {
    const summary = calculateLoanScheduleSummary({
      ...loans[0],
      principal: 12_000_000,
      annualRate: 0.12,
      remainingMonths: 12,
    });

    expect(summary.firstMonthlyPayment).toBeCloseTo(1_066_185.46, 2);
    expect(summary.totalInterest).toBeCloseTo(794_225.57, 2);
  });

  it("calculates equal-principal repayment", () => {
    const summary = calculateLoanScheduleSummary({
      ...loans[0],
      principal: 12_000_000,
      annualRate: 0.12,
      remainingMonths: 12,
      repaymentMethod: "equal-principal",
    });

    expect(summary.firstMonthlyPayment).toBe(1_120_000);
    expect(summary.totalInterest).toBe(780_000);
  });

  it("calculates bullet repayment", () => {
    const summary = calculateLoanScheduleSummary({
      ...loans[0],
      principal: 12_000_000,
      annualRate: 0.12,
      remainingMonths: 12,
      repaymentMethod: "bullet",
    });

    expect(summary.firstMonthlyPayment).toBe(120_000);
    expect(summary.totalInterest).toBe(1_440_000);
  });

  it.each([
    ["equal-payment", 100_000],
    ["equal-principal", 100_000],
    ["bullet", 0],
  ] as const)("handles a zero-rate %s loan", (repaymentMethod, firstMonthlyPayment) => {
    const summary = calculateLoanScheduleSummary({
      ...loans[0],
      principal: 1_200_000,
      annualRate: 0,
      remainingMonths: 12,
      repaymentMethod,
    });

    expect(summary.firstMonthlyPayment).toBe(firstMonthlyPayment);
    expect(summary.totalInterest).toBe(0);
  });

  it.each([
    ["negative principal", { principal: -1 }],
    ["fractional principal", { principal: 1.5 }],
    ["non-finite principal", { principal: Number.NaN }],
    ["negative rate", { annualRate: -0.01 }],
    ["rate above 100%", { annualRate: 1.01 }],
    ["non-finite rate", { annualRate: Number.POSITIVE_INFINITY }],
    ["zero term", { remainingMonths: 0 }],
    ["fractional term", { remainingMonths: 1.5 }],
    ["non-finite term", { remainingMonths: Number.NaN }],
  ])("rejects %s", (_label, patch) => {
    expect(() => calculateLoanScheduleSummary({ ...loans[0], ...patch })).toThrow(RangeError);
  });

  it("rejects an unsupported repayment method at runtime", () => {
    expect(() => calculateLoanScheduleSummary({
      ...loans[0],
      repaymentMethod: "interest-only" as Loan["repaymentMethod"],
    })).toThrow(RangeError);
  });
});

describe("calculateFinanceScenario", () => {
  it("aggregates multiple assets and loans once while preserving signed results", () => {
    expect(calculateFinanceScenario({
      assets,
      loans,
      manualLiabilities: 1_000_000,
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 300_000,
      expenses: monthlyExpense(300_000),
    })).toEqual({
      totalAssetBalances: 7_000_000,
      totalLoanPrincipals: 12_000_000,
      totalLiabilities: 13_000_000,
      netWorth: -6_000_000,
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 300_000,
      totalLoanPayment: 840_000,
      rawMonthlySurplus: -140_000,
      goalContribution: 0,
      loanSummaries: [
        { loanId: "credit", firstMonthlyPayment: 800_000, totalInterest: 0 },
        { loanId: "jeonse", firstMonthlyPayment: 40_000, totalInterest: 480_000 },
      ],
    });
  });

  it("keeps overdraft-like asset balances as signed net worth inputs", () => {
    const result = calculateFinanceScenario({
      assets: [{ ...assets[0], balance: -500_000 }],
      loans: [],
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 0,
      expenses: [],
    });

    expect(result.totalAssetBalances).toBe(-500_000);
    expect(result.netWorth).toBe(-500_000);
  });

  it("derives monthly non-loan expense from recurring expense items", () => {
    const result = calculateFinanceScenario({
      assets: [],
      loans: [],
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 999_999,
      expenses: [
        ...monthlyExpense(300_000),
        { ...monthlyExpense(120_000)[0], id: "quarterly", amount: 120_000, frequency: "quarterly" },
        { ...monthlyExpense(1)[0], id: "once", amount: 500_000, frequency: "one-time" },
      ],
    });

    expect(result.monthlyNonLoanExpense).toBe(340_000);
    expect(result.rawMonthlySurplus).toBe(660_000);
  });

  it("calculates current expenses for the supplied reference month", () => {
    const result = calculateFinanceScenario({
      assets: [],
      loans: [],
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 0,
      expenses: [
        { ...monthlyExpense(300_000)[0], id: "expired", startDate: "2026-01-01", endDate: "2026-06-30" },
        { ...monthlyExpense(200_000)[0], id: "future", startDate: "2026-08-01" },
      ],
    }, { referenceDate: "2026-07-17" });

    expect(result.monthlyNonLoanExpense).toBe(0);
    expect(result.rawMonthlySurplus).toBe(1_000_000);
  });
});

describe("createFinanceProjectionSeries", () => {
  it("recalculates active expenses as projection months cross schedule boundaries", () => {
    const series = createFinanceProjectionSeries({
      assets: [],
      loans: [],
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 0,
      expenses: [{
        ...monthlyExpense(400_000)[0],
        startDate: "2026-08-01",
        endDate: "2026-09-30",
      }],
    }, { maxMonths: 3, intervalMonths: 1, referenceDate: "2026-07-17" });

    expect(series.map(({ month, debtAdjusted }) => ({ month, debtAdjusted }))).toEqual([
      { month: 0, debtAdjusted: 0 },
      { month: 1, debtAdjusted: 600_000 },
      { month: 2, debtAdjusted: 1_200_000 },
      { month: 3, debtAdjusted: 2_200_000 },
    ]);
  });

  it("uses the changing multi-loan schedule when calculating the goal month", () => {
    const input = {
      assets: [{ ...assets[0], balance: 0 }],
      loans: [{ ...loans[0], principal: 1_200_000, annualRate: 0, remainingMonths: 12 }],
      monthlyIncome: 200_000,
      monthlyNonLoanExpense: 0,
      expenses: [],
    };

    expect(calculateScenarioMonthsToGoal(input, 1_200_000)).toBe(12);
  });

  it("spends account balances before carrying an unfunded deficit", () => {
    const series = createFinanceProjectionSeries({
      assets: [{ ...assets[0], balance: 1_000_000, annualRate: 0.12 }],
      loans: [],
      monthlyIncome: 0,
      monthlyNonLoanExpense: 500_000,
      expenses: monthlyExpense(500_000),
    });

    expect(series[1].debtAdjusted).toBeLessThan(-4_900_000);
    expect(series[1].debtAdjusted).toBeGreaterThan(-5_000_000);
  });

  it("repays an unfunded cash deficit before allocating later surplus", () => {
    const series = createFinanceProjectionSeries({
      assets: [{ ...assets[0], balance: 0, monthlyContribution: 500_000 }],
      loans: [{ ...loans[0], principal: 1_000_000, remainingMonths: 1, repaymentMethod: "bullet" }],
      monthlyIncome: 500_000,
      monthlyNonLoanExpense: 0,
      expenses: [],
    }, { maxMonths: 2, intervalMonths: 1 });

    expect(series[1].debtAdjusted).toBe(-500_000);
    expect(series[2].debtAdjusted).toBe(0);
  });
  it("returns 12-month chart points through month 120 with a zero baseline", () => {
    const series = createFinanceProjectionSeries({
      assets: [
        { ...assets[0], balance: 1_000_000, monthlyContribution: 100_000, maturityMonth: 12 },
        { ...assets[1], monthlyContribution: 200_000 },
      ],
      loans: [{ ...loans[0], principal: 1_200_000, remainingMonths: 12 }],
      manualLiabilities: 600_000,
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 300_000,
      expenses: monthlyExpense(300_000),
    });

    expect(series).toHaveLength(11);
    expect(series.map((point) => point.month)).toEqual([0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120]);
    expect(series[0]).toEqual({ month: 0, zero: 0, baseline: 3_000_000, debtAdjusted: 1_200_000 });
    expect(series[1]).toEqual({ month: 12, zero: 0, baseline: 11_400_000, debtAdjusted: 9_600_000 });
    expect(series[2]).toEqual({ month: 24, zero: 0, baseline: 19_800_000, debtAdjusted: 18_000_000 });
    expect(series.at(-1)).toEqual({ month: 120, zero: 0, baseline: 87_000_000, debtAdjusted: 85_200_000 });
  });

  it("uses clamped scenario contribution when accounts have no explicit contributions", () => {
    const series = createFinanceProjectionSeries({
      assets,
      loans: [],
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 250_000,
      expenses: monthlyExpense(250_000),
    });

    expect(series[1].baseline).toBe(16_000_000);
    expect(series[1].debtAdjusted).toBe(16_000_000);
  });

  it("releases a completed loan payment without counting its principal or payment twice", () => {
    const series = createFinanceProjectionSeries({
      assets: [{ ...assets[0], balance: 0 }],
      loans: [{ ...loans[0], principal: 1_200_000, remainingMonths: 12 }],
      monthlyIncome: 200_000,
      monthlyNonLoanExpense: 0,
      expenses: [],
    });

    expect(series[1]).toEqual({ month: 12, zero: 0, baseline: 2_400_000, debtAdjusted: 1_200_000 });
    expect(series[2]).toEqual({ month: 24, zero: 0, baseline: 4_800_000, debtAdjusted: 3_600_000 });
  });

  it("treats explicit contributions as allocation and not external cash", () => {
    const series = createFinanceProjectionSeries({
      assets: [{ ...assets[0], balance: 0, monthlyContribution: 500_000 }],
      loans: [{ ...loans[0], principal: 1_200_000, remainingMonths: 12 }],
      monthlyIncome: 200_000,
      monthlyNonLoanExpense: 0,
      expenses: [],
    });

    expect(series[1]).toEqual({ month: 12, zero: 0, baseline: 2_400_000, debtAdjusted: 1_200_000 });
  });

  it("preserves a monthly deficit by reducing projected net worth", () => {
    const series = createFinanceProjectionSeries({
      assets: [{ ...assets[0], balance: 1_000_000 }],
      loans: [],
      monthlyIncome: 100_000,
      monthlyNonLoanExpense: 200_000,
      expenses: monthlyExpense(200_000),
    });

    expect(series[1]).toEqual({ month: 12, zero: 0, baseline: -200_000, debtAdjusted: -200_000 });
  });

  it("funds a bullet principal payment from assets while removing the liability", () => {
    const series = createFinanceProjectionSeries({
      assets: [{ ...assets[0], balance: 0 }],
      loans: [{
        ...loans[0],
        principal: 1_200_000,
        annualRate: 0.12,
        remainingMonths: 12,
        repaymentMethod: "bullet",
      }],
      monthlyIncome: 200_000,
      monthlyNonLoanExpense: 0,
      expenses: [],
    });

    expect(series[0].debtAdjusted).toBe(-1_200_000);
    expect(series[1].debtAdjusted).toBe(1_056_000);
  });

  it.each([
    ["non-finite income", { monthlyIncome: Number.POSITIVE_INFINITY }],
    ["non-finite expense", { monthlyNonLoanExpense: Number.NaN }],
    ["non-finite manual liability", { manualLiabilities: Number.POSITIVE_INFINITY }],
    ["non-finite balance", { assets: [{ ...assets[0], balance: Number.NaN }] }],
    ["non-finite contribution", { assets: [{ ...assets[0], monthlyContribution: Number.POSITIVE_INFINITY }] }],
    ["non-finite asset rate", { assets: [{ ...assets[0], annualRate: Number.NaN }] }],
  ])("rejects %s", (_label, patch) => {
    expect(() => createFinanceProjectionSeries({
      assets,
      loans: [],
      monthlyIncome: 1_000_000,
      monthlyNonLoanExpense: 300_000,
      expenses: monthlyExpense(300_000),
      ...patch,
    })).toThrow(RangeError);
  });
});
