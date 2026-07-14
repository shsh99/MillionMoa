export type CashBucketInput = {
  key: string;
  label: string;
  amount: number;
};

export type CashBucketAllocationStatus = "surplus" | "balanced" | "overallocated" | "invalid";

export type CashBucketAllocationReason =
  | "assigned-exceeds-income"
  | "negative-amount"
  | "invalid-number"
  | "non-integer-krw"
  | "duplicate-bucket";

export type CashBucketAllocatorInput = {
  monthlyTakeHomePay: number;
  buckets: CashBucketInput[];
};

export type AllocatedCashBucket = CashBucketInput & {
  shareOfIncome: number;
};

export type CashBucketAllocatorResult = {
  status: CashBucketAllocationStatus;
  reason?: CashBucketAllocationReason;
  monthlyTakeHomePay: number;
  totalAssigned: number | null;
  unassignedCash: number | null;
  overallocatedAmount: number | null;
  buckets: AllocatedCashBucket[];
};

function calculateShareOfIncome(amount: number, monthlyTakeHomePay: number): number {
  if (monthlyTakeHomePay === 0) {
    return 0;
  }

  return amount / monthlyTakeHomePay;
}

function hasDuplicateBucketKey(buckets: CashBucketInput[]): boolean {
  const keys = new Set<string>();

  return buckets.some((bucket) => {
    if (keys.has(bucket.key)) {
      return true;
    }

    keys.add(bucket.key);
    return false;
  });
}

function invalidResult(
  input: CashBucketAllocatorInput,
  reason: CashBucketAllocationReason,
): CashBucketAllocatorResult {
  return {
    status: "invalid",
    reason,
    monthlyTakeHomePay: input.monthlyTakeHomePay,
    totalAssigned: null,
    unassignedCash: null,
    overallocatedAmount: null,
    buckets: [],
  };
}

export function allocateCashBuckets(input: CashBucketAllocatorInput): CashBucketAllocatorResult {
  if (
    !Number.isFinite(input.monthlyTakeHomePay) ||
    input.buckets.some((bucket) => {
      return !Number.isFinite(bucket.amount);
    })
  ) {
    return invalidResult(input, "invalid-number");
  }

  if (
    input.monthlyTakeHomePay < 0 ||
    input.buckets.some((bucket) => {
      return bucket.amount < 0;
    })
  ) {
    return invalidResult(input, "negative-amount");
  }

  if (
    !Number.isInteger(input.monthlyTakeHomePay) ||
    input.buckets.some((bucket) => {
      return !Number.isInteger(bucket.amount);
    })
  ) {
    return invalidResult(input, "non-integer-krw");
  }

  if (hasDuplicateBucketKey(input.buckets)) {
    return invalidResult(input, "duplicate-bucket");
  }

  const totalAssigned = input.buckets.reduce((sum, bucket) => sum + bucket.amount, 0);
  const unassignedCash = Math.max(input.monthlyTakeHomePay - totalAssigned, 0);
  const overallocatedAmount = Math.max(totalAssigned - input.monthlyTakeHomePay, 0);
  const buckets = input.buckets.map((bucket) => {
    return {
      ...bucket,
      shareOfIncome: calculateShareOfIncome(bucket.amount, input.monthlyTakeHomePay),
    };
  });

  if (overallocatedAmount > 0) {
    return {
      status: "overallocated",
      reason: "assigned-exceeds-income",
      monthlyTakeHomePay: input.monthlyTakeHomePay,
      totalAssigned,
      unassignedCash,
      overallocatedAmount,
      buckets,
    };
  }

  return {
    status: unassignedCash === 0 ? "balanced" : "surplus",
    monthlyTakeHomePay: input.monthlyTakeHomePay,
    totalAssigned,
    unassignedCash,
    overallocatedAmount,
    buckets,
  };
}
