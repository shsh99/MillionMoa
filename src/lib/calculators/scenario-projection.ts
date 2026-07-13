import {
  type AllocationAccountInput,
  calculateAllocationReturn,
} from "./allocation-return";
import { calculateMonthsToGoal } from "./goal-timeline";

export type ScenarioProjectionStatus = "reachable" | "unavailable";

export type ScenarioProjectionReason =
  | "empty-allocation"
  | "negative-amount"
  | "invalid-return-rate"
  | "max-months-exceeded"
  | "no-progress";

export type ScenarioProjectionInput = {
  goalAmount: number;
  accounts: AllocationAccountInput[];
  maxMonths?: number;
};

export type ScenarioProjectionResult = {
  status: ScenarioProjectionStatus;
  reason?: ScenarioProjectionReason;
  totalBalance: number | null;
  totalMonthlyContribution: number | null;
  projectedAnnualReturnRate: number | null;
  monthsToGoal: number | null;
};

export function calculateScenarioProjection(
  input: ScenarioProjectionInput,
): ScenarioProjectionResult {
  const allocation = calculateAllocationReturn({ accounts: input.accounts });

  if (allocation.status === "empty") {
    return {
      status: "unavailable",
      reason: "empty-allocation",
      totalBalance: allocation.totalBalance,
      totalMonthlyContribution: allocation.totalMonthlyContribution,
      projectedAnnualReturnRate: allocation.balanceWeightedAnnualReturnRate,
      monthsToGoal: null,
    };
  }

  if (allocation.status === "invalid") {
    return {
      status: "unavailable",
      reason: allocation.reason,
      totalBalance: null,
      totalMonthlyContribution: null,
      projectedAnnualReturnRate: null,
      monthsToGoal: null,
    };
  }

  const totalBalance = allocation.totalBalance ?? 0;
  const totalMonthlyContribution = allocation.totalMonthlyContribution ?? 0;
  const projectedAnnualReturnRate = allocation.balanceWeightedAnnualReturnRate ?? 0;

  const timeline = calculateMonthsToGoal({
    currentAmount: totalBalance,
    goalAmount: input.goalAmount,
    monthlyContribution: totalMonthlyContribution,
    annualReturnRate: projectedAnnualReturnRate,
    maxMonths: input.maxMonths,
  });

  if (!timeline.reached || timeline.months === null) {
    return {
      status: "unavailable",
      reason: timeline.reason,
      totalBalance,
      totalMonthlyContribution,
      projectedAnnualReturnRate,
      monthsToGoal: null,
    };
  }

  return {
    status: "reachable",
    totalBalance,
    totalMonthlyContribution,
    projectedAnnualReturnRate,
    monthsToGoal: timeline.months,
  };
}
