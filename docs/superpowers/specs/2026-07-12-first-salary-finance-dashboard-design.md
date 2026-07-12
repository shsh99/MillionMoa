# First Salary Finance Dashboard Design

## Summary

This project is a login-based personal finance dashboard for early-career workers in Korea. The product helps users understand how their salary, spending, savings, investment allocation, and tax-advantaged accounts affect the time required to reach a major asset goal, with 100 million KRW as the default target.

The first version should feel like a comprehensive dashboard, but it will use manual user input rather than bank, card, or brokerage integrations. The product position is not a generic household ledger. It is a goal-centered financial planning tool that connects salary, monthly spending, savings products, investment accounts, and account-level cash management to a clear question: "How long until I reach 100 million KRW?"

## Goals

- Let users create an account and save their personal finance data.
- Estimate monthly take-home pay from annual salary, with an option to override the estimate manually.
- Track current assets, monthly income, fixed costs, variable spending, emergency cash, and investable monthly surplus.
- Model account and product allocation across CMA, parking account, savings deposit, ISA, IRP, and general investment accounts.
- Calculate the estimated time required to reach 100 million KRW or a custom goal amount.
- Show conservative, base, and optimistic scenarios based on different annual return assumptions.
- Estimate year-end tax settlement outcomes, including expected refund or additional payment.
- Estimate tax credits, tax reductions, and tax-advantaged account effects for pension savings, IRP, ISA transfer-to-pension scenarios, and small-business employee income tax reduction.
- Simulate how bonuses, dividends, refunds, and other surplus cash affect the 100 million KRW timeline.
- Provide a simple household ledger for manual income and expense tracking.
- Show monthly reports for net worth, spending, saving rate, and target completion timeline.

## Non-Goals For MVP

- No automatic bank, card, brokerage, or open banking integration.
- No real-time financial product scraping.
- No product sales, brokerage execution, or buy/sell order features.
- No personalized financial, tax, or investment advice beyond user-controlled simulations.
- No highly precise tax filing calculator. Tax and payroll deductions are estimates and should be labeled as such.
- No official year-end tax filing replacement. The app estimates refund or additional payment for planning, but users must verify through Hometax or a tax professional.
- No automated personalized investment recommendation. The app can compare user-defined allocation scenarios, but should not tell the user that a specific product is the right investment for them.
- No multi-user household collaboration in the first version.

## Target User

The primary user is a Korean early-career worker who has started receiving a regular salary and wants to build assets systematically. They may know that products like CMA, parking accounts, ISA, IRP, savings deposits, and ETFs exist, but they need a practical way to decide how much money goes where each month.

The product should reduce confusion by turning many inputs into a small number of operational metrics:

- Current net worth
- Monthly take-home pay
- Monthly spending
- Monthly investable surplus
- Saving rate
- Estimated target date
- Months shortened or delayed by changing spending and contribution assumptions
- Estimated year-end refund or additional tax payment
- Suggested allocation scenarios for surplus cash, framed as simulations rather than advice
- Total acceleration amount from interest, dividends, tax refund, tax credits, bonus income, and reduced spending
- Fastest estimated path to the 100 million KRW goal under user-selected constraints

## Product Approach

The selected approach is a goal-centered MVP with a comprehensive dashboard interface.

The app will include the major areas users expect from an all-in-one finance service, but every area should connect back to the asset goal. This keeps the product coherent while still allowing salary calculation, account planning, cash management, and household ledger features to exist from the first version.

The core product engine is the 100 million KRW acceleration planner. It should aggregate every source of additional money or saved money that can shorten the goal timeline:

- monthly investable surplus from salary,
- unused living expense budget,
- parking account and CMA interest,
- savings deposit interest,
- ISA tax savings and investment return,
- pension savings and IRP tax credit,
- small-business employee income tax reduction,
- year-end tax refund,
- performance bonus and other one-time income,
- dividends and reinvested dividends,
- spending reductions by category.

The planner should not output one deterministic "best investment." It should output ranked scenarios based on user constraints such as liquidity need, risk level, tax-credit capacity, account contribution limits, and emergency fund target.

## Core User Flow

1. User signs up or logs in.
2. User creates a financial profile:
   - Annual salary
   - Optional actual monthly take-home pay
   - Monthly fixed costs
   - Expected monthly variable spending
   - Current assets
3. User confirms the default goal of 100 million KRW or sets a custom goal.
4. User registers financial accounts or products:
   - CMA or parking account
   - Savings deposit
   - ISA
   - IRP
   - General investment account
5. User sets monthly contribution amounts and expected annual return for each account.
6. Dashboard calculates:
   - Monthly investable surplus
   - Estimated target completion date
   - Conservative, base, and optimistic scenarios
   - Effect of reducing spending or increasing monthly contribution
7. User records income and expenses in the household ledger.
8. User enters expected year-end tax settlement items, bonuses, dividends, and other surplus cash.
9. Dashboard compares where that surplus could go: emergency cash, CMA/parking account, savings deposit, ISA, pension savings/IRP, or general investment.
10. Monthly report shows whether the target date is moving closer or farther away.

## Screens

### 1. Dashboard

The dashboard is the first screen after login. It should show the user's current financial state and goal progress without requiring navigation.

Primary metrics:

- Current assets
- Goal amount
- Remaining amount
- Estimated target date
- Monthly saving rate
- Monthly investable surplus
- This month's remaining living budget

Supporting panels:

- Asset allocation by account type
- Monthly cash flow summary
- Scenario comparison
- Year-end refund/additional payment estimate
- Bonus and surplus cash allocation simulator
- Expected dividend income summary
- Recent ledger entries
- Recommended next action generated from calculations, such as reducing monthly spending by a specific amount or increasing monthly contribution.

### 2. Salary And Tax Calculator

This screen lets users estimate take-home pay.

Inputs:

- Annual salary
- Non-taxable monthly income
- Number of dependents
- Actual monthly take-home pay override

Outputs:

- Estimated gross monthly pay
- Estimated deductions
- Estimated monthly take-home pay

The app should clearly show when the value is estimated and allow the user to use their actual payroll amount instead.

### 3. Goal Simulator

This is the product's main calculation surface.

Inputs:

- Current assets
- Goal amount
- Monthly contribution
- Account allocation
- Expected annual return per account
- Scenario return adjustments

Outputs:

- Months to goal
- Estimated target date
- Total contribution
- Estimated investment gain
- Scenario comparison
- Impact of spending changes

The simulator should support the default 100 million KRW goal and custom goals.

### 4. Fastest Path Planner

This screen turns the whole app into an actionable 100 million KRW plan. It combines salary surplus, account allocation, tax refund, tax credits, bonuses, interest, dividends, and spending changes into ranked scenarios.

Inputs:

- Current assets
- Monthly investable surplus
- Current account balances
- Account contribution limits
- Emergency fund target
- Liquidity requirement
- Risk preference
- Expected annual return by account
- Parking account/CMA interest rules
- Expected dividend income
- Expected bonus or surplus events
- Expected year-end refund or additional payment
- Remaining pension savings/IRP tax credit capacity
- ISA contribution capacity and tax-saving assumptions
- Budget category reduction candidates

Outputs:

- Fastest estimated date to 100 million KRW
- Base plan using current behavior
- Optimized scenario using user-selected constraints
- Timeline improvement from each source:
  - spending reduction
  - parking/CMA interest
  - savings deposit interest
  - ISA tax saving and return
  - pension/IRP tax credit
  - small-business income tax reduction
  - tax refund
  - bonus
  - dividends
- Contribution order for the current month
- Warning when a scenario uses illiquid retirement accounts, high-risk return assumptions, or unverified tax eligibility
- Explanation of why each scenario is faster, framed as simulation rather than advice

Scenario examples:

- Conservative: emergency fund first, parking/CMA and savings deposits, limited investment risk.
- Balanced: emergency fund target, ISA contribution, pension/IRP tax-credit capacity, general investment.
- Aggressive: lower cash buffer and higher expected return assumptions, clearly marked as higher risk.
- Tax-first: pension/IRP and eligible tax benefits prioritized before general investment.

### 5. Account Flow Planner

This screen models money movement from salary to buckets and accounts.

Inputs:

- Payday
- Monthly take-home pay
- Fixed-cost account
- Living-expense account
- Emergency fund/CMA account
- Savings deposit account
- ISA account
- pension savings/IRP account
- general investment account
- month-end sweep rule for remaining cash

Outputs:

- Monthly account split
- Amount left unassigned
- Cash flow warnings
- Estimated impact on the 100 million KRW target
- Month-end leftover transfer scenario

### 6. Year-End Tax Settlement Planner

This screen estimates whether the user may receive a refund or owe additional tax at year end. It should be framed as a planning estimate, not an official filing calculation.

Inputs:

- Annual gross salary
- Estimated annual tax withheld
- Social insurance deductions
- Pension savings contribution
- IRP contribution
- ISA maturity transfer to pension account, if any
- Small-business employee income tax reduction eligibility
- Monthly rent, insurance, medical, education, donation, and other supported credit inputs
- Credit/debit card and cash receipt spending inputs for income deduction scenarios

Outputs:

- Estimated final income tax
- Estimated local income tax
- Estimated refund or additional payment
- Contribution room remaining for pension savings and IRP tax credit
- Small-business employee income tax reduction estimate
- Warning when user-entered values require official Hometax verification

### 7. Tax-Advantaged Account Planner

This screen compares tax effects across account types.

Account logic:

- Pension savings and IRP: calculate tax credit based on contribution amount, statutory limits, and income bracket.
- ISA: calculate tax-free amount, separated taxation effect, and account-level profit/loss offset. Do not label normal ISA benefit as a tax credit.
- ISA to pension transfer: estimate additional pension tax credit when an ISA matures and eligible funds are transferred to a pension account.
- Small-business employee income tax reduction: estimate income tax reduction for eligible youth, senior, disabled, or career-interrupted workers.

Outputs:

- Estimated tax benefit by account
- Remaining annual contribution capacity
- Liquidity warning for retirement accounts
- Rule version and source label

### 8. Bonus And Surplus Cash Simulator

This screen helps users compare how to allocate performance bonuses, tax refunds, cash gifts, or other surplus money.

Inputs:

- Surplus amount
- Date received
- Intended liquidity need
- Allocation scenario across emergency fund, CMA/parking account, savings deposit, ISA, pension savings/IRP, and general investment
- Expected annual return and dividend yield per allocation bucket

Outputs:

- One-time impact on 100 million KRW timeline
- Future value estimate
- Expected annual dividend or interest income
- Estimated tax effect where applicable
- Liquidity and risk labels

### 9. Dividend And Income Projection

This screen estimates passive income from user-entered holdings or account-level dividend yield assumptions.

Inputs:

- Holding name or account name
- Current value
- Expected dividend yield
- Payment frequency
- Tax treatment assumption
- Reinvestment toggle

Outputs:

- Expected annual dividend
- Expected monthly average dividend
- After-tax dividend estimate
- Reinvested dividend impact on goal timeline

### 10. Account And Product Management

Users can create account records for:

- CMA
- Parking account
- Savings deposit
- ISA
- IRP
- General investment account
- Other manual account

Each account should store:

- Account name
- Account type
- Current balance
- Monthly contribution
- Expected annual return
- Tax-advantaged flag
- Tax treatment type, such as taxable, ISA, pension, IRP, tax-free, or user-defined
- Dividend yield
- Liquidity purpose, such as living expenses, emergency fund, long-term investment, or retirement.

### 11. Living Expense Management

This screen manages practical monthly cash flow.

Features:

- Monthly budget
- Fixed costs
- Variable spending
- Emergency fund target
- CMA or parking account balance for living expenses
- Remaining budget for the current month

The goal is to help the user separate spending money from long-term investing money.

### 12. Household Ledger

The first version uses manual entry only.

Entry fields:

- Date
- Type: income or expense
- Amount
- Category
- Account
- Memo

Outputs:

- Monthly income total
- Monthly expense total
- Spending by category
- Remaining monthly budget

### 13. Reports

Reports show changes over time.

Charts:

- Monthly net worth
- Monthly spending
- Monthly saving rate
- Monthly contribution
- Target completion date trend
- Asset allocation by account type
- Tax benefit by category
- Bonus and surplus cash usage
- Dividend and interest income trend
- Fastest path scenario trend
- Timeline improvement by source

## Data Model

### User

Stores authentication identity and basic profile data.

Fields:

- id
- email
- displayName
- createdAt
- updatedAt

### FinancialProfile

Stores user-level salary and cash flow assumptions.

Fields:

- id
- userId
- annualSalary
- nonTaxableMonthlyIncome
- dependentCount
- estimatedMonthlyTakeHome
- actualMonthlyTakeHome
- useActualTakeHome
- monthlyFixedCost
- monthlyVariableBudget
- emergencyFundTarget
- createdAt
- updatedAt

### Goal

Stores asset goals.

Fields:

- id
- userId
- name
- targetAmount
- startingAmount
- startDate
- targetDateEstimate
- isPrimary
- createdAt
- updatedAt

### Account

Stores manually entered account or product balances.

Fields:

- id
- userId
- name
- type
- currentBalance
- monthlyContribution
- expectedAnnualReturn
- expectedDividendYield
- taxAdvantaged
- taxTreatmentType
- liquidityPurpose
- createdAt
- updatedAt

### TaxProfile

Stores year-end tax settlement assumptions.

Fields:

- id
- userId
- taxYear
- annualGrossSalary
- annualTaxWithheld
- dependentCount
- pensionSavingsContribution
- irpContribution
- isaToPensionTransferAmount
- smallBusinessReductionEligible
- smallBusinessReductionType
- monthlyRentPaid
- insurancePaid
- medicalPaid
- educationPaid
- donationPaid
- creditCardSpending
- debitCardSpending
- cashReceiptSpending
- createdAt
- updatedAt

### YearEndTaxScenario

Stores a specific year-end settlement simulation result. The app must not equate total credits with refund amount; refund depends on final tax compared with tax already withheld.

Fields:

- id
- userId
- taxProfileId
- policyVersionId
- name
- estimatedDeterminedTax
- annualTaxWithheld
- estimatedRefundAmount
- estimatedAdditionalPayment
- taxableIncomeEstimate
- taxCreditTotal
- taxReductionTotal
- incomeDeductionTotal
- createdAt
- updatedAt

### TaxBenefitEstimate

Stores calculated tax benefit snapshots.

Fields:

- id
- userId
- taxYear
- policyVersionId
- estimatedFinalIncomeTax
- estimatedLocalIncomeTax
- estimatedRefundOrAdditionalPayment
- pensionTaxCredit
- irpTaxCredit
- isaTaxSavings
- isaToPensionAdditionalCredit
- smallBusinessIncomeTaxReduction
- createdAt
- updatedAt

### TaxAdvantagedContribution

Stores annual contributions to tax-advantaged accounts.

Fields:

- id
- userId
- taxYear
- accountId
- accountType
- contributionAmount
- taxCreditEligibleAmount
- contributionDate
- createdAt
- updatedAt

### IsaProfile

Stores ISA-specific assumptions and eligibility. Middle-brokerage ISA is an ISA operating type and should still use ISA tax-benefit logic, not ordinary tax-credit logic.

Fields:

- id
- userId
- accountId
- isaType
- isMiddleBrokerage
- openedAt
- maturityDate
- mandatoryHoldingPeriodMonths
- annualContributionLimit
- totalContributionLimit
- taxFreeProfitLimit
- separatedTaxRate
- createdAt
- updatedAt

### SmeIncomeTaxReliefProfile

Stores small-business employee income tax reduction assumptions.

Fields:

- id
- userId
- employerName
- employmentStartDate
- reliefType
- birthDate
- militaryServiceMonthsDeducted
- companyEligibilityConfirmed
- industryEligibilityConfirmed
- reliefStartDate
- reliefEndDate
- reliefRate
- annualCap
- createdAt
- updatedAt

### BonusIncomeEvent

Stores performance bonus or other earned one-time income events.

Fields:

- id
- userId
- name
- paymentDate
- grossAmount
- estimatedWithholdingTax
- estimatedSocialInsuranceImpact
- estimatedNetAmount
- includedInAnnualSalary
- createdAt
- updatedAt

### SurplusCashScenario

Stores bonus, refund, dividend, or other surplus allocation scenarios.

Fields:

- id
- userId
- name
- sourceType
- amount
- receivedDate
- emergencyFundAllocation
- cmaAllocation
- savingsDepositAllocation
- isaAllocation
- pensionOrIrpAllocation
- generalInvestmentAllocation
- expectedAnnualReturn
- expectedDividendYield
- estimatedGoalMonthsReduced
- createdAt
- updatedAt

### FastestPathScenario

Stores a ranked scenario for reaching the primary asset goal as quickly as possible within user-selected constraints.

Fields:

- id
- userId
- goalId
- name
- scenarioType
- liquidityRequirement
- riskLevel
- emergencyFundTarget
- startingAssets
- monthlySalarySurplus
- monthlySpendingReduction
- monthlyInterestIncome
- monthlyDividendIncome
- monthlyTaxBenefitValue
- oneTimeBonusAmount
- oneTimeTaxRefundAmount
- isaContribution
- pensionOrIrpContribution
- generalInvestmentContribution
- savingsDepositContribution
- cmaOrParkingContribution
- estimatedGoalDate
- estimatedMonthsToGoal
- monthsReducedVsBase
- assumptionsSummary
- warnings
- createdAt
- updatedAt

### AccelerationContribution

Stores how much each source contributes to shortening the 100 million KRW timeline in a scenario.

Fields:

- id
- scenarioId
- sourceType
- sourceName
- amount
- frequency
- estimatedAnnualValue
- estimatedMonthsReduced
- confidence
- createdAt
- updatedAt

### DividendHolding

Stores user-entered dividend assumptions.

Fields:

- id
- userId
- accountId
- holdingName
- quantity
- currentValue
- expectedDividendPerShare
- expectedDividendYield
- paymentFrequency
- taxTreatmentType
- reinvestDividends
- createdAt
- updatedAt

### PolicyConfig

Stores versioned policy values and their source.

Fields:

- id
- policyGroup
- policyKey
- value
- unit
- effectiveFrom
- effectiveTo
- sourceName
- sourceUrl
- confidence
- createdAt
- updatedAt

### Transaction

Stores household ledger entries.

Fields:

- id
- userId
- accountId
- date
- type
- category
- amount
- memo
- createdAt
- updatedAt

### MonthlySnapshot

Stores monthly rollups for reports.

Fields:

- id
- userId
- yearMonth
- netWorth
- income
- expense
- contribution
- savingRate
- estimatedGoalDate
- createdAt
- updatedAt

## Calculation Engine

Calculation logic should be isolated from UI components.

Required calculators:

- Salary calculator: estimates monthly take-home pay from annual salary and payroll assumptions.
- Cash flow calculator: calculates income, fixed costs, variable spending, and investable surplus.
- Compound goal calculator: calculates months to target using current assets, monthly contributions, and monthly return.
- Account allocation calculator: aggregates expected return across multiple accounts and contribution plans.
- Scenario calculator: calculates conservative, base, and optimistic projections.
- Spending impact calculator: shows how a spending reduction or contribution increase changes the goal date.
- Tax-benefit estimator: estimates high-level ISA and IRP benefit separately from investment return.
- Year-end tax settlement estimator: estimates refund or additional payment based on determined tax, withheld tax, deductions, reductions, and credits. Refund must be capped by tax already withheld unless a specific refundable credit exists.
- Pension and IRP tax credit calculator: calculates pension savings and IRP tax credit using income bracket, contribution limits, and remaining capacity.
- ISA tax effect calculator: calculates tax-free and separated-tax benefit, and clearly separates this from tax credit logic.
- ISA-to-pension transfer calculator: estimates additional tax credit where eligible after ISA maturity transfer to a pension account.
- Small-business employee income tax reduction calculator: estimates eligible income tax reduction using user type, employment date, reduction period, rate, and annual cap.
- Bonus cash flow calculator: estimates bonus withholding, net bonus cash, and year-end reconciliation impact separately.
- Surplus cash allocation calculator: compares one-time bonus/refund/cash allocation scenarios and resulting goal timeline change.
- Dividend income calculator: estimates gross, after-tax, and reinvested dividend impact and warns when financial income may require additional tax review.
- Fastest path optimizer: ranks user-controlled scenarios by estimated months to goal while respecting liquidity, risk, contribution limits, tax eligibility, and emergency fund constraints.
- Acceleration attribution calculator: decomposes goal timeline improvement by source so users can see which actions shorten the path most.

The tax-benefit estimator should be conservative and clearly labeled as an estimate. The product should avoid presenting tax calculations as official tax advice.

## Policy Configuration

Policy-sensitive values must be stored in a versioned policy configuration rather than scattered through application code.

Required policy groups:

- payroll withholding table version
- social insurance rates and caps
- pension savings and IRP tax credit limits and rates
- ISA annual limit, total limit, tax-free amount, and separated tax rate
- ISA-to-pension transfer additional credit rules
- small-business employee income tax reduction rates, periods, eligibility types, and annual cap
- dividend withholding assumptions and financial-income warning thresholds
- special tax credit rates for supported year-end tax categories
- local income tax assumptions

Each calculation result should store or expose the policy version used. This makes later rule changes auditable.

## Architecture

Recommended stack:

- Next.js for frontend and backend routes
- Supabase PostgreSQL for persistent data
- Prisma for database modeling and migrations
- Supabase Auth for authentication
- Recharts for charts
- Tailwind CSS for styling
- Vercel for deployment

Recommended module boundaries:

- `app`: pages, layouts, and route-level composition
- `components`: reusable UI components
- `features/dashboard`: dashboard-specific components and queries
- `features/profile`: salary and financial profile forms
- `features/simulator`: goal and scenario simulator
- `features/fastest-path`: ranked 100 million KRW acceleration scenarios
- `features/paycheck-planner`: salary-to-account flow and monthly bucket allocation
- `features/accounts`: account and product management
- `features/tax-planner`: year-end tax settlement, tax credits, reductions, and tax-advantaged account effects
- `features/surplus`: bonus, refund, dividend, and surplus cash allocation scenarios
- `features/ledger`: household ledger
- `features/reports`: charts and monthly reports
- `lib/calculators`: pure financial calculation functions
- `lib/calculators/fastest-path`: scenario ranking and acceleration attribution
- `lib/calculators/cash-allocation`: salary split, cash buckets, and sweep rules
- `lib/policies`: versioned policy configuration and lookup helpers
- `lib/db`: database client and query helpers
- `lib/auth`: authentication configuration

Calculators should be pure functions with unit tests. UI components should call calculators through feature-level helpers rather than embedding financial formulas directly in React components.

## Error Handling And Safety

- Reject negative amounts where they do not make sense.
- Validate percentages with clear min and max ranges.
- Let users manually override estimated salary values.
- Mark estimates as estimates.
- Do not call ISA benefits "tax credit" unless the calculation is specifically an eligible ISA-to-pension transfer credit.
- Do not present allocation scenarios as personalized investment advice.
- Do not present the "fastest" scenario as universally best. Fastest only means fastest under the user's selected constraints and assumptions.
- Do not equate tax credit amount with refund amount. Refund or additional payment is calculated from final determined tax compared with tax already withheld.
- Keep bonus withholding and year-end final tax settlement visibly separate.
- Show liquidity warnings for IRP and pension accounts.
- Show source/effective-date labels for tax and policy calculations.
- Show empty states for new users with no account or ledger data.
- Keep user financial data scoped by userId in every query.
- Avoid logging sensitive financial input.
- Use server-side validation for writes, not only client-side validation.

## MVP Implementation Phases

### Phase 1: Foundation

- Create Next.js app.
- Add authentication.
- Add PostgreSQL and Prisma.
- Define User, FinancialProfile, Goal, Account, Transaction, and MonthlySnapshot models.
- Create protected app shell after login.

### Phase 2: Core Dashboard

- Build dashboard layout.
- Add financial profile form.
- Add default 100 million KRW goal.
- Display current assets, saving rate, and estimated goal date.

### Phase 3: Calculation Engine

- Implement salary estimate calculator.
- Implement cash flow calculator.
- Implement compound goal calculator.
- Implement scenario calculator.
- Implement pension savings and IRP tax credit calculator.
- Implement ISA tax effect calculator.
- Implement small-business employee income tax reduction calculator.
- Implement year-end refund/additional-payment estimator.
- Implement bonus cash flow, surplus cash, and dividend income calculators.
- Implement fastest path optimizer and acceleration attribution calculator.
- Implement salary-to-account allocation and month-end sweep calculators.
- Add unit tests for calculators.

### Phase 4: Accounts And Allocation

- Add account CRUD.
- Support CMA, parking account, savings deposit, ISA, IRP, general investment, and manual account types.
- Calculate weighted expected return and monthly contribution total.
- Add cash bucket and paycheck allocation CRUD.
- Add parking/CMA interest rules for simple and tiered rates.

### Phase 5: Living Expense And Ledger

- Add living expense management.
- Add category-level living expense budgets.
- Add month-end leftover cash sweep scenarios.
- Add manual income and expense entries.
- Add category totals and monthly budget state.

### Phase 6: Reports

- Add charts for net worth, spending, saving rate, contribution, and target date trend.
- Add charts for estimated tax benefit, refund usage, surplus cash allocation, and dividend/interest income.
- Add monthly snapshot generation.

### Phase 7: Polish And Deployment

- Improve mobile responsiveness.
- Add onboarding empty states.
- Add validation and privacy copy.
- Deploy to Vercel.

## Testing Strategy

- Unit test all financial calculators.
- Test edge cases:
  - Zero current assets
  - Zero monthly contribution
  - Zero or negative return
  - Very high return
  - Goal already reached
  - Expenses greater than income
  - Refund estimate where withheld tax is lower than credits and reductions
  - ISA benefit not treated as ordinary tax credit
  - Small-business reduction capped by annual limit
  - Small-business reduction period expired or eligibility unchecked
  - Pension savings and IRP contribution above credit limit
  - Year-end refund capped by tax withheld unless refundable credit exists
  - Bonus withholding differs from year-end final tax
- Bonus allocated to illiquid retirement accounts
- Dividend yield of zero, negative, or unusually high values
- Fastest path scenario violates liquidity requirement
- Scenario contribution total exceeds income or account contribution limits
- Same tax benefit counted twice as both refund and monthly value
- Month-end leftover cash counted before it exists
- Add integration tests for user-scoped CRUD operations.
- Add basic end-to-end tests for signup, profile setup, account creation, paycheck allocation, ledger entry, dashboard calculation, year-end refund estimate, fastest path scenario, and surplus allocation scenario.

## Product Decisions For First Release

- Use Supabase Auth for email-based authentication.
- Use Supabase PostgreSQL as the first hosted database.
- Use Prisma for schema management and typed database access.
- Use estimated Korean payroll deductions only to the depth required for planning. The UI must label these values as estimates and let users override take-home pay.
- Use a fixed default category list for the first release. Custom categories can be added after the MVP if ledger usage shows demand.
- Treat ordinary ISA as a tax-saving account, not a tax-credit account. Only eligible ISA maturity transfer into pension accounts should appear in tax credit logic.
- Include small-business employee income tax reduction as an estimate with eligibility questions and annual cap handling.
- Include bonus, refund, and surplus cash allocation as scenario comparison, not as investment recommendation.
- Make the fastest path planner the central planning workflow. Other calculators feed into it rather than living as isolated tools.
- Require scenario constraints for fastest-path calculations: liquidity, risk level, emergency fund target, tax eligibility, and account contribution limits.

## Acceptance Criteria

- A new user can sign up, log in, and create a financial profile.
- The app can estimate or accept monthly take-home pay.
- The user can create a 100 million KRW asset goal.
- The user can add accounts and monthly contribution assumptions.
- The dashboard shows estimated time to goal.
- The simulator shows conservative, base, and optimistic scenarios.
- The app estimates year-end refund or additional payment using user-entered tax settlement assumptions.
- The app estimates pension savings/IRP tax credit capacity and effect.
- The app estimates ISA tax-saving effect without mislabeling it as ordinary tax credit.
- The app estimates small-business employee income tax reduction for eligible users.
- The app compares surplus cash allocation scenarios and shows goal timeline impact.
- The app estimates gross and after-tax dividend income from user-entered assumptions.
- The app ranks at least three 100 million KRW path scenarios and shows estimated months reduced versus the user's current behavior.
- The app shows which source, such as spending reduction, tax refund, bonus, interest, or dividend, contributed to the timeline improvement.
- The app prevents a fastest-path scenario from double-counting the same tax benefit or surplus cash event.
- The user can record manual income and expenses.
- The report screen shows at least one monthly asset or cash flow chart.
- All core calculators have unit tests.
