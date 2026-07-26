# Mobile Input Jump Actions

- Branch: `feat/finance-mobile-input-flow`
- Scope: reduce scrolling friction after an asset or loan is selected.
- Added compact action rows that move focus directly to the selected asset balance, monthly contribution, loan principal, or loan annual rate input.
- This keeps the existing editable fields and formulas unchanged while improving the mobile path to the most important money fields.
- Frontend UX sidecar recommended a future `세부 조건` disclosure pattern so name/category/rate/term fields can be collapsed by default on mobile.
- Guardrail: no calculator, storage, tax, or product-rate logic changed in this slice.
