# Category Workspace Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scroll-heavy money input page with a category workspace that persists valid edits automatically and still exposes an explicit Save action.

**Architecture:** `DashboardOverview` remains the owner of the finance draft, hash-driven category state, and local persistence. `FinanceScenarioEditor` is narrowed with a `mode` prop so assets and loans can render as independent workspaces without nesting tabs. Existing expense and money input components are reused, with workspace-level save status and Pretendard loading added around them.

**Tech Stack:** Next.js App Router, React client components, Vitest, Testing Library, localStorage, Tailwind utility classes, Lucide icons, Pretendard variable font through Next font loading.

---

## File Structure

- Modify `src/features/dashboard/dashboard-overview.tsx`: add money workspace state, sticky workspace header, explicit Save/Retry status, and single-workspace rendering.
- Modify `src/features/dashboard/dashboard-overview.test.tsx`: cover deep links, workspace switching, draft persistence, Save timestamp, retry, and non-stacked editors.
- Modify `src/features/dashboard/finance-scenario-editor.tsx`: add optional `mode?: "assets" | "loans"` and hide internal asset/loan tabs when controlled by parent.
- Modify `src/features/dashboard/finance-scenario-editor.test.tsx`: verify controlled asset and loan modes keep multiple records independent.
- Modify `src/features/dashboard/finance-scenario-storage.ts`: store optional `savedAt` metadata in the version 2 envelope without breaking old version 2 payloads.
- Modify `src/features/dashboard/finance-scenario-storage.test.ts`: verify metadata round trip and migration compatibility.
- Modify `src/app/layout.tsx` and `src/app/globals.css`: explicitly load Pretendard Variable and reduce reliance on fallback font names.
- Add `_workspace/03_implementation/2026-07-19_category-workspace.md`: administrator orchestration notes.

## Task 1: Persistence Envelope

**Files:**
- Modify: `src/features/dashboard/finance-scenario-storage.ts`
- Modify: `src/features/dashboard/finance-scenario-storage.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests proving `saveFinanceScenario(..., { savedAt })` writes metadata and `loadFinanceScenario` accepts both old version 2 envelopes and new metadata envelopes.

- [ ] **Step 2: Run targeted storage tests**

Run: `npm test -- src/features/dashboard/finance-scenario-storage.test.ts`
Expected: FAIL because `saveFinanceScenario` has no metadata option and load result has no `savedAt`.

- [ ] **Step 3: Implement minimal envelope metadata**

Extend the version 2 schema with optional `savedAt`, add `SaveFinanceScenarioOptions`, pass metadata during save, and return `savedAt` from load when valid.

- [ ] **Step 4: Re-run targeted storage tests**

Run: `npm test -- src/features/dashboard/finance-scenario-storage.test.ts`
Expected: PASS.

## Task 2: Workspace Selection and Save Status

**Files:**
- Modify: `src/features/dashboard/dashboard-overview.tsx`
- Modify: `src/features/dashboard/dashboard-overview.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests for: `#finance-assets` and `#finance-loans-input` deep links, only one money workspace visible, edits surviving workspace switches, explicit Save showing `저장됨`, and storage failure exposing retry while keeping the draft in memory.

- [ ] **Step 2: Run targeted dashboard tests**

Run: `npm test -- src/features/dashboard/dashboard-overview.test.tsx`
Expected: FAIL because all input editors are still stacked and no explicit Save/Retry control exists.

- [ ] **Step 3: Implement workspace shell**

Add a `MoneyWorkspace` union, derive it from hashes, render a segmented money workspace nav, and render only cash flow, expenses, assets, or loans. Add sticky workspace header with Save button, saved-needed-failed status text, and retry action.

- [ ] **Step 4: Re-run dashboard tests**

Run: `npm test -- src/features/dashboard/dashboard-overview.test.tsx`
Expected: PASS.

## Task 3: Controlled Asset and Loan Editors

**Files:**
- Modify: `src/features/dashboard/finance-scenario-editor.tsx`
- Modify: `src/features/dashboard/finance-scenario-editor.test.tsx`

- [ ] **Step 1: Write failing tests**

Add tests proving `mode="assets"` renders asset controls but not loan editor controls, and `mode="loans"` renders loan controls while multiple loans stay independent.

- [ ] **Step 2: Run targeted editor tests**

Run: `npm test -- src/features/dashboard/finance-scenario-editor.test.tsx`
Expected: FAIL because controlled mode is not supported.

- [ ] **Step 3: Implement controlled mode**

Add optional `mode` prop, keep internal tabs for the uncontrolled standalone editor, and route undo selection correctly for controlled assets or loans.

- [ ] **Step 4: Re-run editor tests**

Run: `npm test -- src/features/dashboard/finance-scenario-editor.test.tsx`
Expected: PASS.

## Task 4: Typography and Visual Polish

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: touched dashboard components where typography is excessive.

- [ ] **Step 1: Add failing font assertion**

Add a root layout or dashboard test that expects the Pretendard variable class to be applied to the app root.

- [ ] **Step 2: Run targeted test**

Run: `npm test -- src/features/dashboard/dashboard-overview.test.tsx`
Expected: FAIL until the font class is applied.

- [ ] **Step 3: Load Pretendard and polish touched surfaces**

Use `next/font/local` if a local font is available; otherwise use a package-backed variable font after verifying dependency. Apply tabular numeric defaults and reduce heavy weights in newly touched workspace controls.

- [ ] **Step 4: Re-run targeted test**

Run: `npm test -- src/features/dashboard/dashboard-overview.test.tsx`
Expected: PASS.

## Task 5: Verification and Integration

**Files:**
- All modified files.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- src/features/dashboard/dashboard-overview.test.tsx src/features/dashboard/finance-scenario-editor.test.tsx src/features/dashboard/finance-scenario-storage.test.ts`
Expected: PASS.

- [ ] **Step 2: Run full verification**

Run: `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
Expected: all exit 0.

- [ ] **Step 3: PR automation**

Commit, push `feat/dashboard-ux-polish-next`, open a template-based PR to `dev`, post review evidence, squash merge after checks pass, update local `dev`, and create the next `feat/*` branch.

## Self-Review

- Spec coverage: workspace IA, automatic persistence, explicit Save, retry, independent assets/loans, negative net worth, font loading, and non-stacked input flow are covered.
- Placeholder scan: no TBD/TODO/later steps remain.
- Type consistency: `MoneyWorkspace`, `mode?: "assets" | "loans"`, and `savedAt?: string` are the only new public shapes.
