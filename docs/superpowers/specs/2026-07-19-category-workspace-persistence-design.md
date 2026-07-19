# Category Workspace and Persistence Design

## Objective

Replace the long, scroll-heavy finance input experience with category-specific workspaces. Preserve every valid edit across category and page navigation, while also providing an explicit Save action and visible persistence status.

## Primary User

A Korean early-career worker who needs to enter salary, expenses, accounts, and loans in short sessions, often on mobile. The user should be able to stop midway, move to another category, and return without losing work.

## Information Architecture

The application uses five top-level destinations:

1. Home: net worth, monthly cash flow, account summary, and required next actions.
2. Money: four independent workspaces for cash flow, expenses, assets, and loans.
3. Calculators: take-home pay, SME income-tax reduction, and year-end tax tools.
4. Products: youth savings, housing subscription, ISA, and related guidance.
5. Insights: projections, loan impact, and charts.

The Money destination must not stack all editors vertically. It opens with a compact workspace selector and renders only one workspace at a time. Deep links continue to select the correct workspace.

## Workspace Model

### Cash Flow

- Edit monthly income and review categorized monthly outflow.
- Provide cumulative quick-amount controls in KRW 10,000 units.
- Show the resulting monthly surplus beside the input without requiring scrolling.

### Expenses

- Keep fixed, living, and irregular expenses as separate tabs.
- Show a compact category list and subtotal first.
- Selecting an item opens one editor: a mobile bottom sheet or desktop side panel.
- Adding, duplicating, deleting, and undoing remain available without stacking every form.

### Assets

- Show each parking account, savings account, subscription account, or other asset as a row.
- Display balance, contribution, and rate in the row summary.
- Edit one account at a time in the workspace editor.

### Loans

- Show every loan independently with principal, rate, repayment method, remaining term, and estimated monthly payment.
- Negative net worth remains valid and visible.
- Adding multiple loans must not overwrite existing loans.

## Persistence Model

The interface maintains a single owner-scoped finance draft.

1. Every valid edit updates React state immediately.
2. The updated draft is written to local storage synchronously through the existing owner-scoped storage adapter.
3. The header Save button writes the same draft and records a `savedAt` timestamp for visible confirmation.
4. Navigation between categories never resets the current draft.
5. Reloading restores the latest valid draft, including edits made before the explicit Save action.
6. Storage failure keeps the in-memory draft and displays a persistent retry action.

The Save button is confirmation, not the only protection against data loss. This avoids losing work when a user forgets to press Save while preserving the explicit control requested by the user.

## Save Status

Each editable workspace exposes one shared status control near the workspace title:

- `저장됨`: the current draft matches the last successful local write.
- `저장 필요`: the current in-memory value has not been written successfully.
- `저장 실패`: storage rejected the write; a Retry button is available.

The explicit Save button is always reachable in the sticky workspace header. It must not cover form controls or mobile safe areas.

## Interaction and Layout

- Mobile uses a single-column workspace with a sticky title and Save action.
- Desktop uses a category rail, a compact item list, and a side editor where applicable.
- The user never needs to scroll past unrelated categories to reach an editor.
- Long item collections scroll within the list area on desktop; the overall page remains stable.
- Icon buttons use Lucide icons and accessible names.
- Destructive actions support undo and do not use blocking browser confirmation dialogs.
- Focus moves into an opened editor and returns to the originating row when the editor closes.

## Visual Direction

- Load and self-host Pretendard Variable explicitly rather than relying on an operating-system fallback.
- Use Pretendard's variable weights and tabular numerals throughout the product.
- Use fewer `font-black` declarations; reserve the heaviest weight for primary amounts and page titles.
- Body copy uses medium or semibold weights so Korean glyphs do not appear congested.
- Preserve the current blue, mint, coral, and neutral semantic colors while reducing decorative surfaces.
- Rounded shapes remain, but controls and cards use a consistent radius scale rather than arbitrary values.

## Error and Recovery Rules

- Invalid field drafts stay in the open editor and do not overwrite the last valid finance value.
- A category change does not discard an invalid draft silently; reopening the same item restores it during the session.
- Malformed persisted data falls back to the default scenario and shows a concise recovery notice.
- Storage quota or security errors do not block editing.
- Empty asset, loan, or expense categories show one primary Add action and no placeholder cards.

## Testing

Add or update tests for:

- edits surviving workspace changes and remounts;
- explicit Save status and timestamp behavior;
- storage failures exposing Retry without losing in-memory values;
- deep links selecting the correct workspace;
- only one item editor being visible at a time;
- multiple assets and loans remaining independent;
- negative net worth and deficit scenarios;
- keyboard focus entering and leaving mobile sheets and desktop side panels;
- mobile navigation and Save controls not overlapping content;
- the selected font variable being applied at the root layout.

Run the full unit suite, typecheck, lint, production build, and desktop/mobile browser verification before integration.

## Out of Scope

- Server accounts, cloud synchronization, and multi-device conflict resolution.
- Changing tax or financial product policy calculations.
- Replacing the current local owner identity model.
- Personalized investment recommendations.
