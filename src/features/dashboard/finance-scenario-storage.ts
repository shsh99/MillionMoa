import { z } from "zod";
import {
  financeScenarioSchema,
  type FinanceScenarioInput,
} from "./finance-scenario-model";

export const FINANCE_SCENARIO_STORAGE_KEY = "millionmoa.finance-scenario";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const financeScenarioEnvelopeSchema = z.object({
  version: z.literal(1),
  scenario: financeScenarioSchema,
});

export function saveFinanceScenario(
  storage: StorageLike,
  scenario: FinanceScenarioInput,
): void {
  const envelope = financeScenarioEnvelopeSchema.parse({ version: 1, scenario });
  storage.setItem(FINANCE_SCENARIO_STORAGE_KEY, JSON.stringify(envelope));
}

export function loadFinanceScenario(
  storage: StorageLike,
  fallback: FinanceScenarioInput,
): { scenario: FinanceScenarioInput; source: "saved" | "fallback" } {
  try {
    const storedValue = storage.getItem(FINANCE_SCENARIO_STORAGE_KEY);
    if (storedValue === null) return { scenario: fallback, source: "fallback" };

    const envelope = financeScenarioEnvelopeSchema.parse(JSON.parse(storedValue));
    return { scenario: envelope.scenario, source: "saved" };
  } catch {
    return { scenario: fallback, source: "fallback" };
  }
}
