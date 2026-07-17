import { z } from "zod";
import {
  financeScenarioSchema,
  type FinanceScenarioInput,
} from "./finance-scenario-model";
import { calculateExpenseSummary } from "./expense-management-model";

export const FINANCE_SCENARIO_STORAGE_KEY = "millionmoa.finance-scenario";
const MAX_SERIALIZED_PAYLOAD_BYTES = 256 * 1_024;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const financeScenarioEnvelopeSchema = z.object({
  version: z.literal(2),
  scenario: financeScenarioSchema,
});

const legacyFinanceScenarioEnvelopeSchema = z.object({
  version: z.literal(1),
  scenario: z.object({
    monthlyNonLoanExpense: z.number().int().nonnegative(),
  }).passthrough(),
});

const ownerIdSchema = z.string()
  .min(1)
  .max(128)
  .refine((ownerId) => ownerId === ownerId.trim(), "ownerId must not have surrounding whitespace");

function serializedByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function getFinanceScenarioStorageKey(ownerId: string): string {
  const validOwnerId = ownerIdSchema.parse(ownerId);
  return `${FINANCE_SCENARIO_STORAGE_KEY}.${encodeURIComponent(validOwnerId)}`;
}

export function saveFinanceScenario(
  storage: StorageLike,
  ownerId: string,
  scenario: FinanceScenarioInput,
): void {
  const canonicalScenario = {
    ...scenario,
    monthlyNonLoanExpense: calculateExpenseSummary(scenario.expenses).monthlyTotal,
  };
  const envelope = financeScenarioEnvelopeSchema.parse({ version: 2, scenario: canonicalScenario });
  const serialized = JSON.stringify(envelope);
  if (serializedByteLength(serialized) > MAX_SERIALIZED_PAYLOAD_BYTES) {
    throw new RangeError("finance scenario payload must not exceed 256 KiB");
  }
  storage.setItem(getFinanceScenarioStorageKey(ownerId), serialized);
}

export function loadFinanceScenario(
  storage: StorageLike,
  ownerId: string,
  fallback: FinanceScenarioInput,
): { scenario: FinanceScenarioInput; source: "saved" | "fallback" } {
  try {
    const storedValue = storage.getItem(getFinanceScenarioStorageKey(ownerId));
    if (storedValue === null) return { scenario: fallback, source: "fallback" };
    if (serializedByteLength(storedValue) > MAX_SERIALIZED_PAYLOAD_BYTES) {
      return { scenario: fallback, source: "fallback" };
    }

    const payload: unknown = JSON.parse(storedValue);
    const version = z.object({ version: z.union([z.literal(1), z.literal(2)]) }).parse(payload).version;
    if (version === 1) {
      const legacy = legacyFinanceScenarioEnvelopeSchema.parse(payload);
      const migrated = financeScenarioSchema.parse({
        ...legacy.scenario,
        expenses: [{
          id: "legacy-monthly-non-loan-expense",
          name: "기존 월 지출",
          kind: "living",
          categoryId: "living.other",
          amount: legacy.scenario.monthlyNonLoanExpense,
          frequency: "monthly",
          startDate: "1970-01-01",
          autoRenewal: true,
        }],
      });
      return { scenario: migrated, source: "saved" };
    }

    const envelope = financeScenarioEnvelopeSchema.parse(payload);
    return { scenario: envelope.scenario, source: "saved" };
  } catch {
    return { scenario: fallback, source: "fallback" };
  }
}
