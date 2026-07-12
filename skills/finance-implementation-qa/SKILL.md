---
name: finance-implementation-qa
description: "재무 대시보드 구현, 계산 로직, 인증, DB, 사용자별 데이터 격리, 정책값, 차트/폼 UI를 검증하거나 리뷰할 때 반드시 사용한다."
---

# Finance Implementation QA

QA는 존재 확인이 아니라 경계면 검증이다. 계산, DB, API, UI가 같은 데이터 모양과 같은 정책 가정을 쓰는지 확인한다.

## Review Priorities

1. User data isolation and auth.
2. Incorrect or misleading financial calculations.
3. Policy values hard-coded without versioning.
4. UI showing estimates as exact facts.
5. Missing edge case tests.
6. Broken backend/frontend data shapes.
7. Accessibility and mobile layout failures.

## Required Checks

- Every user-owned query is scoped by user id.
- Server-side validation exists for writes.
- Calculators are pure and unit-tested.
- Policy values are versioned or clearly centralized.
- Charts and metrics handle empty data.
- Negative cash flow does not produce misleading success.
- Goal already reached has a valid state.

## Output Format

Use severity:

- P0: data leak, destructive action, major financial falsehood.
- P1: broken core workflow or materially wrong calculation.
- P2: important edge case, missing validation, misleading copy.
- P3: polish or maintainability.

For each finding:

- severity,
- location,
- issue,
- evidence,
- recommended fix,
- test gap.
