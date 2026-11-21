# Doctor Appointment System (`03-doctor-appointment-system`)

A clinical booking portal and scheduling platform connecting patients with licensed physicians and outpatient healthcare clinics. Features timezone-aware slot discovery, atomic concurrency controls preventing double-booking, atomic rescheduling, waitlist redistribution, encrypted clinical notes, and administrator verification gating.

---

## Features

- **Doctor Discovery & Verification**:
  - Filter verified practitioners by medical specialty (Cardiology, Dermatology, Pediatrics, Orthopedics, Family Medicine, Neurology) and clinic location.
  - Doctor profiles displaying qualifications, consultation fees, and verified credentials.
  - Verification gating (`PENDING_VERIFICATION` -> `VERIFIED` / `REJECTED`).
- **Atomic Scheduling Engine**:
  - Derived backend time slots with customizable buffer intervals.
  - Cross-clinic conflict protection: prevents double-booking a physician across multiple facilities.
  - Absolute double-booking prevention via transactional row-locking and uniqueness invariants.
  - Atomic rescheduling (moves slot and releases prior slot in one transaction).
  - Timezone-aware scheduling (UTC persistence with clinic IANA zone).
- **Patient Appointment Lifecycle**:
  - State machine: `REQUESTED` -> `CONFIRMED` -> `CHECKED_IN` -> `COMPLETED`.
  - Cancellation policy requiring minimum notice window (24 hours).
  - Appointment history timeline with audit tracking.
- **Waiting Lists & Redistribution**:
  - Queue mechanism offering cancelled slots to the earliest eligible waitlisted patient.
  - Time-bounded offers with automatic expiration and duplicate prevention.
- **Privacy & Clinical Data Protection**:
  - Field-level AES-256-GCM encryption for consultation notes.
  - Strict clinical access control: notes viewable only by treating physician and patient (administrators denied by default).
  - Tamper-evident SHA-256 hash-chained audit logging for all note reads.
  - Teleconsultation links restricted to active consultation window (15 mins prior to 60 mins after).
  - Privacy-preserving notifications with zero clinical text in email payloads.

---

## Medical Disclaimer

> **IMPORTANT**: The Doctor Appointment System is strictly an administrative scheduling and appointment logistics platform. It does NOT make autonomous medical diagnoses, triage patients, recommend treatments, or evaluate clinical urgency. Patients facing acute medical symptoms or emergencies must immediately contact local emergency services.

---

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Express modular TypeScript service, Prisma ORM, BullMQ.
- **Database**: PostgreSQL 16 (`carewell_appointments_db`), Redis 7.
- **Testing**: Jest unit & integration test suites, Supertest.

---

## Local Development & Setup

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Backend Setup & Database Migration
```bash
cd backend
npm install
npx prisma db push
npm run seed
npm run start:dev
```
Backend runs on `http://localhost:4003`.

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3003`.

---

## Testing

Run unit tests, calculation validation, and integration tests:
```bash
cd backend
npm run test
```
