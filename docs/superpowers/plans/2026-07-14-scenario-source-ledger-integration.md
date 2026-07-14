# Scenario Source Ledger Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a source-ledger-backed scenario projection adapter that prevents duplicate or cross-month contribution sources before projecting the 100 million KRW timeline.

**Architecture:** Implement `calculateSourceBackedScenarioProjection` in `src/lib/calculators/scenario-source-projection.ts`. The function accepts account balances/return assumptions plus contribution source rows for a single month, validates all sources through `calculateContributionSourceLedger`, rejects sources outside the requested month, converts validated source totals to account monthly contributions, then calls `calculateScenarioProjection`.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/scenario-source-projection.ts`
  - Exports `calculateSourceBackedScenarioProjection(input)`.
  - Uses source rows as the only source of monthly contribution amounts.
  - Rejects duplicate `month + sourceId` pairs across all accounts.
  - Rejects source rows outside the requested projection month.
- Create: `src/lib/calculators/scenario-source-projection.test.ts`
  - Covers projection from source-backed accounts, duplicate source rejection across accounts, source month mismatch, invalid source amount pass-through, and no-progress propagation.

## Task 1: Source-Ledger-Backed Scenario Projection

**Files:**
- Create: `src/lib/calculators/scenario-source-projection.test.ts`
- Create: `src/lib/calculators/scenario-source-projection.ts`

- [x] **Step 1: Write the failing test**

Create tests for projection with monthly contribution sources and double-counting rejection.

- [x] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/scenario-source-projection.test.ts
```

Expected: fails because `./scenario-source-projection` does not exist.

- [x] **Step 3: Create minimal implementation**

Implement source flattening, ledger validation, month mismatch rejection, account conversion, and projection delegation.

- [x] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/scenario-source-projection.test.ts
```

Expected: all source-backed projection tests pass.

- [x] **Step 5: Full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands exit with code 0. `npm run build` may print the known Next workspace-root warning caused by the parent `C:\Users\ggg99\package-lock.json`.

- [x] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-07-14-scenario-source-ledger-integration.md src/lib/calculators/scenario-source-projection.ts src/lib/calculators/scenario-source-projection.test.ts
git commit -m "feat: add source-backed scenario projection"
```

## Self-Review

- Spec coverage: Connects contribution source ledger to scenario projection without breaking existing projection callers.
- Double-counting guard: Duplicate source IDs are rejected across accounts for the same month before projection.
- Month guard: Cross-month source rows are rejected rather than silently aggregated into one monthly projection.
- Safety wording: The function returns neutral projection facts and does not recommend accounts or products.
