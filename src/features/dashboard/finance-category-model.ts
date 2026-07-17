export type FinanceCategoryKind = "asset" | "liability" | "income" | "expense";

export type FinanceCategoryItem = {
  id: string;
  kind: FinanceCategoryKind;
  name: string;
  amountMan: string;
};

function toAmount(value: string) {
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function calculateCategoryTotals(items: FinanceCategoryItem[]) {
  const totals = {
    assetMan: 0,
    liabilityMan: 0,
    incomeMan: 0,
    expenseMan: 0,
  };

  for (const item of items) {
    const amount = toAmount(item.amountMan);
    if (item.kind === "asset") totals.assetMan += amount;
    if (item.kind === "liability") totals.liabilityMan += amount;
    if (item.kind === "income") totals.incomeMan += amount;
    if (item.kind === "expense") totals.expenseMan += amount;
  }

  return {
    ...totals,
    netWorthMan: totals.assetMan - totals.liabilityMan,
    monthlyContributionMan: totals.incomeMan - totals.expenseMan,
  };
}

export function addCategoryItem(items: FinanceCategoryItem[], item: FinanceCategoryItem) {
  return [...items, item];
}

export function updateCategoryItem(
  items: FinanceCategoryItem[],
  id: string,
  patch: Partial<Omit<FinanceCategoryItem, "id" | "kind">>,
) {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function removeCategoryItem(items: FinanceCategoryItem[], id: string) {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return { items, removed: null, index: -1 };

  return {
    items: items.filter((item) => item.id !== id),
    removed: items[index],
    index,
  };
}

export function restoreCategoryItem(
  items: FinanceCategoryItem[],
  item: FinanceCategoryItem,
  index: number,
) {
  const next = [...items];
  next.splice(Math.max(0, Math.min(index, next.length)), 0, item);
  return next;
}
