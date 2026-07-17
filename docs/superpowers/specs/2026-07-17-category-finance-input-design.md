# Category Finance Input Design

## Objective

Replace the flat goal-planner form with a mobile-first category editor that derives net worth and monthly saving capacity from understandable financial rows.

## Interaction Model

- The planner has four URL-addressable tabs: `순자산`, `월 현금흐름`, `대출`, and `수익률`.
- Only one editing surface is open at a time. A compact summary rail keeps every category total visible.
- Net worth is calculated as assets minus liabilities. Monthly saving capacity is calculated as income minus expenses.
- Each row supports renaming, amount entry in 만원, quick cumulative adjustment, and removal.
- Users can add rows from common presets. Removed rows expose an immediate undo action.
- Loan principal, interest rate, and remaining term remain a separate scenario input because loan repayment affects monthly saving capacity and the goal timeline.

## Default Data

- Assets: `예금·현금 1,000만원`
- Liabilities: none, so current net worth starts at 1,000만원.
- Income: `월 실수령 320만원`
- Expenses: `고정비 105만원`, `생활비 85만원`, `비상금 30만원`, so monthly saving capacity starts at 100만원.
- Loan scenario: principal 3,000만원, annual rate 4.5%, remaining term 60 months.

## Visual Direction

Use a calm Korean consumer-finance visual language: white canvas, charcoal text, restrained blue for actions, amber only for debt impact, 8px radii, crisp dividers, and tabular monetary figures. Remove nested input cards and long helper copy. Mobile controls have at least 44px targets and 16px input text.

## Accessibility And State

- Tabs use `tablist`, `tab`, and `tabpanel` semantics and support keyboard activation through native buttons.
- Add, remove, clear, and undo actions have explicit accessible names.
- Derived totals and removal feedback use polite live regions.
- The active tab is mirrored in the URL hash without navigation reload.
- Empty categories show a useful zero state and an add action.

## Verification

- Component tests cover derived totals, cumulative quick adjustment, add/remove/undo, negative net worth, tab behavior, loan validation, and return validation.
- Run lint, typecheck, the full Vitest suite, and Next.js build.
- Verify 390px mobile and desktop layouts in the running browser, including keyboard focus and horizontal overflow.
