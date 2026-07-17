import { KR_PAYROLL_POLICY_2026 } from "@/lib/policies/kr/2026";
import { isIntegerWon, parseIsoDate } from "./date-utils";
import type { SalaryNetPayInput, SalaryNetPayResult } from "./types";

const policy = KR_PAYROLL_POLICY_2026;
const invalid = (reason: Extract<SalaryNetPayResult, { status: "invalid" }>['reason']): SalaryNetPayResult => ({
  status: "invalid",
  reason,
  policyId: policy.id,
});

export function calculateSalaryNetPay(input: SalaryNetPayInput): SalaryNetPayResult {
  const paymentDate = parseIsoDate(input.paymentDate);
  if (!paymentDate) return invalid("invalid-date");
  if (input.paymentDate < policy.effectiveFrom || input.paymentDate > policy.effectiveTo) {
    return invalid("unsupported-payment-date");
  }
  if (!["official-table", "payslip"].includes(input.incomeTaxBeforeReduction.provenance)) {
    return invalid("invalid-income-tax-provenance");
  }

  const reduction = input.incomeTaxReduction ?? 0;
  const amounts = [
    input.grossMonthlyPay,
    input.nonTaxableMonthlyPay,
    input.incomeTaxBeforeReduction.amount,
    reduction,
    ...Object.values(input.insuranceBases ?? {}),
  ];
  if (amounts.some((amount) => !isIntegerWon(amount))) return invalid("invalid-money");
  if (input.nonTaxableMonthlyPay > input.grossMonthlyPay) {
    return invalid("non-taxable-pay-exceeds-gross");
  }
  if (reduction > input.incomeTaxBeforeReduction.amount) {
    return invalid("reduction-exceeds-income-tax");
  }

  const taxableMonthlyPay = input.grossMonthlyPay - input.nonTaxableMonthlyPay;
  const bounds = policy.pension.bounds.find(
    (candidate) => input.paymentDate >= candidate.from && input.paymentDate <= candidate.to,
  );
  if (!bounds) return invalid("unsupported-payment-date");

  const rawPensionBase = input.insuranceBases?.pensionStandardMonthlyIncome ?? taxableMonthlyPay;
  const pensionBase = rawPensionBase === 0 ? 0 : Math.min(bounds.maximum, Math.max(bounds.minimum, rawPensionBase));
  const healthBase = input.insuranceBases?.healthMonthlyRemuneration ?? taxableMonthlyPay;
  const employmentBase = input.insuranceBases?.employmentMonthlyRemuneration ?? taxableMonthlyPay;
  const nationalPension = Math.floor((pensionBase * 475) / 10_000);
  const healthInsurance = Math.floor((healthBase * 3595) / 100_000);
  const longTermCareInsurance = Math.floor(
    (healthInsurance * 9448) / 71_900,
  );
  const employmentInsurance = Math.floor((employmentBase * 9) / 1_000);
  const incomeTax = input.incomeTaxBeforeReduction.amount - reduction;
  const localIncomeTax = Math.floor(incomeTax / 10);
  const total =
    nationalPension + healthInsurance + longTermCareInsurance + employmentInsurance + incomeTax + localIncomeTax;
  const estimatedMonthlyTakeHomePay = input.grossMonthlyPay - total;

  return {
    status: "estimated",
    policyId: policy.id,
    grossMonthlyPay: input.grossMonthlyPay,
    taxableMonthlyPay,
    incomeTaxProvenance: input.incomeTaxBeforeReduction.provenance,
    deductions: {
      nationalPension,
      healthInsurance,
      longTermCareInsurance,
      employmentInsurance,
      incomeTax,
      localIncomeTax,
      total,
    },
    estimatedMonthlyTakeHomePay,
    estimatedAnnualTakeHomePay: estimatedMonthlyTakeHomePay * 12,
    assumptions: [
      "보험료 기준액을 입력하지 않으면 과세 월급을 추정 기준액으로 사용합니다.",
      "상여금과 연말정산은 포함하지 않은 월 급여 추정치입니다.",
    ],
  };
}
