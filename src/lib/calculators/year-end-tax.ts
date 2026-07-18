import { KR_YEAR_END_TAX_POLICY_2026 } from "@/lib/policies/kr/2026";

export type YearEndTaxCreditInput = {
  annualGrossPay: number;
  prepaidIncomeTax: number;
  pensionSavingsContribution: number;
  retirementPensionContribution: number;
  monthlyRentPaid: number;
  rentHouseholdEligible: boolean;
  rentHousingEligible: boolean;
  rentContractEligible: boolean;
};

export type YearEndTaxCreditReason = "invalid-money";

export type YearEndTaxCreditResult =
  | {
      status: "estimated";
      policyId: string;
      pensionAccountCredit: number;
      monthlyRentCredit: number;
      totalCredit: number;
      refundCandidate: number;
      pensionAccount: {
        rate: number;
        eligiblePensionSavingsContribution: number;
        eligibleRetirementPensionContribution: number;
        eligibleContribution: number;
        remainingCapacity: number;
      };
      monthlyRent: {
        status: "eligible-estimate" | "not-eligible";
        rate: number;
        eligibleAnnualRent: number;
        reason?: "gross-pay-over-limit" | "eligibility-unconfirmed";
      };
      assumptions: string[];
    }
  | { status: "invalid"; reason: YearEndTaxCreditReason; policyId: string };

const policy = KR_YEAR_END_TAX_POLICY_2026;

function isWon(value: number) {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}

export function calculateYearEndTaxCredits(input: YearEndTaxCreditInput): YearEndTaxCreditResult {
  if (
    ![
      input.annualGrossPay,
      input.prepaidIncomeTax,
      input.pensionSavingsContribution,
      input.retirementPensionContribution,
      input.monthlyRentPaid,
    ].every(isWon)
  ) {
    return { status: "invalid", reason: "invalid-money", policyId: policy.id };
  }

  const pensionRate =
    input.annualGrossPay <= policy.pensionAccount.grossPayThresholdForHighRate
      ? policy.pensionAccount.highRate
      : policy.pensionAccount.standardRate;
  const eligiblePensionSavingsContribution = Math.min(
    input.pensionSavingsContribution,
    policy.pensionAccount.pensionSavingsLimit,
  );
  const eligibleRetirementPensionContribution = Math.min(
    input.retirementPensionContribution,
    Math.max(0, policy.pensionAccount.combinedLimitWithRetirementPension - eligiblePensionSavingsContribution),
  );
  const eligiblePensionContribution =
    eligiblePensionSavingsContribution + eligibleRetirementPensionContribution;
  const pensionAccountCredit = Math.floor(eligiblePensionContribution * pensionRate);

  const rentRate =
    input.annualGrossPay <= policy.monthlyRent.grossPayThresholdForHighRate
      ? policy.monthlyRent.highRate
      : policy.monthlyRent.standardRate;
  const rentEligible =
    input.annualGrossPay <= policy.monthlyRent.grossPayLimit &&
    input.rentHouseholdEligible &&
    input.rentHousingEligible &&
    input.rentContractEligible;
  const eligibleAnnualRent = rentEligible
    ? Math.min(input.monthlyRentPaid * 12, policy.monthlyRent.annualRentLimit)
    : 0;
  const monthlyRentCredit = Math.floor(eligibleAnnualRent * rentRate);
  const totalCredit = pensionAccountCredit + monthlyRentCredit;

  return {
    status: "estimated",
    policyId: policy.id,
    pensionAccountCredit,
    monthlyRentCredit,
    totalCredit,
    refundCandidate: Math.min(totalCredit, input.prepaidIncomeTax),
    pensionAccount: {
      rate: pensionRate,
      eligiblePensionSavingsContribution,
      eligibleRetirementPensionContribution,
      eligibleContribution: eligiblePensionContribution,
      remainingCapacity: Math.max(0, policy.pensionAccount.combinedLimitWithRetirementPension - eligiblePensionContribution),
    },
    monthlyRent: {
      status: rentEligible ? "eligible-estimate" : "not-eligible",
      rate: rentRate,
      eligibleAnnualRent,
      reason: rentEligible
        ? undefined
        : input.annualGrossPay > policy.monthlyRent.grossPayLimit
          ? "gross-pay-over-limit"
          : "eligibility-unconfirmed",
    },
    assumptions: [
      "연말정산 결정세액 전체가 아니라 입력한 공제 항목의 예상 세액 감소분입니다.",
      "환급 후보액은 기납부 소득세를 넘지 않도록 보수적으로 제한합니다.",
      "월세 공제는 무주택 세대, 대상 주택, 임대차계약·전입 요건을 직접 확인한 경우에만 반영합니다.",
      "연금계좌 ISA 만기 전환 추가한도는 제외한 일반 한도 기준 추정치입니다.",
    ],
  };
}
