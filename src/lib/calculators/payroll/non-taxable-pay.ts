import { KR_PAYROLL_POLICY_2026 } from "../../policies/kr/2026/payroll-policy";

export type NonTaxablePayInput = {
  mealAllowance: number;
  selfDrivingAllowance: number;
  childcareAllowance: number;
  childcareEligibleChildCount: number;
  productionOvertimeAllowance: number;
  productionOvertimeAnnualAlreadyUsed: number;
  productionWorkerEligible: boolean;
  otherConfirmedNonTaxablePay: number;
  otherConfirmedNonTaxablePayVerified: boolean;
};

export type NonTaxablePayItemKey =
  | "mealAllowance"
  | "selfDrivingAllowance"
  | "childcareAllowance"
  | "productionOvertimeAllowance"
  | "otherConfirmedNonTaxablePay";

export type NonTaxablePayItem = {
  key: NonTaxablePayItemKey;
  label: string;
  entered: number;
  applied: number;
  taxableExcess: number;
  limitLabel: string;
};

export type NonTaxablePayResult =
  | {
      status: "estimated";
      policyId: string;
      totalNonTaxablePay: number;
      totalTaxableExcess: number;
      items: NonTaxablePayItem[];
    }
  | { status: "invalid"; policyId: string; reason: "invalid-money" };

const isIntegerWon = (value: number) => Number.isSafeInteger(value) && value >= 0;

function cappedItem(
  key: NonTaxablePayItemKey,
  label: string,
  entered: number,
  limit: number,
  limitLabel: string,
): NonTaxablePayItem {
  const applied = Math.min(entered, limit);
  return {
    key,
    label,
    entered,
    applied,
    taxableExcess: entered - applied,
    limitLabel,
  };
}

export function calculateNonTaxablePay(input: NonTaxablePayInput): NonTaxablePayResult {
  const values = [
    input.mealAllowance,
    input.selfDrivingAllowance,
    input.childcareAllowance,
    input.childcareEligibleChildCount,
    input.productionOvertimeAllowance,
    input.productionOvertimeAnnualAlreadyUsed,
    input.otherConfirmedNonTaxablePay,
  ];

  if (!values.every(isIntegerWon)) {
    return { status: "invalid", policyId: KR_PAYROLL_POLICY_2026.id, reason: "invalid-money" };
  }

  const limits = KR_PAYROLL_POLICY_2026.nonTaxableMonthlyLimits;
  const childcareLimit = limits.childcareAllowancePerChild * input.childcareEligibleChildCount;
  const productionAnnualRemaining = Math.max(0, limits.productionOvertimeAnnual - input.productionOvertimeAnnualAlreadyUsed);
  const productionLimit = input.productionWorkerEligible ? productionAnnualRemaining : 0;
  const otherConfirmedLimit = input.otherConfirmedNonTaxablePayVerified ? Number.MAX_SAFE_INTEGER : 0;
  const items: NonTaxablePayItem[] = [
    cappedItem("mealAllowance", "식대", input.mealAllowance, limits.mealAllowance, "월 20만원 한도"),
    cappedItem("selfDrivingAllowance", "자기차량운전보조금", input.selfDrivingAllowance, limits.selfDrivingAllowance, "월 20만원 한도"),
    cappedItem("childcareAllowance", "6세 이하 보육수당", input.childcareAllowance, childcareLimit, `월 20만원 x ${input.childcareEligibleChildCount}명`),
    cappedItem(
      "productionOvertimeAllowance",
      "생산직 연장·야간·휴일수당",
      input.productionOvertimeAllowance,
      productionLimit,
      input.productionWorkerEligible ? `연 240만원 잔여 ${productionAnnualRemaining.toLocaleString("ko-KR")}원` : "요건 확인 전 0원 반영",
    ),
    cappedItem(
      "otherConfirmedNonTaxablePay",
      "기타 비과세",
      input.otherConfirmedNonTaxablePay,
      otherConfirmedLimit,
      input.otherConfirmedNonTaxablePayVerified ? "급여명세서 확인 금액" : "확인 전 0원 반영",
    ),
  ];

  return {
    status: "estimated",
    policyId: KR_PAYROLL_POLICY_2026.id,
    totalNonTaxablePay: items.reduce((sum, item) => sum + item.applied, 0),
    totalTaxableExcess: items.reduce((sum, item) => sum + item.taxableExcess, 0),
    items,
  };
}
