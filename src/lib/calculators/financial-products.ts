export type InstallmentMaturityInput = {
  monthlyDeposit: number;
  months: number;
  annualRate: number;
  governmentContributionRate?: number;
  interestTaxRate?: number;
};

export type InstallmentMaturityResult =
  | {
      status: "estimated";
      principal: number;
      grossInterest: number;
      interestTax: number;
      netInterest: number;
      governmentContribution: number;
      maturityAmount: number;
    }
  | { status: "invalid"; reason: "invalid-input" };

export type IsaTaxBenefitInput = {
  profit: number;
  taxFreeProfitLimit: number;
  separateTaxRate: number;
  standardTaxRate: number;
};

export type IsaTaxBenefitResult =
  | {
      status: "estimated";
      standardTax: number;
      isaTax: number;
      taxSaving: number;
      taxableProfitAfterLimit: number;
    }
  | { status: "invalid"; reason: "invalid-input" };

const isNonNegativeFinite = (value: number) => Number.isFinite(value) && value >= 0;

export function calculateInstallmentMaturity(input: InstallmentMaturityInput): InstallmentMaturityResult {
  const governmentContributionRate = input.governmentContributionRate ?? 0;
  const interestTaxRate = input.interestTaxRate ?? 0;
  const values = [
    input.monthlyDeposit,
    input.months,
    input.annualRate,
    governmentContributionRate,
    interestTaxRate,
  ];
  if (!values.every(isNonNegativeFinite) || !Number.isSafeInteger(input.months)) {
    return { status: "invalid", reason: "invalid-input" };
  }

  const monthlyRate = input.annualRate / 12;
  let balance = 0;
  for (let month = 0; month < input.months; month += 1) {
    balance = (balance + input.monthlyDeposit) * (1 + monthlyRate);
  }

  const principal = input.monthlyDeposit * input.months;
  const grossInterest = Math.max(0, balance - principal);
  const interestTax = Math.floor(grossInterest * interestTaxRate);
  const netInterest = grossInterest - interestTax;
  const governmentContribution = Math.floor(principal * governmentContributionRate);

  return {
    status: "estimated",
    principal,
    grossInterest,
    interestTax,
    netInterest,
    governmentContribution,
    maturityAmount: principal + netInterest + governmentContribution,
  };
}

export function calculateIsaTaxBenefit(input: IsaTaxBenefitInput): IsaTaxBenefitResult {
  const values = [input.profit, input.taxFreeProfitLimit, input.separateTaxRate, input.standardTaxRate];
  if (!values.every(isNonNegativeFinite)) return { status: "invalid", reason: "invalid-input" };

  const standardTax = Math.floor(input.profit * input.standardTaxRate);
  const taxableProfitAfterLimit = Math.max(0, input.profit - input.taxFreeProfitLimit);
  const isaTax = Math.floor(taxableProfitAfterLimit * input.separateTaxRate);

  return {
    status: "estimated",
    standardTax,
    isaTax,
    taxSaving: Math.max(0, standardTax - isaTax),
    taxableProfitAfterLimit,
  };
}
