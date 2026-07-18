import { describe, expect, it } from "vitest";
import { calculateNonTaxablePay } from "./non-taxable-pay";

describe("calculateNonTaxablePay", () => {
  it("caps common monthly non-taxable salary items by official monthly limits", () => {
    const result = calculateNonTaxablePay({
      mealAllowance: 250_000,
      selfDrivingAllowance: 300_000,
      childcareAllowance: 250_000,
      childcareEligibleChildCount: 1,
      productionOvertimeAllowance: 0,
      productionOvertimeAnnualAlreadyUsed: 0,
      productionWorkerEligible: false,
      otherConfirmedNonTaxablePay: 0,
      otherConfirmedNonTaxablePayVerified: false,
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.totalNonTaxablePay).toBe(600_000);
    expect(result.totalTaxableExcess).toBe(200_000);
    expect(result.items.slice(0, 3)).toMatchObject([
      { key: "mealAllowance", entered: 250_000, applied: 200_000, taxableExcess: 50_000 },
      { key: "selfDrivingAllowance", entered: 300_000, applied: 200_000, taxableExcess: 100_000 },
      { key: "childcareAllowance", entered: 250_000, applied: 200_000, taxableExcess: 50_000 },
    ]);
  });

  it("only applies production overtime non-taxable treatment when the worker eligibility is confirmed", () => {
    const ineligible = calculateNonTaxablePay({
      mealAllowance: 0,
      selfDrivingAllowance: 0,
      childcareAllowance: 0,
      childcareEligibleChildCount: 0,
      productionOvertimeAllowance: 300_000,
      productionOvertimeAnnualAlreadyUsed: 0,
      productionWorkerEligible: false,
      otherConfirmedNonTaxablePay: 0,
      otherConfirmedNonTaxablePayVerified: false,
    });

    const eligible = calculateNonTaxablePay({
      mealAllowance: 0,
      selfDrivingAllowance: 0,
      childcareAllowance: 0,
      childcareEligibleChildCount: 0,
      productionOvertimeAllowance: 300_000,
      productionOvertimeAnnualAlreadyUsed: 2_200_000,
      productionWorkerEligible: true,
      otherConfirmedNonTaxablePay: 50_000,
      otherConfirmedNonTaxablePayVerified: true,
    });

    expect(ineligible.status).toBe("estimated");
    expect(eligible.status).toBe("estimated");
    if (ineligible.status !== "estimated" || eligible.status !== "estimated") return;
    expect(ineligible.totalNonTaxablePay).toBe(0);
    expect(ineligible.totalTaxableExcess).toBe(300_000);
    expect(eligible.totalNonTaxablePay).toBe(250_000);
    expect(eligible.totalTaxableExcess).toBe(100_000);
  });

  it("allows production overtime above 200,000 in a month when annual cap remains", () => {
    const result = calculateNonTaxablePay({
      mealAllowance: 0,
      selfDrivingAllowance: 0,
      childcareAllowance: 0,
      childcareEligibleChildCount: 0,
      productionOvertimeAllowance: 300_000,
      productionOvertimeAnnualAlreadyUsed: 1_000_000,
      productionWorkerEligible: true,
      otherConfirmedNonTaxablePay: 0,
      otherConfirmedNonTaxablePayVerified: false,
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.totalNonTaxablePay).toBe(300_000);
    expect(result.totalTaxableExcess).toBe(0);
  });

  it("applies the childcare allowance cap per eligible child", () => {
    const result = calculateNonTaxablePay({
      mealAllowance: 0,
      selfDrivingAllowance: 0,
      childcareAllowance: 450_000,
      childcareEligibleChildCount: 2,
      productionOvertimeAllowance: 0,
      productionOvertimeAnnualAlreadyUsed: 0,
      productionWorkerEligible: false,
      otherConfirmedNonTaxablePay: 0,
      otherConfirmedNonTaxablePayVerified: false,
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.totalNonTaxablePay).toBe(400_000);
    expect(result.totalTaxableExcess).toBe(50_000);
  });

  it("rejects fractional, negative, or unsafe item amounts", () => {
    expect(calculateNonTaxablePay({
      mealAllowance: -1,
      selfDrivingAllowance: 0,
      childcareAllowance: 0,
      childcareEligibleChildCount: 0,
      productionOvertimeAllowance: 0,
      productionOvertimeAnnualAlreadyUsed: 0,
      productionWorkerEligible: false,
      otherConfirmedNonTaxablePay: 0,
      otherConfirmedNonTaxablePayVerified: false,
    })).toMatchObject({ status: "invalid", reason: "invalid-money" });

    expect(calculateNonTaxablePay({
      mealAllowance: 0.5,
      selfDrivingAllowance: 0,
      childcareAllowance: 0,
      childcareEligibleChildCount: 0,
      productionOvertimeAllowance: 0,
      productionOvertimeAnnualAlreadyUsed: 0,
      productionWorkerEligible: false,
      otherConfirmedNonTaxablePay: 0,
      otherConfirmedNonTaxablePayVerified: false,
    })).toMatchObject({ status: "invalid", reason: "invalid-money" });

    expect(calculateNonTaxablePay({
      mealAllowance: 0,
      selfDrivingAllowance: 0,
      childcareAllowance: 0,
      childcareEligibleChildCount: -1,
      productionOvertimeAllowance: 0,
      productionOvertimeAnnualAlreadyUsed: 0,
      productionWorkerEligible: false,
      otherConfirmedNonTaxablePay: 0,
      otherConfirmedNonTaxablePayVerified: false,
    })).toMatchObject({ status: "invalid", reason: "invalid-money" });
  });

  it("does not apply other non-taxable pay until the payslip amount is verified", () => {
    const result = calculateNonTaxablePay({
      mealAllowance: 0,
      selfDrivingAllowance: 0,
      childcareAllowance: 0,
      childcareEligibleChildCount: 0,
      productionOvertimeAllowance: 0,
      productionOvertimeAnnualAlreadyUsed: 0,
      productionWorkerEligible: false,
      otherConfirmedNonTaxablePay: 500_000,
      otherConfirmedNonTaxablePayVerified: false,
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.totalNonTaxablePay).toBe(0);
    expect(result.totalTaxableExcess).toBe(500_000);
  });
});
