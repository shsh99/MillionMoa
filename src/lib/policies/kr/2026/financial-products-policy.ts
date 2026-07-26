import type { PolicySource } from "./payroll-policy";

export const KR_FINANCIAL_PRODUCTS_POLICY_2026 = {
  id: "kr-financial-products-2026-v1",
  verifiedAt: "2026-07-26",
  youthFutureSavings: {
    monthlyDepositLimit: 500_000,
    termMonths: 36,
    normalContributionRate: 0.06,
    preferentialContributionRate: 0.12,
    ageRange: { minimum: 19, maximum: 34 },
    militaryServiceMonthCap: 72,
    taxFreeInterest: true,
    source: {
      title: "서민금융진흥원 청년미래적금",
      url: "https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do",
    },
  },
  youthLeapAccount: {
    monthlyDepositLimit: 700_000,
    termMonths: 60,
    newEnrollmentUntil: "2025-12-31",
    source: {
      title: "서민금융진흥원 청년도약계좌",
      url: "https://www.kinfa.or.kr/fill4young/financeCommercial/youthLongAsset.do",
    },
  },
  youthHousingDream: {
    maximumAnnualRate: 0.045,
    monthlyDepositLimit: 1_000_000,
    incomeDeductionRate: 0.4,
    incomeDeductionAnnualPaymentLimit: 3_000_000,
    taxFreeInterestLimit: 5_000_000,
    source: {
      title: "국토교통부 청년주택드림청약",
      url: "https://www.molit.go.kr/2024dreamaccount/main.jsp",
    },
  },
  isa: {
    annualContributionLimit: 20_000_000,
    generalTaxFreeProfitLimit: 2_000_000,
    lowIncomeTaxFreeProfitLimit: 4_000_000,
    separateTaxRate: 0.099,
    standardFinancialIncomeTaxRate: 0.154,
    source: {
      title: "금융위원회 ISA 주요정책문답",
      url: "https://www.fsc.go.kr/po020201/27339",
    },
  },
  sources: [
    {
      title: "서민금융진흥원 청년미래적금",
      url: "https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do",
    },
    {
      title: "서민금융진흥원 청년도약계좌",
      url: "https://www.kinfa.or.kr/fill4young/financeCommercial/youthLongAsset.do",
    },
    {
      title: "국토교통부 청년주택드림청약",
      url: "https://www.molit.go.kr/2024dreamaccount/main.jsp",
    },
    {
      title: "금융위원회 ISA 주요정책문답",
      url: "https://www.fsc.go.kr/po020201/27339",
    },
  ] satisfies PolicySource[],
} as const;

export type KrFinancialProductsPolicy2026 = typeof KR_FINANCIAL_PRODUCTS_POLICY_2026;
