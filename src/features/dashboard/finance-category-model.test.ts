import { describe, expect, it } from "vitest";
import {
  addCategoryItem,
  calculateCategoryTotals,
  removeCategoryItem,
  updateCategoryItem,
  type FinanceCategoryItem,
} from "./finance-category-model";

const items: FinanceCategoryItem[] = [
  { id: "cash", kind: "asset", name: "예금", amountMan: "1000" },
  { id: "debt", kind: "liability", name: "마이너스통장", amountMan: "1500" },
  { id: "salary", kind: "income", name: "월 실수령", amountMan: "320" },
  { id: "fixed", kind: "expense", name: "고정비", amountMan: "105" },
];

describe("finance category model", () => {
  it("derives signed net worth and monthly saving capacity", () => {
    expect(calculateCategoryTotals(items)).toEqual({
      assetMan: 1000,
      liabilityMan: 1500,
      netWorthMan: -500,
      incomeMan: 320,
      expenseMan: 105,
      monthlyContributionMan: 215,
    });
  });

  it("preserves a negative monthly cash flow instead of masking it as zero", () => {
    expect(calculateCategoryTotals([
      { id: "income", kind: "income", name: "수입", amountMan: "100" },
      { id: "expense", kind: "expense", name: "지출", amountMan: "150" },
    ]).monthlyContributionMan).toBe(-50);
  });

  it("adds, updates, and removes rows without mutating the source", () => {
    const added = addCategoryItem(items, {
      id: "living",
      kind: "expense",
      name: "생활비",
      amountMan: "85",
    });
    const updated = updateCategoryItem(added, "living", { amountMan: "95" });
    const removed = removeCategoryItem(updated, "living");

    expect(items).toHaveLength(4);
    expect(added).toHaveLength(5);
    expect(updated.find((item) => item.id === "living")?.amountMan).toBe("95");
    expect(removed.items).toEqual(items);
    expect(removed.removed?.name).toBe("생활비");
    expect(removed.index).toBe(4);
  });
});
