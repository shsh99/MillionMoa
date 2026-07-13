# Goal Quick Planner Integration

## Scope

- Added the dashboard quick planner component.
- Composed the planner into the dashboard right column.
- Extended the pure goal timeline calculator with explicit failure reasons.

## Implementation Notes

- `GoalQuickPlanner` keeps form state locally and calls `calculateMonthsToGoal`.
- The calculator now distinguishes:
  - invalid return assumptions,
  - no-progress inputs,
  - goals not reached within the 1,200-month model horizon.
- Dashboard copy was reframed from recommendation language to user-controlled simulation language.

## Verification

- `npm test -- src/lib/calculators/goal-timeline.test.ts src/features/dashboard/goal-quick-planner.test.tsx src/features/dashboard/dashboard-overview.test.tsx`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run typecheck`

The first `npm run typecheck` attempt was run in parallel with `npm run build` and failed because `.next/types` was being regenerated. A later standalone `npm run typecheck` passed.
