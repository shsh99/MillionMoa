import { describe, expect, it } from "vitest";
import type { FinanceScenarioInput } from "./finance-scenario-model";
import {
  FINANCE_SCENARIO_STORAGE_KEY,
  getFinanceScenarioStorageKey,
  loadFinanceScenario,
  saveFinanceScenario,
  type StorageLike,
} from "./finance-scenario-storage";

const OWNER_ID = "local-demo";

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
  expenses: [{
    id: "living-other",
    name: "Living expenses",
    kind: "living",
    categoryId: "living.other",
    amount: 1_500_000,
    frequency: "monthly",
    startDate: "2026-07-17",
    autoRenewal: true,
  }],
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
  it("roundtrips a validated scenario in a version 2 envelope", () => {
    const storage = new MemoryStorage();

    saveFinanceScenario(storage, OWNER_ID, scenario);

    expect(JSON.parse(storage.values.get(getFinanceScenarioStorageKey(OWNER_ID))!)).toEqual({
      version: 2,
      scenario,
    });
    expect(loadFinanceScenario(storage, OWNER_ID, { ...scenario, assets: [] })).toEqual({
      scenario,
      source: "saved",
    });
  });

  it("isolates saved scenarios by encoded owner scope", () => {
    const storage = new MemoryStorage();
    const secondScenario = { ...scenario, monthlyIncome: 9_000_000 };

    saveFinanceScenario(storage, "user/one@example.com", scenario);
    saveFinanceScenario(storage, "user/two@example.com", secondScenario);

    expect(getFinanceScenarioStorageKey("user/one@example.com")).toBe(
      `${FINANCE_SCENARIO_STORAGE_KEY}.user%2Fone%40example.com`,
    );
    expect(loadFinanceScenario(storage, "user/one@example.com", secondScenario)).toEqual({
      scenario,
      source: "saved",
    });
    expect(loadFinanceScenario(storage, "user/two@example.com", scenario)).toEqual({
      scenario: secondScenario,
      source: "saved",
    });
    expect(storage.values.has(FINANCE_SCENARIO_STORAGE_KEY)).toBe(false);
  });

  it.each([
    ["missing value", undefined],
    ["malformed JSON", "{"],
    ["invalid scenario", JSON.stringify({ version: 2, scenario: { ...scenario, monthlyIncome: -1 } })],
    ["unsupported version", JSON.stringify({ version: 3, scenario })],
  ])("returns the fallback for %s without mutating it", (_label, storedValue) => {
    const storage = new MemoryStorage();
    if (storedValue !== undefined) {
      storage.values.set(getFinanceScenarioStorageKey(OWNER_ID), storedValue);
    }
    const fallback = structuredClone(scenario);
    const before = structuredClone(fallback);

    const result = loadFinanceScenario(storage, OWNER_ID, fallback);

    expect(result).toEqual({ scenario: fallback, source: "fallback" });
    expect(result.scenario).toBe(fallback);
    expect(fallback).toEqual(before);
  });

  it("migrates a version 1 aggregate into exactly one monthly living expense", () => {
    const storage = new MemoryStorage();
    const { expenses: _expenses, ...legacyScenario } = scenario;
    storage.values.set(
      getFinanceScenarioStorageKey(OWNER_ID),
      JSON.stringify({ version: 1, scenario: legacyScenario }),
    );

    const result = loadFinanceScenario(storage, OWNER_ID, scenario);

    expect(result).toEqual({
      source: "saved",
      scenario: {
        ...legacyScenario,
        expenses: [{
          id: "legacy-monthly-non-loan-expense",
          name: "기존 월 지출",
          kind: "living",
          categoryId: "living.other",
          amount: 1_500_000,
          frequency: "monthly",
          startDate: "1970-01-01",
          autoRenewal: true,
        }],
      },
    });
  });

  it.each(["", "   ", "a".repeat(129)])("rejects invalid owner scope %j on save", (ownerId) => {
    const storage = new MemoryStorage();

    expect(() => getFinanceScenarioStorageKey(ownerId)).toThrow();
    expect(() => saveFinanceScenario(storage, ownerId, scenario)).toThrow();
    expect(storage.values.size).toBe(0);
  });

  it.each(["", "   ", "a".repeat(129)])("falls back for invalid owner scope %j on load", (ownerId) => {
    const storage = new MemoryStorage();

    expect(loadFinanceScenario(storage, ownerId, scenario)).toEqual({
      scenario,
      source: "fallback",
    });
  });

  it("returns the fallback when getItem throws", () => {
    const storage: StorageLike = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {},
    };

    expect(loadFinanceScenario(storage, OWNER_ID, scenario)).toEqual({ scenario, source: "fallback" });
  });

  it("validates before writing and leaves storage unchanged on invalid data", () => {
    const storage = new MemoryStorage();

    expect(() => saveFinanceScenario(storage, OWNER_ID, { ...scenario, monthlyIncome: -1 })).toThrow();
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

    expect(() => saveFinanceScenario(storage, OWNER_ID, scenario)).toThrow("quota exceeded");
    expect(scenario).toEqual(before);
  });

  it("rejects oversized serialized payloads before writing", () => {
    const storage = new MemoryStorage();
    const escapedId = "\ud800".repeat(128);
    const escapedName = "\ud800".repeat(80);
    const oversized = {
      ...scenario,
      assets: Array.from({ length: 100 }, () => ({
        ...scenario.assets[0],
        id: escapedId,
        name: escapedName,
      })),
      loans: Array.from({ length: 100 }, (_, index) => ({
        ...scenario.loans[0],
        id: `${index}${escapedId}`.slice(0, 128),
        name: escapedName,
      })),
    };

    expect(() => saveFinanceScenario(storage, OWNER_ID, oversized)).toThrow("256 KiB");
    expect(storage.values.size).toBe(0);
  });

  it("falls back without parsing oversized stored payloads", () => {
    const storage = new MemoryStorage();
    storage.values.set(getFinanceScenarioStorageKey(OWNER_ID), " ".repeat(256 * 1_024 + 1));

    expect(loadFinanceScenario(storage, OWNER_ID, scenario)).toEqual({
      scenario,
      source: "fallback",
    });
  });

  it("strips unknown keys without allowing __proto__ pollution", () => {
    const storage = new MemoryStorage();
    const serialized = JSON.stringify({ version: 2, scenario });
    const payload = serialized.replace(
      '"monthlyIncome":3000000',
      '"unknown":"removed","__proto__":{"polluted":true},"monthlyIncome":3000000',
    ).replace(
      '"balance":5000000',
      '"assetUnknown":"removed","__proto__":{"polluted":true},"balance":5000000',
    );
    storage.values.set(getFinanceScenarioStorageKey(OWNER_ID), payload);

    const result = loadFinanceScenario(storage, OWNER_ID, scenario);

    expect(result.source).toBe("saved");
    expect(result.scenario).toEqual(scenario);
    expect(result.scenario).not.toHaveProperty("unknown");
    expect(result.scenario.assets[0]).not.toHaveProperty("assetUnknown");
    expect(Object.prototype).not.toHaveProperty("polluted");
  });
});
