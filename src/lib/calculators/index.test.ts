import { describe, expect, it } from "vitest";
import {
  allocateCashBuckets,
  calculateAllocationReturn,
  calculateMonthlyCashFlow,
  calculateContributionSourceLedger,
  calculateMonthsToGoal,
  calculateScenarioProjection,
  calculateSourceBackedScenarioProjection,
  calculateSpendingImpact,
  compareScenarioProjections,
  sweepMonthEndCash,
} from "@/lib/calculators";
import { allocateCashBuckets as allocateCashBucketsFromSubpath } from "@/lib/calculators/cash-allocation";
import type {
  CashBucketAllocatorInput,
  MonthEndSweepInput,
  ScenarioProjectionInput,
  SourceBackedScenarioProjectionInput,
} from "@/lib/calculators";
import type {
  CashBucketAllocatorResult,
  MonthEndSweepResult,
} from "@/lib/calculators/cash-allocation";

describe("calculator export surface", () => {
  it("exports every public calculator function from the top-level module", () => {
    expect(
      calculateAllocationReturn({
        accounts: [
          {
            name: "Saving",
            balance: 1_000_000,
            monthlyContribution: 100_000,
            expectedAnnualReturnRate: 0,
          },
        ],
      }).status,
    ).toBe("ok");

    expect(
      calculateMonthlyCashFlow({
        monthlyIncome: 1_000_000,
        fixedCosts: 300_000,
        variableSpending: 200_000,
        reserveContribution: 100_000,
      }).status,
    ).toBe("surplus");

    expect(
      calculateMonthsToGoal({
        currentAmount: 0,
        goalAmount: 1_000_000,
        monthlyContribution: 100_000,
        annualReturnRate: 0,
      }).months,
    ).toBe(10);

    expect(
      allocateCashBuckets({
        monthlyTakeHomePay: 1_000_000,
        buckets: [{ key: "saving", label: "Saving", amount: 400_000 }],
      }).status,
    ).toBe("surplus");

    expect(
      sweepMonthEndCash({
        actualIncomeReceived: 1_000_000,
        actualExpensesPaid: 500_000,
        plannedTransfersMade: 200_000,
        reservedCash: 0,
        targets: [{ key: "saving", label: "Saving", requestedAmount: 300_000 }],
      }).status,
    ).toBe("fully-swept");

    expect(
      calculateContributionSourceLedger({
        sources: [
          {
            month: "2026-07",
            sourceId: "salary-bucket",
            kind: "salary-bucket-transfer",
            label: "Salary bucket",
            amount: 500_000,
          },
        ],
      }).status,
    ).toBe("ok");

    expect(
      calculateScenarioProjection({
        goalAmount: 10_000_000,
        accounts: [
          {
            name: "Saving",
            balance: 1_000_000,
            monthlyContribution: 500_000,
            expectedAnnualReturnRate: 0,
          },
        ],
      }).status,
    ).toBe("reachable");

    expect(
      calculateSourceBackedScenarioProjection({
        goalAmount: 10_000_000,
        month: "2026-07",
        accounts: [
          {
            name: "Saving",
            balance: 1_000_000,
            expectedAnnualReturnRate: 0,
            contributionSources: [
              {
                month: "2026-07",
                sourceId: "salary-bucket",
                kind: "salary-bucket-transfer",
                label: "Salary bucket",
                amount: 500_000,
              },
            ],
          },
        ],
      }).status,
    ).toBe("reachable");

    expect(
      compareScenarioProjections({
        goalAmount: 10_000_000,
        baseScenarioName: "base",
        scenarios: [
          {
            name: "base",
            accounts: [
              {
                name: "Saving",
                balance: 1_000_000,
                monthlyContribution: 500_000,
                expectedAnnualReturnRate: 0,
              },
            ],
          },
        ],
      }).status,
    ).toBe("ok");

    expect(
      calculateSpendingImpact({
        currentAmount: 1_000_000,
        goalAmount: 10_000_000,
        baselineMonthlyContribution: 400_000,
        changedMonthlyContribution: 500_000,
        annualReturnRate: 0,
      }).status,
    ).toBe("shortened");
  });

  it("exports cash allocation calculators from the cash-allocation subpath", () => {
    expect(
      allocateCashBucketsFromSubpath({
        monthlyTakeHomePay: 1_000_000,
        buckets: [{ key: "saving", label: "Saving", amount: 400_000 }],
      }).status,
    ).toBe("surplus");
  });

  it("exports representative public types from top-level and nested modules", () => {
    const bucketInput = {
      monthlyTakeHomePay: 1_000_000,
      buckets: [{ key: "saving", label: "Saving", amount: 400_000 }],
    } satisfies CashBucketAllocatorInput;
    const bucketResult: CashBucketAllocatorResult = allocateCashBuckets(bucketInput);

    const sweepInput = {
      actualIncomeReceived: 1_000_000,
      actualExpensesPaid: 500_000,
      plannedTransfersMade: 200_000,
      reservedCash: 0,
      targets: [{ key: "saving", label: "Saving", requestedAmount: 300_000 }],
    } satisfies MonthEndSweepInput;
    const sweepResult: MonthEndSweepResult = sweepMonthEndCash(sweepInput);

    const scenarioInput = {
      goalAmount: 10_000_000,
      accounts: [
        {
          name: "Saving",
          balance: 1_000_000,
          monthlyContribution: 500_000,
          expectedAnnualReturnRate: 0,
        },
      ],
    } satisfies ScenarioProjectionInput;

    const sourceBackedInput = {
      goalAmount: 10_000_000,
      month: "2026-07",
      accounts: [
        {
          name: "Saving",
          balance: 1_000_000,
          expectedAnnualReturnRate: 0,
          contributionSources: [
            {
              month: "2026-07",
              sourceId: "salary-bucket",
              kind: "salary-bucket-transfer",
              label: "Salary bucket",
              amount: 500_000,
            },
          ],
        },
      ],
    } satisfies SourceBackedScenarioProjectionInput;

    expect(bucketResult.status).toBe("surplus");
    expect(sweepResult.status).toBe("fully-swept");
    expect(calculateScenarioProjection(scenarioInput).status).toBe("reachable");
    expect(calculateSourceBackedScenarioProjection(sourceBackedInput).status).toBe("reachable");
  });
});
