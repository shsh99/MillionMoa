# 2026-07-24 loan draft validation

- Branch: `feat/finance-dashboard-next-cycle`
- Scope: Improve loan rate and remaining-term input behavior without changing finance formulas.
- Design read: Mobile-first Korean finance input flow. Users should be able to clear a field, type a new number, and see validation only after leaving the field.
- Implemented:
  - Added draft-on-type number fields for loan annual rate and remaining months.
  - Empty or below-minimum drafts stay local and show inline errors on blur.
  - Above-maximum values clamp on blur to the existing model boundary.
  - Kept loan principal, income, and expense constraints unchanged.
- Verification focus:
  - TDD red/green on `FinanceScenarioEditor`.
  - Existing multi-loan, add/delete/undo, and immutable scenario tests remain covered.
