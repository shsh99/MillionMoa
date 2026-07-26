import type { PolicySource } from "./payroll-policy";

export const KR_YEAR_END_TAX_POLICY_2026 = {
  id: "kr-year-end-tax-credits-2026-v1",
  taxYear: 2026,
  verifiedAt: "2026-07-26",
  pensionAccount: {
    grossPayThresholdForHighRate: 55_000_000,
    highRate: 0.15,
    standardRate: 0.12,
    pensionSavingsLimit: 6_000_000,
    combinedLimitWithRetirementPension: 9_000_000,
  },
  monthlyRent: {
    grossPayLimit: 80_000_000,
    grossPayThresholdForHighRate: 55_000_000,
    highRate: 0.17,
    standardRate: 0.15,
    annualRentLimit: 10_000_000,
  },
  sources: [
    {
      title: "국세청 세액공제 - 연금계좌 세액공제",
      url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=6596",
    },
    {
      title: "국세청 월세액 세액공제",
      url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=239025&mi=40613",
    },
  ] satisfies PolicySource[],
} as const;

export type KrYearEndTaxPolicy2026 = typeof KR_YEAR_END_TAX_POLICY_2026;
