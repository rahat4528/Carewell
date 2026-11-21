# Pharmacy Management System: Test Suite

This test suite provides automated unit, concurrency, access control, and end-to-end integration verification for the Carewell Pharmacy Management System.

## Test Matrix

1. **FEFO Allocation Engine (`fefo-allocation.test.ts`)**:
   - Validates that earliest-expiring non-expired batches are allocated first.
   - Validates that expired batches are quarantined and skipped.
   - Validates multi-batch cascading allocation when requested quantity exceeds a single batch.
   - Validates rejection when total available non-expired stock is insufficient.

2. **Inventory Invariants & Concurrency (`inventory-concurrency.test.ts`)**:
   - Parallel race condition test where simultaneous dispensing attempts exceed remaining stock.
   - Confirms non-negative stock invariant is preserved and excess allocations are safely rejected with 409 Conflict.

3. **Controlled Substance Register (`controlled-substances.test.ts`)**:
   - Verification of DEA schedule requirements (prescriber DEA, NPI, patient ID, pharmacist credential).
   - Rejection when non-pharmacist attempts controlled substance dispensing.
   - Perpetual ledger entry creation and verification.

4. **Monetary Precision & POS Checkout (`pos-billing.test.ts`)**:
   - Exact integer cents calculations for subtotals, tax rates, and split payment totals.
   - Verification of receipt payload and inventory depletion.

5. **End-to-End Pharmacy Operations (`e2e.test.ts`)**:
   - Full lifecycle: Medication creation -> Goods receipt batch entry -> Prescription order review -> Pharmacist approval -> FEFO dispensing -> POS sale -> Append-only audit movement verification.

## Running Tests

```bash
cd backend
npm test
```
