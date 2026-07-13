# Goal Quick Planner QA Report

## Reviewers

- qa-risk-reviewer
- privacy-safety-reviewer
- admin-orchestrator integration review

## Blocking Findings And Resolution

### P1: Invalid Annual Return Could Produce False Goal Reached

- Affected files: `src/lib/calculators/goal-timeline.ts`, `src/features/dashboard/goal-quick-planner.tsx`
- Finding: annual returns outside the simple model bounds could create nonsensical compounding behavior.
- Resolution: calculator now rejects annual return rates below -100% or above 50% with `reason: "invalid-return-rate"`. UI displays a validation message instead of a goal result.
- Test coverage: calculator test for `annualReturnRate: -25`; UI test for `-101%`.

### P2: Model Horizon Was Not Distinguished From Impossible Inputs

- Affected files: `src/lib/calculators/goal-timeline.ts`, `src/features/dashboard/goal-quick-planner.tsx`
- Finding: all unreached results used the same message.
- Resolution: calculator now returns `reason: "max-months-exceeded"` for horizon misses and `reason: "no-progress"` for zero-progress inputs.
- Test coverage: low positive contribution case that exceeds the model horizon.

### P2: Finance Copy Sounded Like Advice Or Certain Tax Refund

- Affected file: `src/features/dashboard/dashboard-overview.tsx`
- Finding: dashboard copy used recommendation-like wording and risked equating tax credits with refunds.
- Resolution: copy was changed to simulation and estimate framing, including Hometax verification wording.
- Test coverage: dashboard test now asserts neutral copy.

### P2: Return Assumption Was Not Framed As Non-Guaranteed

- Affected file: `src/features/dashboard/goal-quick-planner.tsx`
- Finding: expected return input did not visibly state that returns are assumptions.
- Resolution: UI now states that the result is a simple estimate based on the input return assumption and actual returns are not guaranteed.
- Test coverage: quick planner test asserts the disclosure.

### P3: Dashboard Test Did Not Assert Planner Composition

- Affected file: `src/features/dashboard/dashboard-overview.test.tsx`
- Resolution: dashboard test now checks the quick planner heading and submit button.

## Final Verification

- `npm test -- src/lib/calculators/goal-timeline.test.ts src/features/dashboard/goal-quick-planner.test.tsx src/features/dashboard/dashboard-overview.test.tsx`: 3 files, 11 tests passed.
- `npm run lint`: passed.
- `npm test`: 3 files, 11 tests passed.
- `npm run build`: passed with existing Next workspace-root warning.
- `npm run typecheck`: passed after the build/typecheck race was removed.
