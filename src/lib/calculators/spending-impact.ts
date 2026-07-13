import { calculateMonthsToGoal } from "./goal-timeline";

export type SpendingImpactStatus = "shortened" | "delayed" | "unchanged" | "unavailable";

export type SpendingImpactReason =
  | "baseline-invalid-return-rate"
  | "baseline-max-months-exceeded"
  | "baseline-no-progress"
  | "changed-invalid-return-rate"
  | "changed-max-months-exceeded"
  | "changed-no-progress";

export type SpendingImpactInput = {
  currentAmount: number;
  goalAmount: number;
  baselineMonthlyContribution: number;
  changedMonthlyContribution: number;
  annualReturnRate: number;
  maxMonths?: number;
};

export type SpendingImpactResult = {
  status: SpendingImpactStatus;
  reason?: SpendingImpactReason;
  baselineMonths: number | null;
  changedMonths: number | null;
  monthsReduced: number | null;
};

function mapUnavailableReason(
  side: "baseline" | "changed",
  reason: "invalid-return-rate" | "max-months-exceeded" | "no-progress" | undefined,
): SpendingImpactReason {
  return `${side}-${reason ?? "max-months-exceeded"}` as SpendingImpactReason;
}

export function calculateSpendingImpact(input: SpendingImpactInput): SpendingImpactResult {
  const baseTimelineInput = {
    currentAmount: input.currentAmount,
    goalAmount: input.goalAmount,
    annualReturnRate: input.annualReturnRate,
    maxMonths: input.maxMonths,
  };

  const baseline = calculateMonthsToGoal({
    ...baseTimelineInput,
    monthlyContribution: input.baselineMonthlyContribution,
  });
  const changed = calculateMonthsToGoal({
    ...baseTimelineInput,
    monthlyContribution: input.changedMonthlyContribution,
  });

  if (!baseline.reached || baseline.months === null) {
    return {
      status: "unavailable",
      reason: mapUnavailableReason("baseline", baseline.reason),
      baselineMonths: baseline.months,
      changedMonths: changed.months,
      monthsReduced: null,
    };
  }

  if (!changed.reached || changed.months === null) {
    return {
      status: "unavailable",
      reason: mapUnavailableReason("changed", changed.reason),
      baselineMonths: baseline.months,
      changedMonths: changed.months,
      monthsReduced: null,
    };
  }

  const monthsReduced = baseline.months - changed.months;

  return {
    status: monthsReduced > 0 ? "shortened" : monthsReduced < 0 ? "delayed" : "unchanged",
    baselineMonths: baseline.months,
    changedMonths: changed.months,
    monthsReduced,
  };
}
