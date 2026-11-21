# Pharmacy Management System: Requirements Specification

## 1. Functional Scope

### 1.1 Medication Catalog & Batch Tracking
- Support for branded, generic, OTC, and prescription pharmaceuticals.
- Tracking attributes: NDC (National Drug Code), generic name, brand name, dosage form (tablet, syrup, topical, injection), strength, package size, manufacturer, reorder threshold.
- Batch records: Unique lot number, manufacturer, received date, expiry date, initial quantity, current stock, acquisition unit cost, selling unit price.

### 1.2 FEFO Batch Allocation Algorithm
- Upon dispensing or point-of-sale checkout, the system queries active batches for the given medication sorted by `expiryDate ASC`.
- Expired batches (`expiryDate <= currentDate`) are automatically excluded and flagged as quarantined.
- Allocation cascades across batches until the requested quantity is satisfied.
- If total non-expired stock across all active batches is less than the requested quantity, the transaction is rejected (`INSUFFICIENT_STOCK`).

### 1.3 Concurrency Control & Non-Negative Inventory
- Concurrency protection guarantees that simultaneous dispensing requests cannot cause stock to drop below zero.
- Row-level lock or serializable transactional semantics ensure that batch inventory increments and decrements are atomic.

### 1.4 Append-Only Inventory Movements
- No stock quantity can be modified without writing a corresponding record to `InventoryMovement`.
- Fields: `id`, `batchId`, `medicationId`, `movementType` (`RECEIPT`, `DISPENSE`, `POS_SALE`, `ADJUSTMENT`, `RETURN`, `QUARANTINE`), `quantityChange`, `previousQuantity`, `newQuantity`, `referenceId`, `actorId`, `notes`, `createdAt`.

### 1.5 Point of Sale (POS)
- SKU/barcode search.
- Exact monetary computations in integer cents: `itemTotal = quantity * unitPriceCents`.
- Sales tax calculation with integer cents rounding.
- Split payments: Cash, Credit Card, Insurance Co-Pay.
- Printable receipt breakdown with sales identifier.

### 1.6 Controlled Substances Perpetual Register
- Classification by DEA Schedule (C-II, C-III, C-IV, C-V, Non-controlled).
- Schedule II through V dispensing requires:
  - Prescriber DEA registration number and NPI.
  - Valid photo ID type and verification number from patient/representative.
  - Pharmacist digital signature and license verification.
  - Perpetual balance recalculation and verification against physical count.

### 1.7 Prescription Order Review Workflow
- Order states: `PENDING_REVIEW` -> `PHARMACIST_VERIFIED` -> `READY_FOR_DISPENSE` -> `DISPENSED` (or `REJECTED`).
- Non-pharmacist staff cannot advance orders past `PENDING_REVIEW`.

---

## 2. Regulatory & Non-Diagnostic Constraints
- The software facilitates inventory accuracy and statutory recordkeeping.
- It does NOT provide autonomous medical diagnoses, drug-interaction override decisions, or automated prescribing.
- All operations require licensed human pharmacist verification.
