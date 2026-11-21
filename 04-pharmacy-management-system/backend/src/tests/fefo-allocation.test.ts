import { calculateFefoAllocation, identifyExpiredBatches, BatchCandidate } from '../modules/fefo/fefo-engine';

describe('FEFO (First-Expired, First-Out) Inventory Allocation Engine', () => {
  const asOfDate = new Date('2026-11-20T12:00:00Z');

  const sampleBatches: BatchCandidate[] = [
    {
      id: 'batch_long_exp',
      lotNumber: 'LOT-2027',
      expiryDate: new Date('2027-06-01T00:00:00Z'),
      currentQty: 100,
      isQuarantined: false,
      costPriceCents: 500,
      sellingPriceCents: 1500
    },
    {
      id: 'batch_near_exp',
      lotNumber: 'LOT-2026-EARLY',
      expiryDate: new Date('2026-12-15T00:00:00Z'), // Earliest non-expired
      currentQty: 30,
      isQuarantined: false,
      costPriceCents: 500,
      sellingPriceCents: 1500
    },
    {
      id: 'batch_mid_exp',
      lotNumber: 'LOT-2027-MID',
      expiryDate: new Date('2027-01-10T00:00:00Z'),
      currentQty: 50,
      isQuarantined: false,
      costPriceCents: 500,
      sellingPriceCents: 1500
    },
    {
      id: 'batch_expired',
      lotNumber: 'LOT-EXPIRED',
      expiryDate: new Date('2026-10-01T00:00:00Z'), // Past expiry as of Nov 20, 2026
      currentQty: 25,
      isQuarantined: false,
      costPriceCents: 500,
      sellingPriceCents: 1500
    },
    {
      id: 'batch_quarantined',
      lotNumber: 'LOT-QUARANTINED',
      expiryDate: new Date('2027-03-01T00:00:00Z'),
      currentQty: 50,
      isQuarantined: true, // Quarantined
      costPriceCents: 500,
      sellingPriceCents: 1500
    }
  ];

  test('allocates strictly from earliest-expiring non-expired batch first', () => {
    const result = calculateFefoAllocation(sampleBatches, 20, asOfDate);

    expect(result.fulfilled).toBe(true);
    expect(result.totalAllocated).toBe(20);
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].batchId).toBe('batch_near_exp');
    expect(result.allocations[0].allocatedQty).toBe(20);
  });

  test('cascades allocation across multiple batches when requested quantity exceeds single batch', () => {
    // Request 60 units: Should take all 30 from batch_near_exp (Dec 2026), and remaining 30 from batch_mid_exp (Jan 2027)
    const result = calculateFefoAllocation(sampleBatches, 60, asOfDate);

    expect(result.fulfilled).toBe(true);
    expect(result.totalAllocated).toBe(60);
    expect(result.allocations).toHaveLength(2);

    expect(result.allocations[0].batchId).toBe('batch_near_exp');
    expect(result.allocations[0].allocatedQty).toBe(30);

    expect(result.allocations[1].batchId).toBe('batch_mid_exp');
    expect(result.allocations[1].allocatedQty).toBe(30);
  });

  test('excludes expired and quarantined batches from allocation candidates', () => {
    // Total non-expired valid = 30 + 50 + 100 = 180 units.
    // Expired (25) and Quarantined (50) must not be counted.
    const result = calculateFefoAllocation(sampleBatches, 180, asOfDate);
    expect(result.fulfilled).toBe(true);
    expect(result.totalAllocated).toBe(180);

    // Any request > 180 must throw INSUFFICIENT_STOCK
    expect(() => calculateFefoAllocation(sampleBatches, 181, asOfDate)).toThrow(/INSUFFICIENT_STOCK/);
  });

  test('identifyExpiredBatches correctly tags batches needing quarantine', () => {
    const expired = identifyExpiredBatches(sampleBatches, asOfDate);
    expect(expired).toHaveLength(1);
    expect(expired[0].id).toBe('batch_expired');
  });

  test('rejects negative or zero requested quantities', () => {
    expect(() => calculateFefoAllocation(sampleBatches, 0, asOfDate)).toThrow(
      'Requested quantity must be greater than zero.'
    );
  });
});
