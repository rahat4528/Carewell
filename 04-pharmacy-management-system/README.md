# Carewell Pharmacy Management System

The **Carewell Pharmacy Management System** is a standalone, production-ready pharmaceutical dispensary, batch-tracking inventory, point-of-sale (POS), and controlled substance compliance management engine.

---

## 1. Clinical & Regulatory Disclaimers

> **IMPORTANT CLINICAL & DISPENSING NOTICE:**
> The Carewell Pharmacy Management System is an administrative, inventory tracking, and point-of-sale platform. **It does not perform autonomous clinical diagnosis, drug therapy decisions, autonomous allergy evaluations, or autonomous prescription validation.**
> 
> All drug dispensings, dosage checks, allergy evaluations, and patient consultations must be reviewed and authorized by a licensed, human registered pharmacist in compliance with local pharmacy board regulations and federal statutory requirements.

---

## 2. Core Architectural Highlights

1. **FEFO (First-Expired, First-Out) Inventory Allocation Engine**:
   - Every medication unit belongs to a designated manufacturer batch with an expiration date, lot identifier, cost price, and retail selling price.
   - When items are dispensed or sold, stock is automatically allocated strictly by `expiryDate ASC`.
   - Batches past their expiration date (`expiryDate <= today`) are strictly quarantined and cannot be allocated for patient fulfillment.
   - If a batch has insufficient quantity to fulfill an order line, the algorithm splits and cascades the allocation across subsequent non-expired batches.

2. **Non-Negative Stock Invariant & Concurrency Locks**:
   - Stock balances can never drop below zero.
   - Parallel transactions are executed within serializable database transactions, preventing race-condition over-allocations.

3. **Append-Only Inventory Movement Ledger**:
   - Every stock transaction (`RECEIPT`, `DISPENSE`, `POS_SALE`, `ADJUSTMENT`, `RETURN`, `QUARANTINE`) writes an immutable ledger entry recording previous balance, quantity change, new balance, actor ID, and reference entity.

4. **Point of Sale (POS) & Exact Monetary Arithmetic**:
   - Monies and currency calculations use exact integer cents to eliminate IEEE 754 floating-point rounding errors.
   - Supports barcode/SKU scanning, multi-tender transactions (cash, card, insurance co-pay), receipt issuance, and instant inventory depletion.

5. **Controlled Substance Perpetual Register**:
   - Medications scheduled under DEA regulations (Schedule II through V) require mandatory prescriber DEA/NPI validation, patient identification verification, and pharmacist dual-signature prior to release.
   - Perpetual ledger maintains an unbroken, auditable chain of custody.

---

## 3. Technology Stack & Ports

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons (Port `3004`)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (Port `4004`)
- **Database**: PostgreSQL (Docker container on Port `5434`, database `carewell_pharmacy_db`); SQLite (`dev.db`) for self-contained testing.
- **Cache/Queue**: Redis (Port `6384`)

---

## 4. Setup & Running Instructions

### Local Development
```bash
# 1. Start Docker services (PostgreSQL & Redis)
docker-compose up -d

# 2. Setup and run Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm test
npm run dev

# 3. Setup and run Frontend
cd ../frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3004` and the backend REST API at `http://localhost:4004/api/v1`.
