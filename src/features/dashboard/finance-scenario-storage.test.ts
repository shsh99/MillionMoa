import { describe, expect, it } from "vitest";
import type { FinanceScenarioInput } from "./finance-scenario-model";
import {
  FINANCE_SCENARIO_STORAGE_KEY,
  loadFinanceScenario,
  saveFinanceScenario,
  type StorageLike,
} from "./finance-scenario-storage";

const scenario: FinanceScenarioInput = {
  assets: [{
    id: "parking",
    name: "Parking",
    category: "parking",
    balance: 5_000_000,
    annualRate: 0.03,
    monthlyContribution: 100_000,
    maturityMonth: 12,
  }],
  loans: [{
    id: "credit",
    name: "Credit",
    category: "credit",
    principal: 1_000_000,
    annualRate: 0.05,
    remainingMonths: 12,
    repaymentMethod: "equal-payment",
  }],
  manualLiabilities: 100_000,
  monthlyIncome: 3_000_000,
  monthlyNonLoanExpense: 1_500_000,
};

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("finance scenario storage", () => {
  it("roundtrips a validated scenario in a version 1 envelope", () => {
    const storage = new MemoryStorage();

    saveFinanceScenario(storage, scenario);

    expect(JSON.parse(storage.values.get(FINANCE_SCENARIO_STORAGE_KEY)!)).toEqual({
      version: 1,
      scenario,
    });
    expect(loadFinanceScenario(storage, { ...scenario, assets: [] })).toEqual({
      scenario,
      source: "saved",
    });
  });

  it.each([
    ["missing value", undefined],
    ["malformed JSON", "{"],
    ["invalid scenario", JSON.stringify({ version: 1, scenario: { ...scenario, monthlyIncome: -1 } })],
    ["unsupported version", JSON.stringify({ version: 2, scenario })],
  ])("returns the fallback for %s without mutating it", (_label, storedValue) => {
    const storage = new MemoryStorage();
    if (storedValue !== undefined) storage.values.set(FINANCE_SCENARIO_STORAGE_KEY, storedValue);
    const fallback = structuredClone(scenario);
    const before = structuredClone(fallback);

    const result = loadFinanceScenario(storage, fallback);

    expect(result).toEqual({ scenario: fallback, source: "fallback" });
    expect(result.scenario).toBe(fallback);
    expect(fallback).toEqual(before);
  });

  it("returns the fallback when getItem throws", () => {
    const storage: StorageLike = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {},
    };

    expect(loadFinanceScenario(storage, scenario)).toEqual({ scenario, source: "fallback" });
  });

  it("validates before writing and leaves storage unchanged on invalid data", () => {
    const storage = new MemoryStorage();

    expect(() => saveFinanceScenario(storage, { ...scenario, monthlyIncome: -1 })).toThrow();
    expect(storage.values.size).toBe(0);
  });

  it("propagates setItem failures without mutating the scenario", () => {
    const before = structuredClone(scenario);
    const storage: StorageLike = {
      getItem() { return null; },
      setItem() {
        throw new Error("quota exceeded");
      },
    };

    expect(() => saveFinanceScenario(storage, scenario)).toThrow("quota exceeded");
    expect(scenario).toEqual(before);
  });
});
