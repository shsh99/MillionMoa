---
name: finance-product-planning
description: "사회초년생 재무 대시보드의 MVP, 기능 우선순위, 화면 구조, 사용자 흐름, 백로그, 릴리즈 계획, 1억 목표 중심 제품 설계를 할 때 반드시 사용한다."
---

# Finance Product Planning

이 서비스는 단순 가계부가 아니라 100 million KRW 목표 달성을 중심으로 월급, 소비, 저축, 투자, 절세 계좌를 운영하는 도구이다.

## Product Center

Every feature should answer at least one question:

- How long until the user reaches the goal?
- What changed this month?
- What action shortens or protects the timeline?
- Which account should hold this money by purpose?

## MVP Boundary

Include:

- login,
- financial profile,
- current assets,
- default 100 million KRW goal,
- account/product allocation,
- manual ledger,
- dashboard and reports,
- calculator estimates.

Exclude from MVP:

- bank/card/brokerage auto-sync,
- product selling,
- trading,
- official tax filing,
- personalized investment advice.

## Release Planning

Use three levels:

- MVP: manually entered data, useful dashboard, core calculators.
- V1: richer reports, FSS product API, better onboarding.
- Later: regulated integrations, mydata/open banking, advanced recommendations.

## Acceptance Criteria

Each feature must have:

- user-facing outcome,
- required inputs,
- displayed outputs,
- empty state,
- validation state,
- test or verification path.
