# Dashboard Mobile Bank Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the dashboard toward a clean consumer banking/Toss-style finance app and make the quick calculator easier to use.

**Architecture:** Keep the work inside the dashboard UI layer. Use existing pure calculators for summary values. Do not add backend, persistence, or financial recommendation logic in this slice.

**Tech Stack:** Next.js, React, Tailwind CSS, Vitest, React Testing Library.

---

## File Structure

- Update: `src/components/app-shell.tsx`
  - Simplify navigation and app chrome.
- Update: `src/app/globals.css`
  - Add neutral banking app tokens and focus styling.
- Update: `src/features/dashboard/dashboard-overview.tsx`
  - Replace explanatory card layout with calculated financial summary, paycheck allocation, and next-action sections.
- Update: `src/features/dashboard/goal-quick-planner.tsx`
  - Show live result before submit and improve form field usability.
- Update: `src/features/dashboard/dashboard-overview.test.tsx`
  - Assert the redesigned dashboard content.

## Task 1: Redesign Dashboard UI

**Files:**
- Update listed files above.

- [x] **Step 1: Inspect current dashboard**

Reviewed `AppShell`, `DashboardOverview`, `GoalQuickPlanner`, tests, and global CSS.

- [x] **Step 2: Redesign app shell and dashboard**

Updated app shell, dashboard summary, paycheck allocation, next action, and tax status panels.

- [x] **Step 3: Improve calculator usability**

Quick planner now shows the calculated result immediately and keeps submit for explicit confirmation.

- [x] **Step 4: Update focused tests**

Run:

```bash
npm test -- src/features/dashboard/dashboard-overview.test.tsx src/features/dashboard/goal-quick-planner.test.tsx
```

- [x] **Step 5: Full verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- [x] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-07-15-dashboard-mobile-bank-redesign.md src/app/globals.css src/components/app-shell.tsx src/features/dashboard/dashboard-overview.tsx src/features/dashboard/dashboard-overview.test.tsx src/features/dashboard/goal-quick-planner.tsx
git commit -m "feat: redesign dashboard for banking-style usability"
```

## Self-Review

- UX: Key numbers and live calculator are visible without hunting through explanatory cards.
- Accessibility: Headings, labels, focus states, and live result region remain present.
- Finance safety: Copy frames projections as simulations, not investment advice.
