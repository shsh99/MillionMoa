---
name: finance-calculation-design
description: "실수령액, 4대보험, 소득세, 연말정산 환급/추가납부, 중소기업 취업자 소득세 감면, 저축률, 월복리, 1억 최단경로, 1억 달성 기간, 월급 통장 쪼개기, 파킹통장/CMA 이자, ISA 절세, 연금저축/IRP 세액공제, 생활비 예산, 적금/투자 수익률, 성과급/여유자금 운용, 배당금 계산 로직을 설계하거나 구현할 때 반드시 사용한다."
---

# Finance Calculation Design

재무 계산은 UI와 분리된 순수 함수로 설계한다. 계산기는 사용자 결정을 돕는 시뮬레이션이며, 공식 세무 계산이나 투자 조언으로 보이게 만들지 않는다.

## Calculator Modules

- `salaryNetPayCalculator`: annual salary to estimated monthly take-home pay.
- `socialInsuranceCalculator`: national pension, health insurance, long-term care, employment insurance.
- `incomeTaxEstimator`: simplified monthly withholding estimate.
- `cashFlowCalculator`: income minus fixed cost, variable cost, and reserve.
- `goalTimelineCalculator`: months to target using current assets, monthly contribution, monthly return.
- `allocationReturnCalculator`: weighted account return and contribution allocation.
- `isaTaxBenefitCalculator`: ISA tax-free and separated-tax effect.
- `irpTaxCreditCalculator`: pension savings and IRP tax credit estimate.
- `spendingImpactCalculator`: timeline impact from spending changes.
- `yearEndTaxSettlementEstimator`: estimated final tax, refund, or additional payment.
- `smallBusinessIncomeTaxReductionCalculator`: small-business employee income tax reduction estimate.
- `isaToPensionTransferCreditCalculator`: additional tax credit estimate for eligible ISA maturity transfer to pension accounts.
- `surplusCashAllocationCalculator`: bonus, refund, and spare cash allocation scenario comparison.
- `dividendProjectionCalculator`: gross, after-tax, and reinvested dividend projection.
- `fastestPathOptimizer`: ranked scenarios for reaching 100 million KRW fastest under user constraints.
- `accelerationAttributionCalculator`: timeline improvement by source such as tax refund, interest, dividends, bonus, spending cuts, and account allocation.
- `cashBucketAllocator`: salary split into fixed costs, living expense, emergency fund, savings, ISA, IRP, and investment buckets.
- `parkingInterestCalculator`: gross and after-tax parking/CMA interest using simple, daily, monthly, or tiered-rate assumptions.

## Standard Inputs

Use explicit units:

- money: KRW integer.
- annualRate: decimal or percent, but never both in the same function.
- monthlyRate: derived from annualRate.
- months: integer.
- dates: ISO date string.

## Edge Cases

Every calculator must define behavior for:

- goal already reached,
- zero monthly contribution,
- negative cash flow,
- zero return,
- negative return,
- extremely high return,
- empty account list,
- missing actual take-home pay,
- policy version not found.
- tax withheld lower than calculated final tax,
- contribution above tax credit cap,
- ordinary ISA benefit incorrectly treated as a tax credit,
- small-business reduction period expired,
- bonus allocated to a restricted or illiquid account,
- dividend yield missing, zero, negative, or unusually high.
- fastest-path scenario double-counts tax benefits or surplus cash,
- scenario violates user liquidity or emergency-fund constraints,
- parking/CMA interest uses end balance when average balance is required.

## Tax Benefit Separation

Keep these concepts separate:

- Tax deduction: reduces taxable income.
- Tax credit: reduces calculated tax.
- Tax reduction/exemption: reduces tax under a special eligibility rule.
- Tax saving: compares tax treatment between account types.

Ordinary ISA benefits are tax-free amount, profit/loss offset, and separated taxation. Do not label them as tax credit unless the calculation is specifically an eligible ISA-to-pension transfer credit.

## Rounding

Round display values at the presentation boundary. Keep internal calculations as precise as practical. For money display, use whole KRW.

## Testing

Add unit tests for normal, boundary, and impossible input cases. Snapshot-like tests are acceptable for scenario tables, but formulas need explicit expected values.
