# Net Salary and SME Reduction Implementation Plan

## Goal

Add a 2026 Korean employee take-home-pay calculator that itemizes social insurance and withholding, supports confirmed SME employee income-tax reduction, and applies the reviewed result to the finance scenario only after explicit confirmation.

## Policy Boundary

- Version 2026 pension, health, long-term-care, employment-insurance, local-income-tax, and SME reduction constants with official source metadata.
- Select pension contribution bounds by payment date because they change on 2026-07-01.
- Treat current taxable pay as an estimate for insurance bases, while allowing each assessed base to be overridden.
- Accept the NTS simplified-table result or payslip income tax as an explicit input until the full official table dataset is shipped. Never approximate monthly withholding from annual brackets.
- Label all results as estimates and keep bonuses, employer eligibility, industry eligibility, and exceptional military re-employment cases outside automatic determination.

## Implementation

1. Add pure payroll and SME reduction calculators with boundary, cap, date, rounding, and invalid-input tests.
2. Add a mobile-first calculator surface with annual/monthly salary modes, additive money shortcuts, optional advanced insurance bases, reduction eligibility controls, and an itemized result.
3. Require `내 계획에 적용` before replacing canonical monthly income and show the before/after amount.
4. Add component tests for input convenience, reduction behavior, and single explicit application.
5. Run policy, calculation, privacy, accessibility, desktop, and mobile reviews before integration.

## Verification

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Browser QA at 390x844 and 1440x900

