import { describe, expect, it } from "vitest";
import {
  calculateAnnualExpenseEquivalent,
  calculateExpenseSummary,
  calculateMonthlyExpenseEquivalent,
  expenseCategories,
  type ExpenseItem,
} from "./expense-management-model";

function expense(patch: Partial<ExpenseItem> = {}): ExpenseItem {
  return {
    id: "expense-1",
    name: "Expense",
    kind: "living",
    categoryId: "living.other",
    amount: 120_000,
    frequency: "monthly",
    startDate: "2026-07-17",
    autoRenewal: false,
    ...patch,
  };
}

describe("expense recurrence equivalents", () => {
  it.each([
    ["weekly", 120_000, 520_000],
    ["monthly", 120_000, 120_000],
    ["quarterly", 120_000, 40_000],
    ["annual", 120_000, 10_000],
    ["one-time", 120_000, 0],
  ] as const)("calculates the monthly equivalent for %s expenses", (frequency, amount, expected) => {
    expect(calculateMonthlyExpenseEquivalent(expense({ frequency, amount }))).toBe(expected);
  });

  it.each([
    ["weekly", 10_000, 520_000],
    ["monthly", 10_000, 120_000],
    ["quarterly", 10_000, 40_000],
    ["annual", 10_000, 10_000],
    ["one-time", 10_000, 0],
  ] as const)("calculates the annual equivalent for %s expenses", (frequency, amount, expected) => {
    expect(calculateAnnualExpenseEquivalent(expense({ frequency, amount }))).toBe(expected);
  });
});

describe("calculateExpenseSummary", () => {
  it("rounds only the final totals and groups recurring expenses by kind", () => {
    const items = [
      expense({ id: "fixed", kind: "fixed", categoryId: "fixed.housing", amount: 10_001, frequency: "weekly" }),
      expense({ id: "living", kind: "living", amount: 10_001, frequency: "quarterly" }),
      expense({ id: "irregular", kind: "irregular", categoryId: "irregular.medical", amount: 10_001, frequency: "annual" }),
      expense({ id: "once", kind: "irregular", categoryId: "irregular.other", amount: 999_999, frequency: "one-time" }),
    ];

    expect(calculateExpenseSummary(items)).toEqual({
      monthlyTotal: 47_505,
      annualTotal: 570_057,
      byKind: { fixed: 43_338, living: 3_334, irregular: 833 },
    });
  });

  it("includes expenses only while their schedule is active in the reference month", () => {
    const items = [
      expense({ id: "future", amount: 200_000, startDate: "2026-09-01" }),
      expense({ id: "active", amount: 300_000, startDate: "2026-07-31", endDate: "2026-08-01" }),
      expense({ id: "expired", amount: 400_000, startDate: "2026-01-01", endDate: "2026-06-30" }),
    ];

    expect(calculateExpenseSummary(items, "2026-08-15").monthlyTotal).toBe(300_000);
    expect(calculateExpenseSummary(items, "2026-09").monthlyTotal).toBe(200_000);
  });
});

describe("expenseCategories", () => {
  it("provides stable Korean category metadata including the migration category", () => {
    expect(expenseCategories).toContainEqual({ id: "fixed.housing", kind: "fixed", name: "주거" });
    expect(expenseCategories).toContainEqual({ id: "living.other", kind: "living", name: "기타 생활비" });
    expect(expenseCategories).toContainEqual({ id: "irregular.medical", kind: "irregular", name: "의료" });
    expect(new Set(expenseCategories.map(({ id }) => id)).size).toBe(expenseCategories.length);
  });
});
