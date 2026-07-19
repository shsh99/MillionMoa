# Financial Product Policy Guide Iteration

- Branch: `feat/finance-ux-next-iteration`
- Harness: finance-dashboard-orchestrator with UI, calculator, and policy-safety scopes.
- Sources checked on 2026-07-19: NTS income tax and SME reduction pages, Kinfa youth savings/leap pages, MOLIT youth housing dream account page, FSC ISA policy Q&A.
- Implementation focus: separate official product conditions from user-entered interest/profit assumptions, so the UI does not present assumed rates as policy facts.
- Subagents: none created in this iteration; the work was kept local because the user asked to clean up prior subagent accumulation.

## Verification

- `npm test -- src/features/dashboard/financial-product-guide.test.tsx src/lib/calculators/financial-products.test.ts`
- `npm run typecheck`
