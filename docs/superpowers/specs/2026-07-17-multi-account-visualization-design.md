# Multi-Account Finance Visualization Design

## Goal

Support multiple asset accounts and multiple loans without hiding negative net worth or cash-flow deficits, then visualize the resulting financial position with production-grade charts and comparison tables.

## Canonical Scenario

- Asset accounts have an id, name, category, balance, optional annual rate, optional maturity month, and optional monthly contribution.
- Loans have an id, name, category, outstanding principal, annual rate, remaining months, and repayment method.
- Repayment methods are equal-payment, equal-principal, and bullet repayment.
- Income and expense categories remain repeatable line items.
- Amount inputs are unsigned. Asset/liability/income/expense meaning supplies the accounting sign.

## Accounting Rules

- Total assets are the sum of all asset account balances.
- Total liabilities are the sum of all outstanding loan and manual liability balances, with each balance counted once.
- Net worth equals total assets minus total liabilities and may be negative.
- Monthly surplus equals income minus non-loan expenses minus the sum of calculated loan payments and may be negative.
- Goal calculations clamp only the monthly contribution passed into calculators that require non-negative contributions.
- Charts preserve negative values and show a visible zero baseline.

## Visual Structure

- Net-worth projection: line chart comparing the baseline and debt-adjusted path to 100 million KRW.
- Monthly flow: horizontal or vertical bars for income, expenses, loan repayment, and resulting surplus, including negative surplus.
- Asset composition: donut chart for positive account balances with a separate liability total; when assets are zero, show an explicit empty state rather than an empty chart.
- Loan table: one row per loan with repayment method, principal, rate, monthly payment, total interest, and goal delay contribution.
- Account lists use category icons and soft 16px surfaces. Charts use one mint accent, a restrained violet comparison color, amber debt, and neutral grid lines.

## Interaction

- Users can add, edit, remove, and undo individual asset accounts and loans.
- Each quick-amount button remains cumulative.
- Chart legends and tooltips expose full Korean labels and formatted KRW values.
- Tabs select overview, assets, cash flow, loans, and assumptions without extending all details at once.

## Accessibility And Responsive Behavior

- Every chart has an adjacent text summary or table conveying the same values.
- Color is not the only differentiator; labels, line styles, and signs are present.
- At 390px, charts use stable aspect ratios and never create horizontal page overflow.
- Financial values wrap and never truncate.
- Reduced-motion users receive static charts and transitions.

## Scope

- Local in-memory scenario state only in this phase.
- Maturity transfers are represented in projection inputs but automatic bank synchronization is out of scope.
- Tax and investment recommendations are out of scope.
