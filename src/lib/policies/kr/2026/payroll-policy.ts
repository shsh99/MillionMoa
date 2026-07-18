export type PolicySource = {
  title: string;
  url: string;
};

export const KR_PAYROLL_POLICY_2026 = {
  id: "kr-payroll-2026-v1",
  taxYear: 2026,
  effectiveFrom: "2026-01-01",
  effectiveTo: "2026-12-31",
  verifiedAt: "2026-07-17",
  pension: {
    employeeRate: 0.0475,
    bounds: [
      { from: "2026-01-01", to: "2026-06-30", minimum: 400_000, maximum: 6_370_000 },
      { from: "2026-07-01", to: "2026-12-31", minimum: 410_000, maximum: 6_590_000 },
    ],
  },
  health: { employeeRate: 0.03595 },
  longTermCare: { remunerationRate: 0.009448, healthTotalRate: 0.0719 },
  employment: { employeeRate: 0.009 },
  localIncomeTax: { rateOfIncomeTax: 0.1 },
  simplifiedIncomeTaxTable: {
    effectiveFrom: "2026-03-01",
    withholdingRatios: [0.8, 1, 1.2],
    childTaxCreditMonthlyAdjustments: {
      oneEligibleChild: 20_830,
      twoEligibleChildren: 45_830,
      additionalEligibleChildFromThird: 33_330,
    },
  },
  nonTaxableMonthlyLimits: {
    mealAllowance: 200_000,
    selfDrivingAllowance: 200_000,
    childcareAllowancePerChild: 200_000,
    productionOvertimeAnnual: 2_400_000,
    productionOvertimeMonthlyEquivalent: 200_000,
  },
  sources: [
    {
      title: "국세청 근로소득 원천징수방법(간이세액표)",
      url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7862&mi=6583",
    },
    {
      title: "국세청 홈택스 근로소득간이세액표",
      url: "https://hometax.go.kr/websquare/websquare.html?tm2lIdx=410600000&tm3lIdx=4106030000&tmIdx=41&w2xPath=%2Fui%2Fpp%2Findex_pp.xml",
    },
    {
      title: "국세청 비과세 근로소득",
      url: "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7867&mi=6431",
    },
    {
      title: "보건복지부 국민연금 개혁 Q&A",
      url: "https://www.mohw.go.kr/menu.es?mid=a10714060000",
    },
    {
      title: "국민연금공단 2026 기준소득월액 상하한액 안내",
      url: "https://www.nps.or.kr/pnsgdnc/newgdnc/getOHAE0001M1.do?pstId=ZZ202600000000000147",
    },
    {
      title: "국민건강보험 2026 보험료율 안내",
      url: "https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html",
    },
    {
      title: "고용노동부 고용보험료 안내",
      url: "https://moel.go.kr/info/astmgmt/employ/employList.do",
    },
  ] satisfies PolicySource[],
} as const;

export type KrPayrollPolicy2026 = typeof KR_PAYROLL_POLICY_2026;

