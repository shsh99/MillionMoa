import { z } from "zod";
import {
  financeScenarioSchema,
  type FinanceScenarioInput,
} from "./finance-scenario-model";

export const FINANCE_SCENARIO_STORAGE_KEY = "millionmoa.finance-scenario";
const MAX_SERIALIZED_PAYLOAD_BYTES = 256 * 1_024;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const financeScenarioEnvelopeSchema = z.object({
  version: z.literal(1),
  scenario: financeScenarioSchema,
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
  const envelope = financeScenarioEnvelopeSchema.parse({ version: 1, scenario });
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

    const envelope = financeScenarioEnvelopeSchema.parse(JSON.parse(storedValue));
    return { scenario: envelope.scenario, source: "saved" };
  } catch {
    return { scenario: fallback, source: "fallback" };
  }
}
