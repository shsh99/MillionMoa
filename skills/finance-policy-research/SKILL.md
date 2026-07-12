---
name: finance-policy-research
description: "한국 급여, 원천세, 연말정산, 세액공제, 세액감면, 중소기업 취업자 소득세 감면, 4대보험, 국민연금, 건강보험, 장기요양, 고용보험, ISA, 중개형 ISA, 서민형 ISA, IRP, 연금저축, 금융상품 한눈에, 마이데이터 관련 최신 정책/공식 출처를 조사할 때 반드시 사용한다."
---

# Finance Policy Research

한국 개인재무 계산에 들어가는 정책값을 조사하고 구현 가능한 형태로 정리한다.

## Source Priority

1. Official government or public institution: NTS, Hometax, NPS, NHIS, MOHW, FSC, FSS, KFTC, law.go.kr.
2. Financial company product pages only for product-specific terms.
3. News and blogs only as signals for proposed or pending changes.

## Output Format

For each rule:

- Rule name
- Value
- Effective date
- Source URL
- Confidence: confirmed, likely, proposed, unresolved
- Implementation note

## Required Distinctions

- Confirmed law or official notice vs proposed bill.
- Annual limit vs total limit.
- Employee burden vs employer burden.
- Tax-free amount vs separated taxation rate.
- Tax credit vs tax reduction vs tax saving.
- Ordinary ISA tax benefit vs ISA-to-pension transfer tax credit.
- Estimate vs exact payroll result.

## Implementation Guidance

Policy values should become versioned configuration when:

- they change yearly,
- they differ by effective date,
- they are proposals,
- they depend on user attributes,
- or official rules are too complex for MVP precision.

## Safety

Do not call the product tax advice. Use "estimate", "simulation", and "planning assumption" for uncertain calculations.
