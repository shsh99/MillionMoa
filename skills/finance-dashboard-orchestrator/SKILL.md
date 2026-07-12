---
name: finance-dashboard-orchestrator
description: "사회초년생 재무 대시보드 프로젝트의 관리자 오케스트레이터. 1억 최단경로, 월급 통장 쪼개기, 월급/세금/실수령, 연말정산 환급, 세액공제, 중소기업 취업자 소득세 감면, ISA/IRP/CMA/파킹통장/적금/투자, 성과급/여유자금 운용, 배당금, 가계부, 대시보드, 구현 계획, 리서치, 보완, 재실행, 업데이트, QA 요청 시 반드시 사용한다."
---

# Finance Dashboard Orchestrator

이 스킬은 First Salary Finance Dashboard 프로젝트의 관리자 오케스트레이션 절차이다. 사용자가 제품 기획, 구현, 리서치, 계산, UI, 백엔드, QA, 보완, 재실행을 요청하면 이 절차로 작업을 분해하고 필요한 서브 에이전트를 실행한다.

## Execution Mode

기본 실행 모드는 관리자 오케스트레이터 + 서브 에이전트 병렬 위임이다. 현재 사용 가능한 멀티에이전트 도구는 `multi_agent_v1.spawn_agent`, `wait_agent`, `send_input`, `close_agent`이므로, 팀 통신 도구가 없는 상황에서는 파일 기반 산출물과 관리자 통합으로 조율한다.

## Agent Roster

| Agent | File | Responsibility |
|------|------|----------------|
| admin-orchestrator | `agents/admin-orchestrator.md` | 작업 분해, 위임, 통합, 사용자 보고 |
| finance-policy-analyst | `agents/finance-policy-analyst.md` | 세금, 4대보험, ISA, IRP, 정책 출처 검증 |
| product-architect | `agents/product-architect.md` | MVP 범위, 화면, 사용자 흐름, 로드맵 |
| calculation-engineer | `agents/calculation-engineer.md` | 실수령, 복리, 절세, 목표 기간 계산 설계 |
| backend-data-engineer | `agents/backend-data-engineer.md` | DB, 인증, API, 데이터 격리, 정책값 버전관리 |
| frontend-ux-engineer | `agents/frontend-ux-engineer.md` | 대시보드 UX, 폼, 차트, 접근성, 반응형 |
| qa-risk-reviewer | `agents/qa-risk-reviewer.md` | 계산/정책/보안/인터페이스/테스트 검증 |
| privacy-safety-reviewer | `agents/privacy-safety-reviewer.md` | 개인정보, 금융정보 로그, 투자자문 오인, 면책 문구 검토 |

## Workflow

### Phase 0: Context Check

1. Read `AGENTS.md`.
2. Read the latest design/spec files under `docs/superpowers/specs/`.
3. Check whether `_workspace/` exists.
4. Decide execution type:
   - No `_workspace/`: initial run.
   - Existing `_workspace/` + user requests a specific section: partial rerun.
   - Existing `_workspace/` + new broad direction: archive old workspace as `_workspace_{YYYYMMDD_HHMMSS}` and start fresh.

### Phase 1: Task Decomposition

Break the request into bounded work packets. Use sub-agents only for independent work that can proceed while the admin handles the critical path.

Common task routing:

- Current policy or rates: finance-policy-analyst.
- Feature scope or roadmap: product-architect.
- Formula, edge case, or test matrix: calculation-engineer.
- Fastest path to 100 million KRW, paycheck splitting, parking/CMA interest, or living-expense buckets: product-architect + calculation-engineer + backend-data-engineer.
- Year-end tax refund, tax credit, tax reduction, surplus cash, or dividend logic: finance-policy-analyst + calculation-engineer.
- Database/auth/API design: backend-data-engineer.
- Screen/component/chart design: frontend-ux-engineer.
- Final review or risk check: qa-risk-reviewer.
- Privacy, data exposure, or financial-advice wording: privacy-safety-reviewer.

### Phase 2: Delegation

For each delegated task:

1. Provide the exact input files to read.
2. State whether file edits are allowed.
3. State the output path under `_workspace/`.
4. Require concise final output listing key findings and changed files.

Use this delegation shape:

```text
You are acting as {agent}. Read {agent file} and {relevant skill}. Task: {bounded task}. Input files: {paths}. Output: write or summarize {expected artifact}. Do not edit unrelated files.
```

### Phase 3: Local Critical Path Work

While sub-agents run, the admin performs non-overlapping work:

- create or update plan files,
- prepare schemas,
- inspect code,
- draft integration changes,
- write tests,
- or refine specs.

### Phase 4: Integration

Collect sub-agent results and reconcile conflicts:

- Official sources beat blogs, marketing pages, and old docs.
- User-approved product direction beats speculative feature expansion.
- Calculator uncertainty becomes configuration, not hard-coded precision.
- Security or user data isolation findings block completion until resolved.

### Phase 5: QA Gate

Before claiming work is complete:

1. Run relevant tests or verification commands.
2. Ask QA-risk-reviewer for independent review when finance logic, auth, DB, or cross-module integration changed.
3. Ask privacy-safety-reviewer for independent review when personal finance data handling, user-facing finance copy, or recommendation-like language changed.
4. Fix or explicitly report unresolved issues.

### Phase 6: Harness Evolution

If the same type of issue appears twice, update:

- an agent definition if role behavior is wrong,
- a skill if procedure is missing,
- `AGENTS.md` if trigger or history needs to persist.

## Workspace Convention

- `_workspace/00_input/`: copied or summarized user inputs.
- `_workspace/01_research/`: policy and market research.
- `_workspace/02_design/`: product, UI, backend, calculator plans.
- `_workspace/03_implementation/`: implementation notes.
- `_workspace/04_qa/`: verification and review reports.

Do not delete `_workspace/`; it is an audit trail.

## Error Handling

| Situation | Response |
|-----------|----------|
| One sub-agent fails | Continue if non-blocking; retry only if needed |
| Policy sources conflict | Keep both, prefer official, mark confidence |
| User requests regulated automation | Keep as manual/draft or approval-gated |
| Test cannot run | Report exact command and reason |
| Scope is too broad | Split into phases and implement the first useful slice |

## Test Scenarios

### Normal
User asks for a detailed implementation plan. Admin reads spec, spawns product/backend/calculation/UI reviewers, integrates results, writes a plan, then runs QA review.

### Error
Policy analyst cannot confirm a proposed ISA rule. Admin marks it as configurable and does not hard-code the proposed value.
