import { type AllocationAccountInput } from "./allocation-return";
import {
  calculateScenarioProjection,
  type ScenarioProjectionReason,
} from "./scenario-projection";

export type ScenarioComparisonInput = {
  goalAmount: number;
  baseScenarioName: string;
  scenarios: {
    name: string;
    accounts: AllocationAccountInput[];
  }[];
  maxMonths?: number;
};

export type ScenarioComparisonStatus = "ok" | "invalid";

export type ScenarioComparisonReason = "base-scenario-unavailable";

export type ComparedScenario = {
  name: string;
  status: "reachable" | "unavailable";
  reason?: ScenarioProjectionReason;
  monthsToGoal: number | null;
  monthsReducedVsBase: number | null;
};

export type ScenarioComparisonResult = {
  status: ScenarioComparisonStatus;
  reason?: ScenarioComparisonReason;
  fastestScenarioName: string | null;
  baseScenarioName: string;
  scenarios: ComparedScenario[];
};

function sortComparedScenarios(scenarios: ComparedScenario[]): ComparedScenario[] {
  return [...scenarios].sort((left, right) => {
    if (left.monthsToGoal === null && right.monthsToGoal === null) {
      return left.name.localeCompare(right.name);
    }

    if (left.monthsToGoal === null) {
      return 1;
    }

    if (right.monthsToGoal === null) {
      return -1;
    }

    return left.monthsToGoal - right.monthsToGoal || left.name.localeCompare(right.name);
  });
}

export function compareScenarioProjections(
  input: ScenarioComparisonInput,
): ScenarioComparisonResult {
  const projected = input.scenarios.map((scenario) => {
    const projection = calculateScenarioProjection({
      goalAmount: input.goalAmount,
      accounts: scenario.accounts,
      maxMonths: input.maxMonths,
    });

    return {
      name: scenario.name,
      projection,
    };
  });

  const base = projected.find((scenario) => {
    return scenario.name === input.baseScenarioName && scenario.projection.status === "reachable";
  });

  const compared = projected.map(({ name, projection }) => {
    if (projection.status === "unavailable") {
      return {
        name,
        status: projection.status,
        reason: projection.reason,
        monthsToGoal: null,
        monthsReducedVsBase: null,
      } satisfies ComparedScenario;
    }

    return {
      name,
      status: projection.status,
      monthsToGoal: projection.monthsToGoal,
      monthsReducedVsBase:
        base && projection.monthsToGoal !== null && base.projection.monthsToGoal !== null
          ? base.projection.monthsToGoal - projection.monthsToGoal
          : null,
    } satisfies ComparedScenario;
  });

  const sorted = sortComparedScenarios(compared);
  const fastest = sorted.find((scenario) => scenario.status === "reachable") ?? null;

  if (!base) {
    return {
      status: "invalid",
      reason: "base-scenario-unavailable",
      fastestScenarioName: null,
      baseScenarioName: input.baseScenarioName,
      scenarios: sorted,
    };
  }

  return {
    status: "ok",
    fastestScenarioName: fastest?.name ?? null,
    baseScenarioName: input.baseScenarioName,
    scenarios: sorted,
  };
}
