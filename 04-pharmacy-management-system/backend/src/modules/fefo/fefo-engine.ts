export interface BatchCandidate {
  id: string;
  lotNumber: string;
  expiryDate: Date;
  currentQty: number;
  isQuarantined: boolean;
  costPriceCents: number;
  sellingPriceCents: number;
}

export interface FefoAllocationItem {
  batchId: string;
  lotNumber: string;
  expiryDate: Date;
  allocatedQty: number;
  unitPriceCents: number;
  totalPriceCents: number;
}

export interface FefoResult {
  allocations: FefoAllocationItem[];
  totalAllocated: number;
  totalPriceCents: number;
  fulfilled: boolean;
}

/**
 * Pure FEFO (First-Expired, First-Out) Allocation Engine
 * Sorts non-quarantined, non-expired batches with positive stock by expiryDate ASC.
 * Allocates requested quantity greedily across batches.
 */
export function calculateFefoAllocation(
  batches: BatchCandidate[],
  requestedQuantity: number,
  asOfDate: Date = new Date()
): FefoResult {
  if (requestedQuantity <= 0) {
    throw new Error('Requested quantity must be greater than zero.');
  }

  // Filter: non-quarantined, not expired as of date, and has available stock
  const validBatches = batches
    .filter((b) => !b.isQuarantined && new Date(b.expiryDate) > asOfDate && b.currentQty > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const totalAvailable = validBatches.reduce((acc, b) => acc + b.currentQty, 0);
  if (totalAvailable < requestedQuantity) {
    throw new Error(
      `INSUFFICIENT_STOCK: Requested ${requestedQuantity} units, but only ${totalAvailable} units available across valid non-expired batches.`
    );
  }

  const allocations: FefoAllocationItem[] = [];
  let remaining = requestedQuantity;
  let totalPriceCents = 0;

  for (const batch of validBatches) {
    if (remaining <= 0) break;

    const alloc = Math.min(remaining, batch.currentQty);
    const lineTotal = alloc * batch.sellingPriceCents;

    allocations.push({
      batchId: batch.id,
      lotNumber: batch.lotNumber,
      expiryDate: new Date(batch.expiryDate),
      allocatedQty: alloc,
      unitPriceCents: batch.sellingPriceCents,
      totalPriceCents: lineTotal
    });

    remaining -= alloc;
    totalPriceCents += lineTotal;
  }

  return {
    allocations,
    totalAllocated: requestedQuantity - remaining,
    totalPriceCents,
    fulfilled: remaining === 0
  };
}

/**
 * Identifies expired batches needing quarantine
 */
export function identifyExpiredBatches(
  batches: BatchCandidate[],
  asOfDate: Date = new Date()
): BatchCandidate[] {
  return batches.filter((b) => !b.isQuarantined && new Date(b.expiryDate) <= asOfDate);
}
