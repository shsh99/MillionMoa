# 2026-07-24 usability summary polish

- Branch: `feat/finance-dashboard-usability-next`
- Harness: `create-plan`, `design-md-style-control`, `taste-skill`, and one read-only UX audit sub-agent.
- Scope: Improve input workspace scanability, mobile money input ergonomics, overdraft-style asset handling, expense tab density, and fintech color tokens.
- Implemented:
  - Added an input summary strip for monthly surplus, total assets, loan principal, and save status.
  - Changed signed money inputs to use a decimal-capable mobile keypad.
  - Allowed negative asset account balances while keeping loans, expenses, and income non-negative.
  - Converted expense list rows to rounded mobile-friendly cards and shortened expense tab totals.
  - Recalibrated wallet tokens away from purple-heavy UI toward blue/mint consumer finance styling.
- Deferred:
  - Draft-on-type validation for rate and loan term fields.
  - Further chart label and table accessibility improvements.
