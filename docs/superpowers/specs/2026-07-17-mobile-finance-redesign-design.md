# MillionMoa Mobile Finance Redesign

## Design Read

Korean early-career workers use this screen to understand net worth, monthly surplus, debt pressure, and the path to 100 million KRW. The product should feel like a polished consumer banking app: calm, immediate, trustworthy, and easy to operate with one hand.

## Direction

- Redesign mode: structural overhaul while preserving calculations, field names, routes, and accessibility behavior.
- Design variance: 3. Familiar financial patterns are more important than novelty.
- Motion intensity: 2. Motion only confirms state changes and sheet transitions.
- Visual density: 5. The first viewport is concise, while details remain available by category.
- Theme: light only for this phase.
- Accent: one muted teal for actions and selected states. Amber and red are reserved for financial warnings.
- Shape: 8px for panels and inputs, 999px only for compact status chips.

## Information Architecture

The mobile home screen follows this order:

1. Compact greeting and profile context.
2. Net worth with 100 million KRW progress and projected completion.
3. Monthly money summary: income, spending, surplus, and loan payment.
4. Primary category switcher: assets, cash flow, loans, and assumptions.
5. Contextual category details and editing.
6. Short calculation disclosure.

Desktop keeps the same hierarchy in a two-column layout. It must not become a separate dense dashboard composition.

## Visual System

### Typography

- Use the existing Korean-capable system font stack.
- Body text uses normal or semibold weight.
- Section titles use bold, not black.
- Only the net worth and one contextual result use the strongest weight.
- Monetary values use tabular numerals and never truncate.
- Helper text is limited to information needed to prevent financial misunderstanding.

### Surfaces

- Use a soft neutral page background and white content surface.
- Remove the large dark hero block, nested cards, heavy shadows, and decorative badges.
- Separate sections primarily with spacing and subtle dividers.
- Color never decorates; it indicates action, selection, success, deficit, or warning.

### Icons

- Install and use `lucide-react` for familiar banking actions and categories.
- Use icons for profile, assets, cash flow, loans, assumptions, edit, add, delete, restore, and reset.
- Every icon-only button has an accessible label and tooltip where its meaning is not obvious.
- Icons use a consistent 18px or 20px size and 1.75px stroke.
- Do not use text initials, emoji, or hand-drawn SVG icons as substitutes.

## Interaction Model

- Category tabs are a stable segmented control directly below the money summary.
- Selecting a category replaces the detail area instead of extending the page.
- Tapping a row opens a bottom sheet on mobile and a side sheet on desktop.
- The editor includes the category name, amount in ten-thousand-won units, cumulative quick-add buttons, quick-subtract buttons, clear, save, and delete.
- Quick amount controls accumulate from the current value.
- Editing updates the overview immediately while the sheet remains open.
- Destructive actions require a deliberate secondary action and provide undo feedback.
- Loan conditions remain separate from liability balance. The UI warns when a repayment-like expense could duplicate the calculated payment.

## Components

- `FinanceHomeHeader`: compact user context and reset action.
- `NetWorthSummary`: net worth, progress, remaining amount, and goal month.
- `MonthlyMoneyStrip`: income, spending, surplus, and loan burden.
- `FinanceCategoryTabs`: assets, cash flow, loans, assumptions.
- `FinanceCategoryPanel`: only the selected category content.
- `FinanceItemRow`: icon, label, amount, and edit affordance.
- `FinanceItemSheet`: mobile bottom sheet and desktop side sheet.
- `LoanImpactSummary`: principal, payment, interest, and goal delay.
- `CalculationDisclosure`: concise estimate and tax-data notice.

## State And Calculations

- Keep one canonical scenario state for category items, loan inputs, and return assumption.
- Derive net worth, raw monthly surplus, post-loan cash flow, progress, and timelines from that state.
- Preserve negative net worth and negative cash flow in the UI.
- Clamp only progress visualization and calculator inputs that require non-negative contribution.
- Never automatically subtract loan principal from net worth in addition to a registered liability.

## Accessibility

- All touch targets are at least 44px.
- Focus indicators are visible on every interactive element.
- Tabs keep arrow, Home, and End keyboard behavior.
- Sheets trap focus, close with Escape, restore focus to the triggering row, and provide an explicit close button.
- Live announcements are limited to concise result changes and undo status.
- Reduced-motion users receive no animated progress or sheet movement.

## Responsive Behavior

- At 390px, the key amount, monthly summary, and category switcher fit without horizontal scrolling.
- Monetary values wrap or resize but never truncate.
- Fixed bottom navigation respects `env(safe-area-inset-bottom)`.
- Sheet controls remain above the bottom navigation and software keyboard.
- At desktop widths, the selected category editor may use a side sheet while the overview remains visible.

## Verification

- Unit tests cover cumulative add/subtract, negative values, reset, delete/undo, and loan-driven timeline changes.
- Integration tests verify that category and loan edits update every relevant overview value.
- Browser QA covers 390x844, 768x1024, and 1440x900.
- Visual QA checks typography hierarchy, clipping, focus, safe areas, sheet stacking, and icon consistency.
- Lint, typecheck, full tests, and production build are required before PR creation.

## Out Of Scope

- Authentication and persistent user data.
- Bank account synchronization.
- New tax or investment calculations.
- Copying Toss or any bank's proprietary assets, brand colors, or exact layouts.
