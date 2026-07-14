# Contribution Source Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure contribution source ledger that prevents monthly contribution double-counting across salary-day transfers, actual month-end sweeps, and scenario surplus inputs.

**Architecture:** Implement `calculateContributionSourceLedger` in `src/lib/calculators/contribution-source-ledger.ts`. The function groups contribution sources by month and rejects duplicate `month + sourceId` pairs before a scenario projection consumes the totals. It also tightens scenario account contribution validation in `allocation-return` so non-finite and decimal KRW values cannot leak into projections.

**Tech Stack:** TypeScript, Vitest.

---

## File Structure

- Create: `src/lib/calculators/contribution-source-ledger.ts`
  - Exports `consolidateContributionSources(input)`.
  - Uses integer KRW amounts only.
  - Returns month-level totals and source IDs.
  - Rejects duplicate source IDs within the same month.
- Create: `src/lib/calculators/contribution-source-ledger.test.ts`
  - Covers monthly grouping, duplicate rejection, cross-month reuse, empty input, invalid numbers, negative amounts, non-integer KRW, invalid month keys, and cash invariant cases.
- Update: `src/lib/calculators/allocation-return.ts`
  - Rejects non-finite and non-integer KRW balances/contributions.
- Update: `src/lib/calculators/allocation-return.test.ts`
  - Covers non-finite and non-integer KRW account inputs.

## Task 1: Contribution Source Ledger

**Files:**
- Create: `src/lib/calculators/contribution-source-ledger.test.ts`
- Create: `src/lib/calculators/contribution-source-ledger.ts`

- [x] **Step 1: Write the failing test**

Create tests for monthly source consolidation and duplicate rejection.

- [x] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/contribution-source-ledger.test.ts
```

Expected: fails because `./contribution-source-ledger` does not exist.

- [x] **Step 3: Create minimal implementation**

Implement validation, duplicate detection, monthly grouping, and explicit totals.

- [x] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/contribution-source-ledger.test.ts
```

Expected: all contribution source ledger tests pass.

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
git add docs/superpowers/plans/2026-07-14-contribution-source-ledger.md src/lib/calculators/contribution-source-ledger.ts src/lib/calculators/contribution-source-ledger.test.ts src/lib/calculators/allocation-return.ts src/lib/calculators/allocation-return.test.ts
git commit -m "feat: add contribution source ledger"
```

## Self-Review

- Spec coverage: Adds a guardrail for monthly source de-duplication before scenario projection.
- Double-counting guard: Duplicate source IDs are rejected per month while allowing the same recurring source in different months.
- Safety wording: The function returns neutral aggregation facts and does not recommend allocations.
- Type consistency: All money values are raw KRW numbers; display formatting remains outside the calculator.
