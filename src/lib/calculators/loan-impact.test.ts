import { describe, expect, it } from "vitest";
import { calculateLoanImpact } from "./loan-impact";

const baseInput = {
  principal: 12_000_000,
  annualInterestRate: 0,
  remainingTermMonths: 12,
  currentAmount: 10_000_000,
  goalAmount: 100_000_000,
  baselineMonthlyContribution: 1_000_000,
  annualReturnRate: 0,
};

describe("calculateLoanImpact", () => {
  it("calculates a zero-interest loan and resumes contribution after payoff", () => {
    expect(calculateLoanImpact(baseInput)).toEqual({
      status: "available",
      scheduledMonthlyPayment: 1_000_000,
      totalMonthlyLoanPayment: 1_000_000,
      firstMonthInterest: 0,
      totalInterest: 0,
      totalPayment: 12_000_000,
      payoffMonths: 12,
      changedMonthlyContribution: 0,
      baselineMonthsToGoal: 90,
      changedMonthsToGoal: 102,
      monthsDelayed: 12,
    });
  });

  it("reports standard loan interest and a reachable delayed timeline", () => {
    const result = calculateLoanImpact({
      ...baseInput,
      principal: 10_000_000,
      annualInterestRate: 0.12,
      remainingTermMonths: 10,
      baselineMonthlyContribution: 2_000_000,
    });

    expect(result.status).toBe("available");
    expect(result.firstMonthInterest).toBe(100_000);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalMonthlyLoanPayment).toBeGreaterThan(1_000_000);
    expect(result.changedMonthlyContribution).toBeLessThan(1_000_000);
    expect(result.monthsDelayed).toBeGreaterThan(0);
  });

  it("extra monthly payment lowers total interest and shortens payoff", () => {
    const withoutExtra = calculateLoanImpact({
      ...baseInput,
      principal: 10_000_000,
      annualInterestRate: 0.08,
      remainingTermMonths: 24,
      baselineMonthlyContribution: 2_000_000,
    });
    const withExtra = calculateLoanImpact({
      ...baseInput,
      principal: 10_000_000,
      annualInterestRate: 0.08,
      remainingTermMonths: 24,
      extraMonthlyPayment: 300_000,
      baselineMonthlyContribution: 2_000_000,
    });

    expect(withoutExtra.status).toBe("available");
    expect(withExtra.status).toBe("available");
    expect(withExtra.totalInterest).toBeLessThan(withoutExtra.totalInterest ?? 0);
    expect(withExtra.payoffMonths).toBeLessThan(withoutExtra.payoffMonths ?? 0);
  });

  it("caps the last payment when extra payment would overpay", () => {
    const result = calculateLoanImpact({
      ...baseInput,
      principal: 1_000_000,
      annualInterestRate: 0,
      remainingTermMonths: 12,
      extraMonthlyPayment: 1_000_000,
      baselineMonthlyContribution: 2_000_000,
    });

    expect(result.status).toBe("available");
    expect(result.payoffMonths).toBe(1);
    expect(result.totalPayment).toBe(1_000_000);
  });

  it("rejects invalid loan and KRW inputs", () => {
    expect(calculateLoanImpact({ ...baseInput, principal: -1 }).reason).toBe("negative-amount");
    expect(calculateLoanImpact({ ...baseInput, principal: 100_000.5 }).reason).toBe("non-integer-krw");
    expect(calculateLoanImpact({ ...baseInput, annualInterestRate: 1.1 }).reason).toBe("invalid-loan-rate");
    expect(calculateLoanImpact({ ...baseInput, remainingTermMonths: 0 }).reason).toBe("invalid-term");
  });
});
