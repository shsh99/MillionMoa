# Mobile Finance Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized dashboard UI with a polished mobile-first Korean consumer finance home using clear typography, functional icons, category-focused content, and ergonomic money editing.

**Architecture:** Preserve the existing finance calculations and planner state, but separate visual primitives into an app shell, overview summary, category navigation, and editor surface. The dashboard remains the scenario integration owner while the planner provides edits and snapshots. Mobile and desktop share one hierarchy rather than two unrelated layouts.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, lucide-react, Vitest, Testing Library

---

### Task 1: App Shell And Icon Foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/app-shell.test.tsx`

- [ ] Write a failing shell test asserting compact branding, icon-backed mobile navigation, active home state, and safe-area padding.
- [ ] Run `npm test -- src/components/app-shell.test.tsx` and confirm the missing accessible navigation behavior fails.
- [ ] Install `lucide-react` and replace the oversized desktop navigation with a compact 56-64px banking header.
- [ ] Implement Home, WalletCards, Landmark, and ChartNoAxesCombined icons with text labels in mobile navigation.
- [ ] Add neutral and semantic CSS tokens, safe-area padding, and system Korean font smoothing.
- [ ] Run the shell test, lint, and typecheck.

### Task 2: Consumer Finance Home Summary

**Files:**
- Modify: `src/features/dashboard/dashboard-overview.tsx`
- Modify: `src/features/dashboard/dashboard-overview.test.tsx`

- [ ] Update the overview test to require a light net-worth summary, compact goal information, and a four-metric monthly strip.
- [ ] Run the overview test and confirm it fails against the dark oversized summary.
- [ ] Remove the dark hero, full-width divider tables, duplicated overview sections, and heavy `font-black` usage.
- [ ] Build a light first viewport with one primary amount, subtle progress, goal month, income, spending, surplus, and loan payment.
- [ ] Use semantic icons and ensure long positive and negative currency values wrap without clipping.
- [ ] Run the overview and planner tests.

### Task 3: Category-Focused Planner

**Files:**
- Modify: `src/features/dashboard/goal-quick-planner.tsx`
- Modify: `src/features/dashboard/goal-quick-planner.test.tsx`

- [ ] Add failing tests for icon category tabs, row-based editing, cumulative add and subtract controls, and explicit close behavior.
- [ ] Run the planner test and confirm the new controls fail.
- [ ] Restyle the category switcher as a compact segmented control with Wallet, ReceiptText, Landmark, and TrendingUp icons.
- [ ] Reduce always-visible row actions to one edit affordance and move delete into the expanded editor.
- [ ] Add `-10`, `-50`, `-100`, `+10`, `+50`, and `+100` ten-thousand-won controls while preserving direct input and cumulative behavior.
- [ ] Present the editor as a fixed bottom sheet on mobile and an in-panel editor on desktop with Escape close and focus restoration.
- [ ] Run planner and integration tests.

### Task 4: Responsive And Accessibility QA

**Files:**
- Modify: `src/features/dashboard/dashboard-overview.tsx`
- Modify: `src/features/dashboard/goal-quick-planner.tsx`
- Modify: `src/components/app-shell.tsx`
- Test: `src/features/dashboard/dashboard-overview.test.tsx`
- Test: `src/features/dashboard/goal-quick-planner.test.tsx`

- [ ] Verify 44px targets, visible focus, tab arrow navigation, Escape close, focus restoration, and reduced motion.
- [ ] Verify 390x844 has no horizontal overflow and places summary, monthly strip, and category selector before detail content.
- [ ] Verify 768x1024 and 1440x900 maintain readable line lengths and do not clip monetary values.
- [ ] Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.
- [ ] Perform a final design preflight: one accent, one radius system, no nested cards, no decorative gradients, no oversized header, no truncated finance values, and consistent lucide icons.

### Task 5: Review And Integration

**Files:**
- Review all modified files and PR template `.github/pull_request_template.md`.

- [ ] Dispatch finance UX and QA reviewers against the final diff.
- [ ] Resolve every critical and important finding and rerun verification.
- [ ] Commit, push, open a template-compliant PR to `dev`, add the administrator review note, and squash merge after checks.
- [ ] Update local `dev` and create the next `feat/*` branch.
