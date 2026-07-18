export type IncomeTaxProvenance = "official-table" | "payslip";

export type IncomeTaxBeforeReduction = {
  amount: number;
  provenance: IncomeTaxProvenance;
};

export type InsuranceBases = {
  pensionStandardMonthlyIncome?: number;
  healthMonthlyRemuneration?: number;
  employmentMonthlyRemuneration?: number;
};

export type PayrollDeductions = {
  nationalPension: number;
  healthInsurance: number;
  longTermCareInsurance: number;
  employmentInsurance: number;
  incomeTax: number;
  localIncomeTax: number;
  total: number;
};

export type SalaryNetPayInput = {
  paymentDate: string;
  grossMonthlyPay: number;
  nonTaxableMonthlyPay: number;
  incomeTaxBeforeReduction: IncomeTaxBeforeReduction;
  incomeTaxReduction?: number;
  insuranceBases?: InsuranceBases;
};

export type SalaryNetPayReason =
  | "invalid-date"
  | "unsupported-payment-date"
  | "invalid-money"
  | "invalid-income-tax-provenance"
  | "non-taxable-pay-exceeds-gross"
  | "reduction-exceeds-income-tax";

export type SalaryNetPayResult =
  | {
      status: "estimated";
      policyId: string;
      grossMonthlyPay: number;
      taxableMonthlyPay: number;
      incomeTaxProvenance: IncomeTaxProvenance;
      deductions: PayrollDeductions;
      estimatedMonthlyTakeHomePay: number;
      estimatedAnnualTakeHomePay: number;
      assumptions: string[];
    }
  | { status: "invalid"; reason: SalaryNetPayReason; policyId: string };

export type SmeEligibilityType = "youth" | "age-60-plus" | "disabled" | "career-interrupted";
export type EligibilityConfirmation = "confirmed" | "unconfirmed" | "ineligible";

export type SmeIncomeTaxReductionInput = {
  paymentDate: string;
  initialEligibleEmploymentDate: string;
  eligibilityType: SmeEligibilityType;
  birthDate?: string;
  militaryServiceMonths?: number;
  companyEligibility: EligibilityConfirmation;
  industryEligibility: EligibilityConfirmation;
  workerEligibility: EligibilityConfirmation;
  incomeTaxBeforeReduction: number;
  annualReductionAlreadyUsed: number;
};

export type SmeIncomeTaxReductionReason =
  | "invalid-date"
  | "unsupported-payment-date"
  | "invalid-money"
  | "invalid-military-service"
  | "employment-after-payment"
  | "employment-before-start"
  | "employment-after-deadline"
  | "company-unconfirmed"
  | "industry-unconfirmed"
  | "worker-unconfirmed"
  | "company-ineligible"
  | "industry-ineligible"
  | "worker-ineligible"
  | "birth-date-required"
  | "age-ineligible"
  | "reduction-period-not-started"
  | "reduction-period-expired"
  | "annual-cap-exceeded";

export type SmeIncomeTaxReductionResult =
  | {
      status: "eligible-estimate";
      policyId: string;
      eligibilityStart: string;
      eligibilityEnd: string;
      reductionRate: number;
      annualCap: number;
      remainingAnnualCapBeforeReduction: number;
      estimatedReduction: number;
      incomeTaxAfterReduction: number;
    }
  | {
      status: "invalid" | "not-eligible" | "needs-confirmation";
      reason: SmeIncomeTaxReductionReason;
      policyId: string;
    };
