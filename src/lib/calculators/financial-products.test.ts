import { describe, expect, it } from "vitest";
import { calculateInstallmentMaturity, calculateIsaTaxBenefit } from "./financial-products";

describe("financial product calculators", () => {
  it("separates deposit principal, interest, tax, and government contribution", () => {
    const result = calculateInstallmentMaturity({
      monthlyDeposit: 500_000,
      months: 36,
      annualRate: 0.05,
      governmentContributionRate: 0.06,
      interestTaxRate: 0,
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.principal).toBe(18_000_000);
    expect(result.governmentContribution).toBe(1_080_000);
    expect(result.grossInterest).toBeGreaterThan(1_300_000);
    expect(result.maturityAmount).toBe(result.principal + result.netInterest + result.governmentContribution);
  });

  it("estimates ISA saving from the selected tax-free profit limit", () => {
    const result = calculateIsaTaxBenefit({
      profit: 5_000_000,
      taxFreeProfitLimit: 4_000_000,
      separateTaxRate: 0.099,
      standardTaxRate: 0.154,
    });

    expect(result).toEqual({
      status: "estimated",
      standardTax: 770_000,
      isaTax: 99_000,
      taxSaving: 671_000,
      taxableProfitAfterLimit: 1_000_000,
    });
  });
});
