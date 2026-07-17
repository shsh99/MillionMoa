# Modular Finance Toolkit and Expense Management Design

## Purpose

MillionMoa will become a mobile-first personal finance workspace for Korean early-career workers. The product must combine a friendly wallet-like interface with auditable calculations for salary, tax relief, year-end settlement, loans, youth savings products, housing subscription savings, and recurring expenses.

The first release uses 2026 assumptions. All tax and product-rate outputs are estimates, show their effective date, and remain editable where a user's actual contract can differ.

## Delivery Boundaries

The work is split into independently reviewable increments:

1. B-style visual system and shared money-entry controls.
2. Persistent finance scenario and categorized expense management.
3. Net salary and SME employment income-tax reduction calculators.
4. Year-end tax settlement estimator.
5. Expanded loan and youth financial-product calculators.
6. Cross-calculator application flow, final visualizations, and policy review.

Each increment must preserve a working dashboard and may be merged separately into `dev`.

## Information Architecture

The mobile navigation contains four destinations:

- Home: net worth, monthly cash flow, goal progress, account and loan summary, upcoming payments.
- Calculators: a modular list of salary, SME tax reduction, year-end settlement, loan, savings, and housing subscription tools.
- Accounts: asset accounts and youth financial products.
- Loans: multiple loans, repayment schedules, and payoff impact.

Expense management is reachable from Home's monthly cash-flow section and remains part of the canonical scenario rather than a standalone calculator.

## Visual Direction

Use the selected lilac-and-mint wallet direction.

- Page background: very pale lilac-gray, not a dark or monochrome slate field.
- Primary: muted lilac for selected navigation, primary summaries, and active controls.
- Positive: mint for income, savings, goal progress, and favorable deltas.
- Caution: soft coral for debt, deficits, destructive actions, and policy warnings.
- Surfaces: white or tinted white with 20-24px radii, restrained soft shadows, and clear spacing.
- Icons: Lucide icons in circular or squircle pastel containers. No emoji or text glyphs as production icons.
- Numbers: dark ink, tabular numerals, strong hierarchy, and explicit minus signs.
- Motion: short state transitions only, respecting reduced-motion preferences.

Rounded styling must not turn every region into a nested card. Page bands remain unframed; cards are reserved for summary objects, repeated accounts, expenses, calculator choices, and editors.

## Shared Money Entry

All money inputs use a single reusable contract:

- Store integer KRW values; present `만원` by default.
- Support direct numeric entry and cumulative `+10만`, `+50만`, `+100만`, and `+500만` actions.
- Show a Korean money preview such as `3천 2백만원` without replacing the exact numeric value.
- Provide clear, reset, duplicate, undo-delete, and recent-value reuse where relevant.
- Reject non-finite values and enforce domain-specific negative-value rules.
- Preserve input focus and selection during controlled updates.
- Keep touch targets at least 44px and expose accessible labels and live result announcements.

## Canonical Scenario and Persistence

One canonical scenario contains:

- Asset accounts and financial products.
- Loans and manual liabilities.
- Income sources.
- Categorized recurring and irregular expenses.
- Calculator results explicitly applied by the user.
- Policy version and product-rate effective dates.

Calculator forms use draft state. They do not modify the canonical scenario until the user selects `내 계획에 적용`. Applying a result creates a typed scenario change and shows exactly which income, tax, expense, asset, or loan fields will change.

Scenario data persists locally first with a versioned schema and migration boundary. Authentication-backed server persistence remains a later backend increment; local persistence must not imply cloud backup.

## Expense Management

Expenses have three top-level kinds:

- Fixed: housing, utilities, telecom, insurance, transportation, subscriptions, education, and other contractual costs.
- Living: food, transport, shopping, leisure, health, and user-defined categories.
- Irregular: annual fees, taxes, repairs, gifts, travel, and one-off spending.

Each category contains multiple expense items. An item includes:

- Name, category, and top-level kind.
- Amount and frequency: weekly, monthly, quarterly, annual, or one-time.
- Payment day or next payment date.
- Start and optional end date.
- Auto-renewal flag and optional note.

The model derives monthly and annual equivalents, category totals, fixed-versus-variable ratios, upcoming renewals, and the monthly non-loan expense used by the scenario. The UI supports card and table views, category collapse, sorting, search, item duplication, and undo-delete. Duplicate loan-like expenses trigger a warning before applying them to cash flow.

## Calculator Modules

### 2026 Net Salary

Inputs include annual or monthly gross pay, non-taxable monthly pay, dependents, children, employment type, and optional overrides for statutory rates. Outputs include estimated monthly take-home pay and an itemized table for national pension, health insurance, long-term care, employment insurance, income tax, and local income tax.

Policy constants must be isolated in a versioned module, sourced from official Korean authorities, and covered by boundary tests. The UI labels results as estimates because actual payroll withholding can differ.

### SME Employment Income-Tax Reduction

Supported eligibility types are youth, age 60 or older, disabled person, and career-interrupted worker. Youth is the default. Inputs include employment date, age or eligibility type, military-service adjustment where applicable, eligible wage income, calculated income tax before reduction, and prior reduction usage.

Outputs show eligible period, reduction rate, statutory cap, estimated reduction, and tax after reduction. The module must distinguish an income-tax reduction from an ordinary tax credit and must not reduce social insurance contributions.

### Year-End Tax Settlement

The estimator accepts gross salary, non-taxable income, pre-paid income tax, dependents, insurance, medical, education, donations, credit/debit card and cash-receipt spending, housing deductions, pension savings, and IRP contributions.

Results show the estimated final tax, expected refund or additional payment, and an itemized deduction and credit impact table. Missing optional fields equal zero. Legal ordering, thresholds, phase-outs, and caps belong in the policy module, not UI components. The result must avoid equating a deduction amount, credit amount, and refund.

### Loans

Multiple loans support credit, overdraft, student, jeonse, mortgage, auto, card, and other categories. Terms include principal, rate, remaining term, grace period, repayment method, fees, and optional planned prepayments. Supported schedules include equal payment, equal principal, and bullet repayment.

Outputs show monthly payment, principal and interest split, total interest, outstanding balance, payoff date, and effect on goal timing. Every principal movement must be counted exactly once in cash and net-worth projections.

### Youth Savings and Housing Subscription

Product presets contain a product name, base rate, optional public contribution rule, tax treatment note, term, payment limits, and effective date. Users can override the actual base and preferential rates from their contract.

Outputs show contributions, gross interest, estimated tax, public contribution when supported, net maturity proceeds, and effective annualized return. Youth housing subscription savings use the same rate-input contract but remain a distinct product category with its own limits and policy note.

## Data Sources and Policy Safety

Before implementing policy constants, verify current 2026 rules against official primary sources such as the National Tax Service, Ministry of Economy and Finance, National Health Insurance Service, National Pension Service, Ministry of Employment and Labor, Financial Services Commission, and official product notices.

Every policy dataset records:

- Policy year and effective date.
- Source name and URL in developer documentation.
- Last verification date.
- Assumptions and unsupported edge cases.

The product does not claim tax filing accuracy, product availability, guaranteed returns, or personalized investment advice.

## Error and Empty States

- Invalid or incomplete required values produce field-level errors without clearing other fields.
- Unsupported policy cases produce an explicit `직접 확인 필요` result rather than a fabricated number.
- Empty account, loan, expense, and calculator states provide one clear add action.
- Persistence parse or migration failures fall back to a recoverable sample scenario and surface a non-destructive notice.
- Calculator application shows a preview and never silently overwrites scenario data.

## Testing and Review

- Pure unit tests for every calculation formula, limit, threshold, repayment boundary, and negative scenario.
- Contract tests for policy datasets and effective dates.
- Component tests for cumulative quick amounts, Korean previews, draft isolation, apply confirmation, category operations, and keyboard navigation.
- Integration tests proving calculator results update the canonical scenario exactly once.
- Financial calculation review and privacy-safety review before each policy calculator merge.
- Browser QA at mobile and desktop widths, including overflow, chart rendering, contrast, focus order, and 44px targets.
- Full test, lint, typecheck, production build, and diff checks before PR creation.

## Acceptance Criteria

- The selected lilac-and-mint visual language is consistent across shell, summary, forms, accounts, expenses, charts, and tables.
- Users can manage multiple assets, loans, and categorized expenses without one long undifferentiated page.
- Quick amount actions are cumulative and direct inputs remain easy to edit.
- Each calculator has itemized inputs, outputs, assumptions, and an explicit apply step.
- Home cash flow and goal projections use the canonical scenario without double counting.
- Negative net worth and deficits remain valid states.
- All 2026 policy values are traceable to official sources and visibly labeled as estimates.
