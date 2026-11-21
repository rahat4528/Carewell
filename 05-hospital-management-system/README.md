# Carewell Hospital Management System

The **Carewell Hospital Management System** is an enterprise-grade clinical operations, inpatient EHR, bed allocation, laboratory information, and ward management platform.

---

## 1. Clinical & Regulatory Disclaimers

> **IMPORTANT CLINICAL & NON-DIAGNOSTIC NOTICE:**
> The Carewell Hospital Management System is an administrative, documentation, and operational orchestration software system. **It does not perform autonomous medical diagnosis, clinical treatment planning, or automated clinical decisions.**
> 
> All clinical assessments, vital signs evaluations, lab result reviews, and care plans must be performed and authorized by licensed physicians, registered nurses, and certified healthcare professionals in accordance with institutional protocols and clinical standards.

---

## 2. Core Architectural Highlights

1. **Enterprise EHR & MRN Generation**:
   - Generates Medical Record Numbers (MRN) equipped with a Luhn check digit (`MRN-XXXXX-C`) to prevent patient misidentification errors.
   - Patient charts maintain allergy records with clinical severity banners (`LIFE_THREATENING`, `MODERATE`, `MILD`), emergency contacts, and active encounter history.

2. **Ward & Inpatient Bed Allocation Engine**:
   - Real-time ward occupancy monitoring (ICU, Surgical, General Medical, Pediatrics, Maternity).
   - Atomic bed admissions and inter-ward transfers: simultaneous departure and arrival lock transactions prevent double-occupancy.
   - Bed status state machine (`AVAILABLE` -> `OCCUPIED` -> `CLEANING` -> `AVAILABLE`).

3. **Vital Signs Logging with Clinical Plausibility Bounds**:
   - Validates physiological plausibility (Heart Rate: 20-300 bpm, Systolic BP: 40-300 mmHg, Diastolic BP: 20-200 mmHg, Respiratory Rate: 4-80 bpm, Temp: 30.0-45.0 °C, SpO2: 50-100%).
   - Flags out-of-range anomalies with automated triage alerts (`CRITICAL`, `WARNING`).

4. **Signed Clinical Notes & Note Locking**:
   - Structured SOAP clinical documentation (Subjective, Objective, Assessment, Plan).
   - Once signed by an attending physician, notes are permanently LOCKED and tamper-evident.
   - Any modifications must be authored as append-only addenda linked to the parent note.

5. **Laboratory 4-Eyes Verification Workflow**:
   - Strict dual-custody verification: Lab technicians enter test results; certified pathologists or attending physicians must review and verify results before release to the primary patient chart.

6. **Relationship-Based Access Control (ReBAC) & "Break-Glass" Emergency Access**:
   - Clinicians can only view charts for patients admitted to their ward or assigned service.
   - In life-threatening emergencies, an unassigned clinician can invoke "Break-Glass" access with documented justification, unlocking the chart while triggering high-priority compliance audit notifications.

7. **FHIR R4 Diagnostic Subset**:
   - Standardized FHIR JSON export for `Patient`, `Encounter`, `Observation`, and `DiagnosticReport`.

---

## 3. Technology Stack & Ports

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons (Port `3005`)
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JSON Web Tokens (Port `4005`)
- **Database**: PostgreSQL (Docker container on Port `5435`, database `carewell_hospital_db`); SQLite (`dev.db`) for self-contained testing.
- **Cache/Queue**: Redis (Port `6385`)

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

The frontend will be available at `http://localhost:3005` and the backend REST API at `http://localhost:4005/api/v1`.
