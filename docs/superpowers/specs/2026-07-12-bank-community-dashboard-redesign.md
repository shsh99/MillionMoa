# MillionMoa Bank/Community Dashboard Redesign

## Goal

Make the current scaffold feel closer to a trusted Korean banking app and a fast-scanning finance community feed. The first screen should help a first-year worker understand the shortest path to 100 million KRW without reading a marketing page.

## References

- Toss-style finance apps emphasize easy, at-a-glance money management and connected accounts, bills, spending, investments, and loans.
- KakaoBank-style product work emphasizes simplifying complex financial concepts into seamless user flows.
- Traditional Korean bank UI patterns lean on recognizable brand color, account summaries, recent activity, and large quick actions.

## Visual Direction

- Tone: calm, trusted, compact, and optimistic.
- Palette: warm off-white base, white surfaces, deep ink text, mint/deep green primary, small yellow accent.
- Avoid: purple gradients, decorative orbs, marketing hero layouts, oversized empty spacing, nested cards.
- Layout: bank dashboard first, community/action feed second.

## Screen Requirements

- Keep `월급으로 1억까지` as the main heading.
- Add a top summary panel with an obvious 100 million KRW goal progress signal.
- Keep the existing metric labels:
  - 현재 자산
  - 예상 달성일
  - 이번 달 생활비
  - 최단경로 단축
- Add new planning/action areas:
  - 세액공제 예상 환급
  - 이번 달 추천 액션
  - 생활비 통장 상태
  - ISA/IRP/적금/배당 재투자 후보
- Navigation must use real links.
- Keep skip link, main landmark, and visible focus styles.
- Cards must use 8px radius or less.

## Testing

- Update the dashboard overview test to assert the new user-visible financial planning sections.
- Run targeted dashboard test, lint, typecheck, and build.

