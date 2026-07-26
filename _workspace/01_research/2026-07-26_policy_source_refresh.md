# 2026-07-26 Policy Source Refresh

Scope: financial product and tax/payroll source spot-check for the MillionMoa dashboard.

## Official Sources Checked

- 서민금융진흥원 청년미래적금: https://www.kinfa.or.kr/financialProduct/youthFutureSavings.do
- 서민금융진흥원 청년도약계좌: https://www.kinfa.or.kr/fill4young/financeCommercial/youthLongAsset.do
- 국토교통부 청년주택드림청약통장: https://www.molit.go.kr/2024dreamaccount/main.jsp
- 금융위원회 ISA 주요정책문답: https://www.fsc.go.kr/po020201/27339
- 국세청 근로소득 원천징수방법 및 간이세액표: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7862&mi=6583
- 국세청 비과세 근로소득: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7867&mi=6431
- 국세청 연금계좌 및 월세 세액공제 guidance: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=6596, https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=239025&mi=40613
- 국세청 중소기업 취업자 소득세 감면 guidance and 조세특례제한법 제30조: https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=239023, https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1028573667
- 국민연금공단 2026 기준소득월액 상하한액 안내: https://www.nps.or.kr/pnsgdnc/newgdnc/getOHAE0001M1.do?pstId=ZZ202600000000000147
- 국민건강보험 2026 보험료율 안내: https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html
- 고용노동부 고용보험료 안내: https://moel.go.kr/info/astmgmt/employ/employList.do

## Implementation Note

- Corrected 청년주택드림청약통장 income-deduction payment cap from 6,000,000 KRW to the official annual 3,000,000 KRW payment cap at a 40% deduction rate.
- Kept ISA proposed expansion out of calculations because the current product guide already marks it as unconfirmed.
- Kept salary/tax calculators estimate-framed and dependent on user-entered official/payslip income tax values rather than deriving withholding from annual brackets.
