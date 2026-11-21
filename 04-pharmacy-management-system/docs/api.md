# Pharmacy Management System: API Reference

All endpoints are prefixed with `/api/v1` and return standard JSON payloads. All financial values are expressed in integer cents.

---

## 1. Authentication (`/api/v1/auth`)
- `POST /register`: Register user account (`PHARMACIST`, `PHARMACY_TECH`, `ADMIN`, `PATIENT`).
- `POST /login`: Authenticate and receive signed JWT.
- `GET /me`: Retrieve authenticated staff profile.

---

## 2. Medications & Inventory (`/api/v1/medications`)
- `GET /`: Search medications by NDC, brand name, generic name, or DEA schedule.
- `POST /`: Create medication catalog item (Staff only).
- `GET /:id`: Retrieve detailed medication data including active batches.
- `GET /:id/batches`: List all batches with expiration and stock breakdown.
- `POST /:id/batches`: Add new batch (Goods Receipt / Purchase Order receipt).
- `POST /:id/quarantine-expired`: Scan and flag expired batches as quarantined.

---

## 3. FEFO Dispensing & Allocation (`/api/v1/dispense`)
- `POST /calculate-allocation`: Preview FEFO batch allocation for requested medication and quantity without committing.
- `POST /execute`: Execute transactional dispensing. Depletes batch stocks in FEFO order, records inventory movement, and generates dispense ticket.
- `POST /controlled-substance`: Dispense controlled medication. Enforces DEA number, patient photo ID, and pharmacist license signature.

---

## 4. Point of Sale (POS) (`/api/v1/pos`)
- `POST /checkout`: Process retail sale. Validates stock via FEFO, calculates tax and subtotal in integer cents, records payment method, prints receipt object.
- `GET /sales/:id`: Fetch itemized sales receipt.
- `GET /movements`: Append-only audit ledger of inventory movements.
