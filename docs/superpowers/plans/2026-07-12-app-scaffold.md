# App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the initial MillionMoa web app scaffold with Next.js, TypeScript, Tailwind CSS, linting, formatting, unit tests, and a minimal route structure ready for finance calculators.

**Architecture:** Start with a small Next.js App Router project. Keep app shell, feature modules, calculator modules, and tests separated so the later calculation engine can be developed with TDD without being coupled to UI code.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library, ESLint.

---

## File Structure

Create or modify these files:

- `package.json`: project scripts and dependencies.
- `tsconfig.json`: strict TypeScript settings.
- `next.config.ts`: Next.js config.
- `postcss.config.mjs`: Tailwind PostCSS config.
- `tailwind.config.ts`: Tailwind content paths and design tokens.
- `vitest.config.ts`: unit test config.
- `eslint.config.mjs`: lint rules.
- `src/app/layout.tsx`: root layout and metadata.
- `src/app/page.tsx`: first usable dashboard placeholder.
- `src/app/(auth)/login/page.tsx`: placeholder auth route boundary.
- `src/app/(auth)/signup/page.tsx`: placeholder auth route boundary.
- `src/app/(dashboard)/dashboard/page.tsx`: placeholder dashboard route boundary.
- `src/app/globals.css`: global styles and Tailwind layers.
- `src/components/app-shell.tsx`: app frame with navigation.
- `src/features/dashboard/dashboard-overview.tsx`: first dashboard content.
- `src/features/paycheck-planner/.gitkeep`: planned feature boundary.
- `src/features/fastest-path/.gitkeep`: planned feature boundary.
- `src/features/accounts/.gitkeep`: planned feature boundary.
- `src/features/budget/.gitkeep`: planned feature boundary.
- `src/features/tax-planner/.gitkeep`: planned feature boundary.
- `src/features/ledger/.gitkeep`: planned feature boundary.
- `src/features/reports/.gitkeep`: planned feature boundary.
- `src/lib/calculators/goal-timeline.ts`: placeholder pure calculator with tests.
- `src/lib/calculators/goal-timeline.test.ts`: first failing/passing calculator tests.
- `src/lib/calculators/cash-allocation/.gitkeep`: planned calculator boundary.
- `src/lib/calculators/interest/.gitkeep`: planned calculator boundary.
- `src/lib/calculators/fastest-path/.gitkeep`: planned calculator boundary.
- `src/lib/policies/.gitkeep`: policy config boundary.
- `src/lib/auth/.gitkeep`: auth boundary.
- `src/lib/db/.gitkeep`: database boundary.
- `src/lib/validation/.gitkeep`: validation boundary.
- `test/setup.ts`: Testing Library setup.
- `.env.example`: environment variable contract.
- `.gitignore`: ignore generated files.
- `README.md`: local setup and branch workflow.

Do not implement Supabase, Prisma, or real finance policy logic in this branch. Those belong in later feature branches.

## Task 1: Project Metadata And Scripts

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `README.md`
- Create: `.env.example`

- [ ] **Step 1: Create `package.json`**

Use this exact starting point:

```json
{
  "name": "millionmoa",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "clsx": "2.1.1",
    "next": "15.5.20",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "recharts": "3.9.2",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@eslint/eslintrc": "3.3.6",
    "@eslint/js": "9.39.5",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/node": "20.19.43",
    "@types/react": "19.2.7",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "4.7.0",
    "autoprefixer": "10.4.22",
    "eslint": "9.39.5",
    "eslint-config-next": "15.5.20",
    "jsdom": "26.1.0",
    "postcss": "8.5.17",
    "tailwindcss": "3.4.19",
    "typescript": "5.9.3",
    "vite": "6.4.3",
    "vitest": "3.2.7"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules
.next
out
dist
coverage
.env
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

- [ ] **Step 3: Create `README.md`**

```markdown
# MillionMoa

MillionMoa is a personal finance planning app for early-career workers who want to reach 100 million KRW faster through salary planning, account splitting, spending control, tax benefits, and investment scenarios.

## Branch Strategy

- `main`: stable release branch
- `dev`: integration branch
- `feat/*`: feature branches created from `dev`

## Local Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```
```

- [ ] **Step 4: Create `.env.example`**

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and install exits with code 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore README.md .env.example
git commit -m "chore: initialize app package"
```

## Task 2: TypeScript, Tailwind, ESLint, And Test Config

**Files:**
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201A",
        paper: "#F7F5EF",
        mint: "#4AAE8A",
        navy: "#263B63",
        amber: "#D99A2B",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Create `eslint.config.mjs`**

```js
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
];
```

If this config fails because of the installed `eslint-config-next` export shape, replace it with the config generated by the installed Next.js version and keep `npm run lint` green.

- [ ] **Step 6: Create `vitest.config.ts`**

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
});
```

- [ ] **Step 7: Create `test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: Verify config**

Run:

```bash
npm run typecheck
npm run lint
npm test
```

Expected:

- `typecheck` passes.
- `lint` passes or reports only config issues that are fixed in this task.
- `test` exits cleanly with no tests found or with existing tests passing.

- [ ] **Step 9: Commit**

```bash
git add tsconfig.json next.config.ts postcss.config.mjs tailwind.config.ts eslint.config.mjs vitest.config.ts test/setup.ts
git commit -m "chore: configure TypeScript linting and tests"
```

## Task 3: First Calculator With TDD

**Files:**
- Create: `src/lib/calculators/goal-timeline.test.ts`
- Create: `src/lib/calculators/goal-timeline.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/calculators/goal-timeline.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculateMonthsToGoal } from "./goal-timeline";

describe("calculateMonthsToGoal", () => {
  it("returns zero months when the goal is already reached", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 100_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 1_000_000,
        annualReturnRate: 0.03,
      }),
    ).toEqual({ months: 0, reached: true });
  });

  it("calculates months with monthly contributions and no return", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 1_000_000,
        annualReturnRate: 0,
      }),
    ).toEqual({ months: 90, reached: true });
  });

  it("marks the goal unreachable when contribution is zero and return cannot bridge the gap", () => {
    expect(
      calculateMonthsToGoal({
        currentAmount: 10_000_000,
        goalAmount: 100_000_000,
        monthlyContribution: 0,
        annualReturnRate: 0,
      }),
    ).toEqual({ months: null, reached: false });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/lib/calculators/goal-timeline.test.ts
```

Expected: fails because `./goal-timeline` does not exist.

- [ ] **Step 3: Create minimal implementation**

Create `src/lib/calculators/goal-timeline.ts`:

```ts
export type GoalTimelineInput = {
  currentAmount: number;
  goalAmount: number;
  monthlyContribution: number;
  annualReturnRate: number;
  maxMonths?: number;
};

export type GoalTimelineResult = {
  months: number | null;
  reached: boolean;
};

export function calculateMonthsToGoal(input: GoalTimelineInput): GoalTimelineResult {
  const maxMonths = input.maxMonths ?? 1_200;

  if (input.currentAmount >= input.goalAmount) {
    return { months: 0, reached: true };
  }

  if (input.monthlyContribution <= 0 && input.annualReturnRate <= 0) {
    return { months: null, reached: false };
  }

  const monthlyRate = input.annualReturnRate / 12;
  let balance = input.currentAmount;

  for (let month = 1; month <= maxMonths; month += 1) {
    balance = balance * (1 + monthlyRate) + input.monthlyContribution;

    if (balance >= input.goalAmount) {
      return { months: month, reached: true };
    }
  }

  return { months: null, reached: false };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npm test -- src/lib/calculators/goal-timeline.test.ts
```

Expected: tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculators/goal-timeline.ts src/lib/calculators/goal-timeline.test.ts
git commit -m "feat: add goal timeline calculator"
```

## Task 4: Route And Module Boundaries

**Files:**
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/signup/page.tsx`
- Create: `src/app/(dashboard)/dashboard/page.tsx`
- Create: `src/features/paycheck-planner/.gitkeep`
- Create: `src/features/fastest-path/.gitkeep`
- Create: `src/features/accounts/.gitkeep`
- Create: `src/features/budget/.gitkeep`
- Create: `src/features/tax-planner/.gitkeep`
- Create: `src/features/ledger/.gitkeep`
- Create: `src/features/reports/.gitkeep`
- Create: `src/lib/calculators/cash-allocation/.gitkeep`
- Create: `src/lib/calculators/interest/.gitkeep`
- Create: `src/lib/calculators/fastest-path/.gitkeep`
- Create: `src/lib/policies/.gitkeep`
- Create: `src/lib/auth/.gitkeep`
- Create: `src/lib/db/.gitkeep`
- Create: `src/lib/validation/.gitkeep`

- [ ] **Step 1: Create placeholder auth routes**

Create `src/app/(auth)/login/page.tsx`:

```tsx
export default function LoginPage() {
  return <main>로그인 준비 중</main>;
}
```

Create `src/app/(auth)/signup/page.tsx`:

```tsx
export default function SignupPage() {
  return <main>회원가입 준비 중</main>;
}
```

- [ ] **Step 2: Create dashboard route placeholder**

Create `src/app/(dashboard)/dashboard/page.tsx`:

```tsx
import Home from "@/app/page";

export default Home;
```

- [ ] **Step 3: Create planned module boundaries**

Create empty `.gitkeep` files in every feature and library boundary listed in this task. These keep future work from mixing calculator, auth, DB, UI, and policy concerns.

- [ ] **Step 4: Verify route boundary typecheck**

Run:

```bash
npm run typecheck
```

Expected: typecheck passes.

- [ ] **Step 5: Commit**

```bash
git add src/app src/features src/lib
git commit -m "chore: add app module boundaries"
```

## Task 5: App Shell And Dashboard Placeholder

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/app-shell.tsx`
- Create: `src/features/dashboard/dashboard-overview.tsx`
- Create: `src/features/dashboard/dashboard-overview.test.tsx`

- [ ] **Step 1: Write failing UI test**

Create `src/features/dashboard/dashboard-overview.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardOverview } from "./dashboard-overview";

describe("DashboardOverview", () => {
  it("shows the MillionMoa planning metrics", () => {
    render(<DashboardOverview />);

    expect(screen.getByRole("heading", { name: "월급으로 1억까지" })).toBeInTheDocument();
    expect(screen.getByText("현재 자산")).toBeInTheDocument();
    expect(screen.getByText("예상 달성일")).toBeInTheDocument();
    expect(screen.getByText("이번 달 생활비")).toBeInTheDocument();
    expect(screen.getByText("최단경로 단축")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npm test -- src/features/dashboard/dashboard-overview.test.tsx
```

Expected: fails because `dashboard-overview` does not exist.

- [ ] **Step 3: Create `src/features/dashboard/dashboard-overview.tsx`**

```tsx
const metrics = [
  { label: "현재 자산", value: "0원" },
  { label: "예상 달성일", value: "입력 필요" },
  { label: "이번 달 생활비", value: "0원 남음" },
  { label: "최단경로 단축", value: "0개월" },
];

export function DashboardOverview() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-mint">MillionMoa</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">월급으로 1억까지</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
          실수령, 통장 쪼개기, 생활비, 절세, 투자 시나리오를 연결해 1억까지의 최단 경로를 계산합니다.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-lg border border-ink/10 bg-white p-4 shadow-sm">
            <p className="text-sm text-ink/60">{metric.label}</p>
            <p className="mt-2 text-xl font-semibold text-ink">{metric.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create app files**

Create `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: #f7f5ef;
  color: #17201a;
}
```

Create `src/components/app-shell.tsx`:

```tsx
import type { ReactNode } from "react";

const navItems = ["대시보드", "월급 설계", "목표 시뮬레이터", "절세 플래너", "가계부", "리포트"];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="font-semibold text-ink">MillionMoa</div>
          <nav aria-label="Primary" className="hidden gap-5 text-sm text-ink/70 md:flex">
            {navItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
```

Create `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MillionMoa",
  description: "월급으로 1억까지, 가장 빠른 설계",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
import { AppShell } from "@/components/app-shell";
import { DashboardOverview } from "@/features/dashboard/dashboard-overview";

export default function Home() {
  return (
    <AppShell>
      <DashboardOverview />
    </AppShell>
  );
}
```

- [ ] **Step 5: Verify UI test**

Run:

```bash
npm test -- src/features/dashboard/dashboard-overview.test.tsx
```

Expected: test passes.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components src/features
git commit -m "feat: add app shell and dashboard overview"
```

## Task 6: Full Verification

**Files:**
- Modify only if verification finds issues.

- [ ] **Step 1: Run full verification**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: all commands exit with code 0.

- [ ] **Step 2: Fix failures with TDD discipline**

If a behavior test fails, fix production code only after confirming the test failure is valid. If a config command fails, update only the relevant config file and rerun the command. If dependency version changes require equivalent config syntax, keep the same scripts and verification commands green.

- [ ] **Step 3: Commit verification fixes if needed**

```bash
git add .
git commit -m "chore: stabilize app scaffold verification"
```

## Self-Review

Spec coverage:

- This plan creates a runnable app shell, test setup, and first dashboard surface.
- It intentionally does not implement Supabase, Prisma, tax rules, ISA/IRP, dividend, or fastest-path calculators beyond a minimal timeline calculator.
- The next plan should be `calculation-engine`, focused on pure financial calculators with TDD.

Placeholder scan:

- No unresolved placeholder markers are required for implementation.
- Any config incompatibility from package version differences is handled in Task 2 with a concrete correction rule and verification command.

Type consistency:

- The only calculator API introduced here is `calculateMonthsToGoal(input): GoalTimelineResult`.
- The dashboard component exports `DashboardOverview`, matching the test and page import.

