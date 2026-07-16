## Harness: First Salary Finance Dashboard

**Goal:** Build and evolve a login-based finance dashboard that helps Korean early-career workers plan salary, spending, savings, tax-advantaged accounts, and the path to 100 million KRW.

**Trigger:** For product planning, implementation planning, research, architecture, calculator design, UI work, backend work, QA, or follow-up changes for this finance dashboard, use the `finance-dashboard-orchestrator` skill. Simple one-off questions can be answered directly.

**Default Execution:** The administrator orchestrator decomposes work into bounded tasks and delegates independent work to sub-agents when useful. High-risk or policy-sensitive finance logic must be reviewed before implementation.

**Frontend Design Workflow:** For dashboard, SaaS, mobile-first finance, or UI/UX work, apply `create-plan`, `design-md-style-control`, and `taste-skill` before implementation. Use DESIGN.md-style constraints to avoid generic AI UI, keep interactions production-grade, and verify desktop/mobile usability before completion.

**Branch Strategy:**
- `main`: stable release branch. Merge only reviewed and verified work.
- `dev`: integration branch for completed feature work.
- `feat/*`: feature branches created from `dev`; use the `feat/` prefix for new implementation and planning work.

**Change History:**
| Date | Change | Target | Reason |
|------|--------|--------|--------|
| 2026-07-12 | Initial harness setup | agents/, skills/, AGENTS.md | Establish orchestrated sub-agent workflow for the finance dashboard |
| 2026-07-12 | Added privacy and financial safety reviewer | agents/privacy-safety-reviewer.md, finance-dashboard-orchestrator | Separate privacy/data exposure and investment-advice wording review |
| 2026-07-12 | Added tax settlement and surplus cash planning scope | design spec, policy/calculation/orchestrator skills | Support year-end refund, tax credits, small-business reduction, bonuses, surplus cash, and dividend projections |
| 2026-07-12 | Added Git branch strategy | AGENTS.md | Use main/dev/feat workflow for project work |
| 2026-07-12 | Added fastest-path planning scope | design spec, orchestrator/calculation skills | Combine salary surplus, account splitting, tax refunds, ISA/IRP, interest, dividends, and bonuses into shortest 100 million KRW scenarios |
| 2026-07-16 | Applied DESIGN.md, taste-skill, and create-plan workflow | AGENTS.md, Codex skills | Raise frontend/UI work to production fintech design standards and keep repeated work planned |
