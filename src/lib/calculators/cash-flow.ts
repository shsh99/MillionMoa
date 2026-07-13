export type CashFlowStatus = "surplus" | "balanced" | "deficit" | "invalid";

export type CashFlowReason = "negative-cash-flow" | "negative-input";

export type MonthlyCashFlowInput = {
  monthlyIncome: number;
  fixedCosts: number;
  variableSpending: number;
  reserveContribution: number;
};

export type MonthlyCashFlowResult = {
  status: CashFlowStatus;
  reason?: CashFlowReason;
  monthlyIncome: number;
  totalOutflow: number | null;
  investableSurplus: number | null;
  savingRate: number | null;
};

export function calculateMonthlyCashFlow(input: MonthlyCashFlowInput): MonthlyCashFlowResult {
  const amounts = [
    input.monthlyIncome,
    input.fixedCosts,
    input.variableSpending,
    input.reserveContribution,
  ];

  if (amounts.some((amount) => amount < 0)) {
    return {
      status: "invalid",
      reason: "negative-input",
      monthlyIncome: input.monthlyIncome,
      totalOutflow: null,
      investableSurplus: null,
      savingRate: null,
    };
  }

  const totalOutflow = input.fixedCosts + input.variableSpending + input.reserveContribution;
  const investableSurplus = input.monthlyIncome - totalOutflow;
  const savingRate = input.monthlyIncome === 0 ? 0 : investableSurplus / input.monthlyIncome;

  if (investableSurplus < 0) {
    return {
      status: "deficit",
      reason: "negative-cash-flow",
      monthlyIncome: input.monthlyIncome,
      totalOutflow,
      investableSurplus,
      savingRate,
    };
  }

  return {
    status: investableSurplus === 0 ? "balanced" : "surplus",
    monthlyIncome: input.monthlyIncome,
    totalOutflow,
    investableSurplus,
    savingRate,
  };
}
