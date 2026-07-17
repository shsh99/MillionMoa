import { KR_SME_INCOME_TAX_REDUCTION_POLICY_2026 } from "@/lib/policies/kr/2026";
import {
  ageInMonthsAt,
  endOfAnniversaryMonth,
  isIntegerWon,
  parseIsoDate,
  toIsoDate,
} from "./date-utils";
import type { SmeIncomeTaxReductionInput, SmeIncomeTaxReductionResult } from "./types";

const policy = KR_SME_INCOME_TAX_REDUCTION_POLICY_2026;
const outcome = (
  status: "invalid" | "not-eligible" | "needs-confirmation",
  reason: Extract<SmeIncomeTaxReductionResult, { status: typeof status }>['reason'],
): SmeIncomeTaxReductionResult => ({ status, reason, policyId: policy.id });

export function calculateSmeIncomeTaxReduction(
  input: SmeIncomeTaxReductionInput,
): SmeIncomeTaxReductionResult {
  const payment = parseIsoDate(input.paymentDate);
  const employment = parseIsoDate(input.initialEligibleEmploymentDate);
  if (!payment || !employment) return outcome("invalid", "invalid-date");
  if (payment.getUTCFullYear() !== policy.taxYear) {
    return outcome("invalid", "unsupported-payment-date");
  }
  if (employment > payment) return outcome("invalid", "employment-after-payment");
  const category = policy.categories[input.eligibilityType];
  if (input.initialEligibleEmploymentDate < category.employmentFrom) {
    return outcome("not-eligible", "employment-before-start");
  }
  if (input.initialEligibleEmploymentDate > policy.eligibleEmploymentDeadline) {
    return outcome("not-eligible", "employment-after-deadline");
  }
  if (![input.incomeTaxBeforeReduction, input.annualReductionAlreadyUsed].every(isIntegerWon)) {
    return outcome("invalid", "invalid-money");
  }
  if (input.annualReductionAlreadyUsed > policy.annualCap) {
    return outcome("invalid", "annual-cap-exceeded");
  }
  const militaryMonths = input.militaryServiceMonths ?? 0;
  if (!isIntegerWon(militaryMonths)) return outcome("invalid", "invalid-military-service");

  if (input.companyEligibility === "unconfirmed") return outcome("needs-confirmation", "company-unconfirmed");
  if (input.industryEligibility === "unconfirmed") return outcome("needs-confirmation", "industry-unconfirmed");
  if (input.workerEligibility === "unconfirmed") return outcome("needs-confirmation", "worker-unconfirmed");
  if (input.companyEligibility === "ineligible") return outcome("not-eligible", "company-ineligible");
  if (input.industryEligibility === "ineligible") return outcome("not-eligible", "industry-ineligible");
  if (input.workerEligibility === "ineligible") return outcome("not-eligible", "worker-ineligible");

  if (input.eligibilityType === "youth" || input.eligibilityType === "age-60-plus") {
    const birth = input.birthDate ? parseIsoDate(input.birthDate) : null;
    if (!birth) return outcome("invalid", "birth-date-required");
    let ageMonths = ageInMonthsAt(birth, employment);
    if (input.eligibilityType === "youth") {
      const youthPolicy = policy.categories.youth;
      ageMonths -= Math.min(militaryMonths, policy.militaryServiceMonthCap);
      if (
        ageMonths < youthPolicy.minimumAge * 12 ||
        ageMonths >= (youthPolicy.maximumAge + 1) * 12
      ) {
        return outcome("not-eligible", "age-ineligible");
      }
    } else if (ageMonths < policy.categories["age-60-plus"].minimumAge * 12) {
      return outcome("not-eligible", "age-ineligible");
    }
  }

  const eligibilityEndDate = endOfAnniversaryMonth(employment, category.periodYears);
  if (payment < employment) return outcome("not-eligible", "reduction-period-not-started");
  if (payment > eligibilityEndDate) return outcome("not-eligible", "reduction-period-expired");

  const remainingAnnualCapBeforeReduction = policy.annualCap - input.annualReductionAlreadyUsed;
  const provisionalReduction = Math.floor(
    (input.incomeTaxBeforeReduction * (category.rate === 0.9 ? 9 : 7)) / 10,
  );
  const estimatedReduction = Math.min(provisionalReduction, remainingAnnualCapBeforeReduction);

  return {
    status: "eligible-estimate",
    policyId: policy.id,
    eligibilityStart: input.initialEligibleEmploymentDate,
    eligibilityEnd: toIsoDate(eligibilityEndDate),
    reductionRate: category.rate,
    annualCap: policy.annualCap,
    remainingAnnualCapBeforeReduction,
    estimatedReduction,
    incomeTaxAfterReduction: input.incomeTaxBeforeReduction - estimatedReduction,
  };
}
