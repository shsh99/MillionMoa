# Multi-Account Finance Visualization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add repeatable asset accounts and loans, aggregate their signed financial impact, and present the result through accessible charts and a loan comparison table.

**Architecture:** Introduce a pure scenario model for accounts, loans, repayment calculations, and chart-ready projections. The dashboard owns the canonical scenario while focused editors update individual entities. Recharts components consume derived data only and provide equivalent text summaries.

**Tech Stack:** TypeScript, React 19, Next.js 15, Recharts, Lucide React, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Multi-Account And Multi-Loan Model

**Files:**
- Create: `src/features/dashboard/finance-scenario-model.ts`
- Create: `src/features/dashboard/finance-scenario-model.test.ts`

- [ ] Add failing tests for multiple assets, negative net worth, multiple loans, and all three repayment methods.
- [ ] Implement typed asset account and loan entities plus aggregate selectors.
- [ ] Preserve raw negative surplus while exposing a separately clamped goal contribution.
- [ ] Add projection series with a zero baseline and maturity contribution inputs.
- [ ] Run focused tests, lint, and typecheck.

### Task 2: Account And Loan Editors

**Files:**
- Modify: `src/features/dashboard/goal-quick-planner.tsx`
- Modify: `src/features/dashboard/goal-quick-planner.test.tsx`
- Modify: `src/features/dashboard/dashboard-overview.tsx`

- [ ] Add failing integration tests for adding two asset accounts and two loans.
- [ ] Add account categories, loan repayment selectors, and repeatable rows using the existing bottom-sheet interaction.
- [ ] Ensure deleting one loan changes only that loan's balance and payment.
- [ ] Preserve cumulative quick amount controls, undo, focus, and safe-area behavior.
- [ ] Run planner and overview tests.

### Task 3: Charts And Loan Table

**Files:**
- Create: `src/features/dashboard/finance-visualizations.tsx`
- Create: `src/features/dashboard/finance-visualizations.test.tsx`
- Modify: `src/features/dashboard/dashboard-overview.tsx`
- Modify: `src/features/dashboard/dashboard-overview.test.tsx`

- [ ] Add failing tests for net-worth projection, monthly flow, asset composition, zero/negative states, and loan rows.
- [ ] Build responsive Recharts line, bar, and donut visuals with Korean tooltips and stable dimensions.
- [ ] Add an adjacent accessible summary and loan comparison table.
- [ ] Use 16px panels, restrained shadows, mint/violet/amber semantic colors, and Lucide category icons.
- [ ] Run visualization and integration tests.

### Task 4: Verification And Integration

- [ ] Run full tests, lint, typecheck, and production build.
- [ ] Verify 390x844, 768x1024, and 1440x900 with screenshots and overflow checks.
- [ ] Dispatch calculation, accessibility, and final code reviews; resolve every Critical and Important issue.
- [ ] Open a template-compliant PR to `dev`, add the administrator review, squash merge, update `dev`, and create the next feature branch.
