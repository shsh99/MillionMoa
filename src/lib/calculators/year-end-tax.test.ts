import { describe, expect, it } from "vitest";
import { calculateYearEndTaxCredits } from "./year-end-tax";

describe("calculateYearEndTaxCredits", () => {
  const base = {
    annualGrossPay: 48_000_000,
    prepaidIncomeTax: 2_000_000,
    pensionSavingsContribution: 6_000_000,
    retirementPensionContribution: 3_000_000,
    monthlyRentPaid: 600_000,
    rentHouseholdEligible: true,
    rentHousingEligible: true,
    rentContractEligible: true,
  };

  it("estimates pension and monthly-rent tax credits at the low-income rates", () => {
    expect(calculateYearEndTaxCredits(base)).toMatchObject({
      status: "estimated",
      pensionAccountCredit: 1_350_000,
      monthlyRentCredit: 1_224_000,
      totalCredit: 2_574_000,
      refundCandidate: 2_000_000,
      pensionAccount: {
        rate: 0.15,
        eligibleContribution: 9_000_000,
        remainingCapacity: 0,
      },
      monthlyRent: {
        status: "eligible-estimate",
        rate: 0.17,
        eligibleAnnualRent: 7_200_000,
      },
    });
  });

  it("uses the standard rates above 55 million KRW gross pay", () => {
    expect(
      calculateYearEndTaxCredits({
        ...base,
        annualGrossPay: 60_000_000,
        prepaidIncomeTax: 5_000_000,
      }),
    ).toMatchObject({
      status: "estimated",
      pensionAccountCredit: 1_080_000,
      monthlyRentCredit: 1_080_000,
      totalCredit: 2_160_000,
      refundCandidate: 2_160_000,
    });
  });

  it("caps pension savings and total pension-account eligible contributions", () => {
    const result = calculateYearEndTaxCredits({
      ...base,
      pensionSavingsContribution: 8_000_000,
      retirementPensionContribution: 8_000_000,
      monthlyRentPaid: 0,
    });

    expect(result).toMatchObject({
      status: "estimated",
      pensionAccountCredit: 1_350_000,
      pensionAccount: {
        eligiblePensionSavingsContribution: 6_000_000,
        eligibleRetirementPensionContribution: 3_000_000,
      },
    });
  });

  it("excludes monthly rent when gross pay or housing confirmations are not eligible", () => {
    expect(
      calculateYearEndTaxCredits({
        ...base,
        annualGrossPay: 81_000_000,
      }),
    ).toMatchObject({
      status: "estimated",
      monthlyRentCredit: 0,
      monthlyRent: { status: "not-eligible", reason: "gross-pay-over-limit" },
    });

    expect(
      calculateYearEndTaxCredits({
        ...base,
        rentHousingEligible: false,
      }),
    ).toMatchObject({
      status: "estimated",
      monthlyRentCredit: 0,
      monthlyRent: { status: "not-eligible", reason: "eligibility-unconfirmed" },
    });

    expect(
      calculateYearEndTaxCredits({
        ...base,
        rentContractEligible: false,
      }),
    ).toMatchObject({
      status: "estimated",
      monthlyRentCredit: 0,
      monthlyRent: { status: "not-eligible", reason: "eligibility-unconfirmed" },
    });
  });

  it("rejects invalid money inputs", () => {
    expect(calculateYearEndTaxCredits({ ...base, annualGrossPay: -1 })).toMatchObject({
      status: "invalid",
      reason: "invalid-money",
    });
    expect(calculateYearEndTaxCredits({ ...base, monthlyRentPaid: 0.5 })).toMatchObject({
      status: "invalid",
      reason: "invalid-money",
    });
  });
});
