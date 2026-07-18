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
  sources: [
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

