# Finance Detail Disclosure

- Branch: `feat/finance-detail-disclosure`
- Scope: reduce mobile scrolling and input burden in the finance account editor.
- Asset setup now defaults to quick presets plus balance input; account name, type, annual rate, and monthly contribution live under `세부 조건`.
- Loan setup now defaults to quick presets plus principal input; loan name, type, rate, remaining months, and repayment method live under `세부 조건`.
- Disclosure buttons use `aria-expanded` and `aria-controls`; collapsed fields are not rendered into the accessibility tree.
- New account and starter-set creation focus the most important amount input instead of the name field.
- Guardrail: no projection, tax, product-rate, storage, or schema logic changed in this slice.
