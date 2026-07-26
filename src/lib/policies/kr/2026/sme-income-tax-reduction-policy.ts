import type { PolicySource } from "./payroll-policy";

export const KR_SME_INCOME_TAX_REDUCTION_POLICY_2026 = {
  id: "kr-sme-income-tax-reduction-2026-v1",
  taxYear: 2026,
  verifiedAt: "2026-07-26",
  eligibleEmploymentDeadline: "2026-12-31",
  annualCap: 2_000_000,
  militaryServiceMonthCap: 72,
  categories: {
    youth: { minimumAge: 15, maximumAge: 34, employmentFrom: "2012-01-01", periodYears: 5, rate: 0.9 },
    "age-60-plus": { minimumAge: 60, employmentFrom: "2014-01-01", periodYears: 3, rate: 0.7 },
    disabled: { employmentFrom: "2014-01-01", periodYears: 3, rate: 0.7 },
    "career-interrupted": { employmentFrom: "2017-01-01", periodYears: 3, rate: 0.7 },
  },
  sources: [
    {
      title: "국세청 중소기업 취업자 소득세 감면 안내",
      url: "https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=239023",
    },
    {
      title: "조세특례제한법 제30조",
      url: "https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1028573667",
    },
  ] satisfies PolicySource[],
} as const;

export type KrSmeIncomeTaxReductionPolicy2026 =
  typeof KR_SME_INCOME_TAX_REDUCTION_POLICY_2026;
