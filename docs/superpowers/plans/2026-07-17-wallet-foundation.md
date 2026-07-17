# Lilac Wallet Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the selected lilac-and-mint wallet design, reusable KRW entry controls, and versioned local scenario persistence without changing finance formulas.

**Architecture:** CSS variables define the visual system, focused React primitives own repeated money-entry behavior, and a client-side persistence adapter serializes the canonical `FinanceScenarioInput`. `DashboardOverview` remains the state owner and composes the primitives so calculator and expense features can reuse them in later branches.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide React, Vitest, Testing Library, Zod

---

### Task 1: Lilac Wallet Design Tokens and Shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/app-shell.tsx`
- Modify: `src/components/app-shell.test.tsx`

- [ ] **Step 1: Write the failing shell test**

Add assertions that the logo uses the lilac brand token, navigation targets existing scenario sections, and the mobile navigation exposes four unique destinations:

```tsx
expect(screen.getByTestId("brand-mark")).toHaveClass("bg-[var(--wallet-primary)]");
expect(screen.getByRole("link", { name: "계좌" })).toHaveAttribute("href", "#finance-accounts");
expect(screen.getByRole("link", { name: "대출" })).toHaveAttribute("href", "#finance-loans");
```

- [ ] **Step 2: Run the shell test and verify failure**

Run: `npm test -- --run src/components/app-shell.test.tsx`

Expected: FAIL because the new token class and anchors do not exist.

- [ ] **Step 3: Define the visual tokens**

Replace the current one-note slate/emerald variables with explicit semantic tokens:

```css
:root {
  --wallet-page: #f7f5fc;
  --wallet-surface: #ffffff;
  --wallet-surface-tint: #fbfaff;
  --wallet-ink: #242236;
  --wallet-muted: #747187;
  --wallet-line: #e8e3f1;
  --wallet-primary: #7560c9;
  --wallet-primary-strong: #5e49b1;
  --wallet-primary-soft: #eee9ff;
  --wallet-mint: #49bfa0;
  --wallet-mint-soft: #e4f8f1;
  --wallet-coral: #de7c83;
  --wallet-coral-soft: #fff0f1;
  --wallet-shadow: 0 14px 38px rgba(61, 50, 102, 0.10);
}
```

Set the body background and focus styles from these tokens. Do not add gradients or decorative blobs.

- [ ] **Step 4: Restyle and repair the shell**

Use a circular lilac brand mark, soft translucent header, rounded navigation selections, and valid anchors:

```tsx
const bottomNavItems = [
  { label: "홈", href: "/", icon: Home },
  { label: "계산", href: "#finance-calculators", icon: Calculator },
  { label: "계좌", href: "#finance-accounts", icon: Landmark },
  { label: "대출", href: "#finance-loans", icon: BadgeDollarSign },
];
```

Add `data-testid="brand-mark"` to the mark and use `rounded-full` for its container.

- [ ] **Step 5: Verify and commit**

Run:

```txt
npm test -- --run src/components/app-shell.test.tsx
npm run lint
npm run typecheck
```

Expected: all commands pass.

Commit:

```txt
git add src/app/globals.css src/components/app-shell.tsx src/components/app-shell.test.tsx
git commit -m "feat: add lilac wallet design tokens"
```

### Task 2: Shared KRW Money Input

**Files:**
- Create: `src/components/money-input.tsx`
- Create: `src/components/money-input.test.tsx`

- [ ] **Step 1: Write failing interaction tests**

Cover cumulative quick actions, direct manwon input, clear, Korean preview, and focus stability:

```tsx
render(<ControlledMoneyInput initialValue={3_200_000} />);
await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
expect(screen.getByRole("textbox", { name: "월 수입" })).toHaveValue("520");
expect(screen.getByText("오백이십만원")).toBeInTheDocument();
```

Also assert `onChange(0)` after clear and no negative output when `allowNegative` is false.

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- --run src/components/money-input.test.tsx`

Expected: FAIL because `MoneyInput` is missing.

- [ ] **Step 3: Implement the reusable contract**

Export:

```tsx
export type MoneyInputProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  quickAmountsManwon?: number[];
  allowNegative?: boolean;
  showPreview?: boolean;
};

export function MoneyInput({
  id,
  label,
  value,
  onChange,
  quickAmountsManwon = [10, 50, 100, 500],
  allowNegative = false,
  showPreview = true,
}: MoneyInputProps) { /* controlled implementation */ }
```

Keep integer KRW in state, sanitize commas and whitespace, preserve a leading minus only when allowed, and expose exact accessible button names. Use a pure `formatKoreanMoney(value: number): string` helper in the same module.

- [ ] **Step 4: Verify and commit**

Run:

```txt
npm test -- --run src/components/money-input.test.tsx
npm run lint
npm run typecheck
```

Expected: all commands pass.

Commit:

```txt
git add src/components/money-input.tsx src/components/money-input.test.tsx
git commit -m "feat: add reusable KRW money input"
```

### Task 3: Versioned Scenario Persistence

**Files:**
- Create: `src/features/dashboard/finance-scenario-storage.ts`
- Create: `src/features/dashboard/finance-scenario-storage.test.ts`
- Modify: `src/features/dashboard/finance-scenario-model.ts`

- [ ] **Step 1: Write failing storage tests**

Test successful round trip, malformed JSON fallback, invalid data fallback, and version rejection:

```ts
const storage = createMemoryStorage();
saveFinanceScenario(storage, input);
expect(loadFinanceScenario(storage, fallback)).toEqual({ scenario: input, source: "saved" });

storage.setItem(FINANCE_SCENARIO_STORAGE_KEY, "not-json");
expect(loadFinanceScenario(storage, fallback)).toEqual({ scenario: fallback, source: "fallback" });
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm test -- --run src/features/dashboard/finance-scenario-storage.test.ts`

Expected: FAIL because the persistence adapter is missing.

- [ ] **Step 3: Export a Zod scenario schema**

In `finance-scenario-model.ts`, export a schema matching the runtime model:

```ts
export const financeScenarioSchema = z.object({
  assets: z.array(assetAccountSchema),
  loans: z.array(loanSchema),
  manualLiabilities: z.number().int().nonnegative().optional(),
  monthlyIncome: z.number().int().nonnegative(),
  monthlyNonLoanExpense: z.number().int().nonnegative(),
});
```

Reuse the existing domain constraints for rates, terms, and repayment methods.

- [ ] **Step 4: Implement storage with a version envelope**

```ts
export const FINANCE_SCENARIO_STORAGE_KEY = "millionmoa.finance-scenario";
const envelopeSchema = z.object({ version: z.literal(1), scenario: financeScenarioSchema });

export function saveFinanceScenario(storage: StorageLike, scenario: FinanceScenarioInput) {
  storage.setItem(FINANCE_SCENARIO_STORAGE_KEY, JSON.stringify({ version: 1, scenario }));
}
```

`loadFinanceScenario` must catch storage access and parsing errors, return the supplied fallback, and never throw during initial render.

- [ ] **Step 5: Verify and commit**

Run:

```txt
npm test -- --run src/features/dashboard/finance-scenario-storage.test.ts src/features/dashboard/finance-scenario-model.test.ts
npm run lint
npm run typecheck
```

Expected: all commands pass.

Commit:

```txt
git add src/features/dashboard/finance-scenario-storage.ts src/features/dashboard/finance-scenario-storage.test.ts src/features/dashboard/finance-scenario-model.ts
git commit -m "feat: persist versioned finance scenarios"
```

### Task 4: Dashboard State Integration and Wallet Restyle

**Files:**
- Modify: `src/features/dashboard/dashboard-overview.tsx`
- Modify: `src/features/dashboard/dashboard-overview.test.tsx`
- Modify: `src/features/dashboard/finance-scenario-editor.tsx`
- Modify: `src/features/dashboard/finance-scenario-editor.test.tsx`
- Modify: `src/features/dashboard/finance-visualizations.tsx`
- Modify: `src/features/dashboard/finance-visualizations.test.tsx`

- [ ] **Step 1: Write failing dashboard integration tests**

Mock storage and assert saved initialization and subsequent updates:

```tsx
window.localStorage.setItem(FINANCE_SCENARIO_STORAGE_KEY, JSON.stringify({ version: 1, scenario: savedScenario }));
render(<DashboardOverview />);
expect(screen.getByTestId("overview-net-worth")).toHaveTextContent("12,000,000원");

await user.click(screen.getByRole("button", { name: "월 수입에 100만원 더하기" }));
expect(JSON.parse(window.localStorage.getItem(FINANCE_SCENARIO_STORAGE_KEY)!)).toMatchObject({ version: 1 });
```

Assert the calculator, account, and loan anchors exist and that persistence errors produce a recoverable notice.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```txt
npm test -- --run src/features/dashboard/dashboard-overview.test.tsx src/features/dashboard/finance-scenario-editor.test.tsx src/features/dashboard/finance-visualizations.test.tsx
```

Expected: FAIL for missing shared controls, anchors, and persistence behavior.

- [ ] **Step 3: Integrate storage after hydration**

Initialize with the sample scenario on the server, load saved data in an effect, and avoid overwriting storage before hydration completes:

```tsx
const [input, setInput] = useState(initialFinanceScenario);
const [storageReady, setStorageReady] = useState(false);

useEffect(() => {
  const loaded = loadFinanceScenario(window.localStorage, initialFinanceScenario);
  setInput(loaded.scenario);
  setStorageReady(true);
}, []);

useEffect(() => {
  if (storageReady) saveFinanceScenario(window.localStorage, input);
}, [input, storageReady]);
```

Surface a concise notice only when fallback recovery occurred.

- [ ] **Step 4: Replace duplicate money controls**

Use `MoneyInput` for dashboard income/expense, asset balance/contribution, and loan principal. Remove local amount parsing and quick-button markup from `dashboard-overview.tsx` and `finance-scenario-editor.tsx`.

- [ ] **Step 5: Apply the B visual direction**

Restyle the summary as a lilac wallet object with mint progress, use pastel icon squircles for metrics, tint account tabs and editor surfaces, and update charts to this palette:

```ts
const assetColors = ["#7560c9", "#49bfa0", "#e89aa0", "#6fa9d8", "#d7a44e", "#947bd8"];
```

Use 20-24px outer radii, 14-16px controls, and no nested decorative cards. Add `id="finance-calculators"`, `id="finance-accounts"`, and `id="finance-loans"` to valid visible regions.

- [ ] **Step 6: Verify and commit**

Run:

```txt
npm test -- --run src/features/dashboard/dashboard-overview.test.tsx src/features/dashboard/finance-scenario-editor.test.tsx src/features/dashboard/finance-visualizations.test.tsx
npm run lint
npm run typecheck
```

Expected: all commands pass.

Commit:

```txt
git add src/features/dashboard/dashboard-overview.tsx src/features/dashboard/dashboard-overview.test.tsx src/features/dashboard/finance-scenario-editor.tsx src/features/dashboard/finance-scenario-editor.test.tsx src/features/dashboard/finance-visualizations.tsx src/features/dashboard/finance-visualizations.test.tsx
git commit -m "feat: restyle dashboard as lilac wallet"
```

### Task 5: Full Verification, Visual QA, and PR Integration

**Files:**
- Modify only files required by findings from verification.

- [ ] **Step 1: Run the full automated suite**

Run:

```txt
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Expected: all tests and checks pass without warnings introduced by this branch.

- [ ] **Step 2: Verify responsive behavior in the browser**

At 390x844 and 1440x900 verify:

- No horizontal document overflow.
- Summary amounts do not split individual Korean words.
- Every quick amount control is at least 44px tall and cumulative.
- Account and loan tabs are keyboard reachable.
- Charts have stable non-zero dimensions.
- Bottom navigation links land on visible sections.
- Reload restores the edited scenario.

- [ ] **Step 3: Run independent reviews**

Request a UI/accessibility review and a persistence/privacy review. Fix every Critical or Important finding, add regression tests, and repeat focused verification.

- [ ] **Step 4: Commit review fixes**

```txt
git add src/app/globals.css src/components/app-shell.tsx src/components/app-shell.test.tsx src/components/money-input.tsx src/components/money-input.test.tsx src/features/dashboard/dashboard-overview.tsx src/features/dashboard/dashboard-overview.test.tsx src/features/dashboard/finance-scenario-editor.tsx src/features/dashboard/finance-scenario-editor.test.tsx src/features/dashboard/finance-scenario-model.ts src/features/dashboard/finance-scenario-model.test.ts src/features/dashboard/finance-scenario-storage.ts src/features/dashboard/finance-scenario-storage.test.ts src/features/dashboard/finance-visualizations.tsx src/features/dashboard/finance-visualizations.test.tsx
git commit -m "fix: address wallet foundation review"
```

- [ ] **Step 5: Open and merge the PR**

Push the feature branch, create a template-based PR to `dev`, attach verification evidence, add the orchestrator review comment, and squash merge only after checks pass. Pull the updated `dev` branch and create `feat/expense-management` for the next plan.
