# 2026 Year-End Tax Credit Estimator Plan

## Objective

Add a bounded year-end tax settlement estimator for early-career Korean workers that shows how pension-account and monthly-rent tax credits can affect the 100 million KRW plan without implying a guaranteed refund.

## Scope

- Use official 2026-facing NTS guidance for pension-account tax credit and monthly-rent tax credit.
- Estimate only tax-credit impact from user-entered values.
- Cap refund candidate at prepaid income tax because the dashboard does not calculate full final tax liability.
- Surface assumptions directly in the UI.
- Keep the calculator local-only and do not add network calls or logging.

## Implementation

- `src/lib/policies/kr/2026/year-end-tax-policy.ts`: policy constants and official sources.
- `src/lib/calculators/year-end-tax.ts`: pension-account and monthly-rent credit estimator.
- `src/features/dashboard/year-end-tax-calculator.tsx`: mobile-first dashboard UI with ten-thousand-won inputs and confirmation checkboxes.
- `src/features/dashboard/dashboard-overview.tsx`: calculator section integration.

## Verification

- Unit tests for credit rates, limits, eligibility exclusions, invalid inputs, and export surface.
- Component tests for rent confirmations and cumulative quick amounts.
- Full project verification before PR.
