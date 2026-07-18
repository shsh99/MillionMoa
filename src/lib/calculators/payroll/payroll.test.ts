import { describe, expect, it } from "vitest";
import { KR_PAYROLL_POLICY_2026 } from "@/lib/policies/kr/2026";
import { calculateSalaryNetPay } from "./salary-net-pay";
import { calculateSmeIncomeTaxReduction } from "./sme-income-tax-reduction";

describe("calculateSalaryNetPay", () => {
  const base = {
    paymentDate: "2026-06-25",
    grossMonthlyPay: 3_000_000,
    nonTaxableMonthlyPay: 200_000,
    incomeTaxBeforeReduction: { amount: 74_000, provenance: "official-table" as const },
  };

  it("uses the pension bounds applicable on the payment date", () => {
    const june = calculateSalaryNetPay({ ...base, grossMonthlyPay: 10_000_000 });
    const july = calculateSalaryNetPay({
      ...base,
      paymentDate: "2026-07-01",
      grossMonthlyPay: 10_000_000,
    });

    expect(june.status).toBe("estimated");
    expect(july.status).toBe("estimated");
    if (june.status !== "estimated" || july.status !== "estimated") return;
    expect(june.deductions.nationalPension).toBe(302_575);
    expect(july.deductions.nationalPension).toBe(313_025);
  });

  it("floors employee insurance contributions to whole won", () => {
    const result = calculateSalaryNetPay(base);

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.taxableMonthlyPay).toBe(2_800_000);
    expect(result.deductions).toEqual({
      nationalPension: 133_000,
      healthInsurance: 100_660,
      longTermCareInsurance: 13_227,
      employmentInsurance: 25_200,
      incomeTax: 74_000,
      localIncomeTax: 7_400,
      total: 353_487,
    });
    expect(result.estimatedMonthlyTakeHomePay).toBe(2_646_513);
  });

  it("uses explicit assessed bases when supplied", () => {
    const result = calculateSalaryNetPay({
      ...base,
      insuranceBases: {
        pensionStandardMonthlyIncome: 2_000_000,
        healthMonthlyRemuneration: 2_100_000,
        employmentMonthlyRemuneration: 2_200_000,
      },
    });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.deductions.nationalPension).toBe(95_000);
    expect(result.deductions.healthInsurance).toBe(75_495);
    expect(result.deductions.employmentInsurance).toBe(19_800);
  });

  it("documents the current official simplified-tax child monthly adjustments", () => {
    expect(KR_PAYROLL_POLICY_2026.simplifiedIncomeTaxTable.childTaxCreditMonthlyAdjustments).toEqual({
      oneEligibleChild: 12_500,
      twoEligibleChildren: 29_160,
      additionalEligibleChildFromThird: 25_000,
    });
  });

  it("does not charge a minimum pension contribution when pay is zero", () => {
    const result = calculateSalaryNetPay({ ...base, grossMonthlyPay: 0, nonTaxableMonthlyPay: 0, incomeTaxBeforeReduction: { amount: 0, provenance: "official-table" } });
    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.deductions.total).toBe(0);
    expect(result.estimatedMonthlyTakeHomePay).toBe(0);
  });

  it("applies reduction before calculating local income tax", () => {
    const result = calculateSalaryNetPay({ ...base, incomeTaxReduction: 50_000 });

    expect(result.status).toBe("estimated");
    if (result.status !== "estimated") return;
    expect(result.deductions.incomeTax).toBe(24_000);
    expect(result.deductions.localIncomeTax).toBe(2_400);
  });

  it.each([
    ["invalid date", { ...base, paymentDate: "2026-02-30" }],
    ["unsupported year", { ...base, paymentDate: "2027-01-01" }],
    ["fractional money", { ...base, grossMonthlyPay: 1.5 }],
    ["negative money", { ...base, nonTaxableMonthlyPay: -1 }],
    ["non-taxable above gross", { ...base, nonTaxableMonthlyPay: 3_000_001 }],
    ["reduction above tax", { ...base, incomeTaxReduction: 74_001 }],
    ["not finite", { ...base, grossMonthlyPay: Number.POSITIVE_INFINITY }],
  ])("rejects %s", (_name, input) => {
    expect(calculateSalaryNetPay(input)).toMatchObject({ status: "invalid" });
  });
});

describe("calculateSmeIncomeTaxReduction", () => {
  const youth = {
    paymentDate: "2026-07-25",
    initialEligibleEmploymentDate: "2024-07-15",
    eligibilityType: "youth" as const,
    birthDate: "1995-07-16",
    militaryServiceMonths: 0,
    companyEligibility: "confirmed" as const,
    industryEligibility: "confirmed" as const,
    workerEligibility: "confirmed" as const,
    incomeTaxBeforeReduction: 100_000,
    annualReductionAlreadyUsed: 0,
  };

  it("applies the youth rate within the five-year period", () => {
    expect(calculateSmeIncomeTaxReduction(youth)).toMatchObject({
      status: "eligible-estimate",
      reductionRate: 0.9,
      annualCap: 2_000_000,
      estimatedReduction: 90_000,
      incomeTaxAfterReduction: 10_000,
      eligibilityEnd: "2029-07-31",
    });
  });

  it("includes the anniversary month and expires the following month", () => {
    expect(
      calculateSmeIncomeTaxReduction({
        ...youth,
        initialEligibleEmploymentDate: "2021-07-15",
        paymentDate: "2026-07-31",
      }).status,
    ).toBe("eligible-estimate");
    expect(
      calculateSmeIncomeTaxReduction({
        ...youth,
        initialEligibleEmploymentDate: "2021-07-15",
        paymentDate: "2026-08-01",
      }),
    ).toMatchObject({ status: "not-eligible", reason: "reduction-period-expired" });
  });

  it("caps military age adjustment at six years", () => {
    const adjusted = calculateSmeIncomeTaxReduction({
      ...youth,
      initialEligibleEmploymentDate: "2026-01-01",
      birthDate: "1985-12-31",
      militaryServiceMonths: 120,
    });
    expect(adjusted.status).toBe("eligible-estimate");
  });

  it("applies the 70 percent rate for a confirmed 60-plus worker", () => {
    const result = calculateSmeIncomeTaxReduction({
      ...youth,
      eligibilityType: "age-60-plus",
      birthDate: "1965-01-01",
      initialEligibleEmploymentDate: "2026-01-01",
    });
    expect(result).toMatchObject({ status: "eligible-estimate", reductionRate: 0.7 });
  });

  it.each([
    ["youth", "2011-12-31"],
    ["age-60-plus", "2013-12-31"],
    ["disabled", "2013-12-31"],
    ["career-interrupted", "2016-12-31"],
  ] as const)("rejects %s employment before the category start date", (eligibilityType, initialEligibleEmploymentDate) => {
    expect(
      calculateSmeIncomeTaxReduction({
        ...youth,
        eligibilityType,
        initialEligibleEmploymentDate,
        birthDate: eligibilityType === "age-60-plus" ? "1953-12-31" : youth.birthDate,
      }),
    ).toMatchObject({ status: "not-eligible", reason: "employment-before-start" });
  });

  it.each([
    ["disabled", "2024-01-01"],
    ["career-interrupted", "2024-01-01"],
  ] as const)("applies the 70 percent rate for confirmed %s workers", (eligibilityType, initialEligibleEmploymentDate) => {
    expect(
      calculateSmeIncomeTaxReduction({
        ...youth,
        eligibilityType,
        initialEligibleEmploymentDate,
      }),
    ).toMatchObject({ status: "eligible-estimate", reductionRate: 0.7 });
  });

  it("applies the remaining annual cap", () => {
    expect(
      calculateSmeIncomeTaxReduction({
        ...youth,
        incomeTaxBeforeReduction: 300_000,
        annualReductionAlreadyUsed: 1_900_000,
      }),
    ).toMatchObject({
      status: "eligible-estimate",
      remainingAnnualCapBeforeReduction: 100_000,
      estimatedReduction: 100_000,
    });
  });

  it("returns a zero reduction after the annual cap is exhausted", () => {
    expect(
      calculateSmeIncomeTaxReduction({ ...youth, annualReductionAlreadyUsed: 2_000_000 }),
    ).toMatchObject({
      status: "eligible-estimate",
      remainingAnnualCapBeforeReduction: 0,
      estimatedReduction: 0,
      incomeTaxAfterReduction: 100_000,
    });
  });

  it("rejects a youth who is 35 after the military adjustment", () => {
    expect(
      calculateSmeIncomeTaxReduction({
        ...youth,
        initialEligibleEmploymentDate: "2026-01-01",
        birthDate: "1990-12-31",
      }),
    ).toMatchObject({ status: "not-eligible", reason: "age-ineligible" });
  });

  it("requires company and industry confirmation", () => {
    expect(
      calculateSmeIncomeTaxReduction({ ...youth, companyEligibility: "unconfirmed" }),
    ).toMatchObject({ status: "needs-confirmation", reason: "company-unconfirmed" });
    expect(
      calculateSmeIncomeTaxReduction({ ...youth, industryEligibility: "ineligible" }),
    ).toMatchObject({ status: "not-eligible", reason: "industry-ineligible" });
    expect(
      calculateSmeIncomeTaxReduction({ ...youth, workerEligibility: "unconfirmed" }),
    ).toMatchObject({ status: "needs-confirmation", reason: "worker-unconfirmed" });
  });

  it.each([
    ["bad date", { ...youth, paymentDate: "bad" }],
    ["future employment", { ...youth, initialEligibleEmploymentDate: "2027-01-01" }],
    ["negative tax", { ...youth, incomeTaxBeforeReduction: -1 }],
    ["fractional used cap", { ...youth, annualReductionAlreadyUsed: 0.5 }],
    ["used cap above cap", { ...youth, annualReductionAlreadyUsed: 2_000_001 }],
  ])("rejects %s", (_name, input) => {
    expect(calculateSmeIncomeTaxReduction(input)).toMatchObject({ status: "invalid" });
  });
});
