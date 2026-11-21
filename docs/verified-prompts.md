# Carewell Verified Build Prompts Suite

This document contains the complete, logically validated, and production-tested prompts used to build the five independent applications in the Carewell repository.

---

## Part 1: Master Orchestration Prompt

```markdown
You are a senior full-stack software engineer. Your task is to build the GitHub repository "Carewell" (Healthcare and Health Technology), containing exactly 5 independent, standalone, production-quality healthcare applications.

### 1. REPOSITORY & RUNTIME RULES
- Repository Name: Carewell
- Remote: https://github.com/rahat4528/Carewell.git
- Branch: main
- Complete Independence: Each application must have its own frontend, backend, database schema, migrations, tests, docker-compose.yml, and documentation. There is NO shared runtime database and NO cross-project imports.
- Zero External Reference Mentions: Never mention, link to, or credit any private reference codebase or third-party reference brands. All code, tests, schemas, and seed data must be 100% original.
- Non-Diagnostic Medical Disclaimer: No application makes autonomous medical diagnoses, clinical treatment recommendations, or autonomous prescriptions. All services must return explicit medical disclaimers in headers and UI banners.
- Synthetic Data Only: All seed data, test fixtures, and mock entities must be completely synthetic. Never use real personal or health data.

### 2. DEDICATED PORT ALLOCATIONS
- 01-fitness-tracker: DB 5431, Backend 4001, Frontend 3001
- 02-meal-planner-app: DB 5432, Backend 4002, Frontend 3002
- 03-doctor-appointment-system: DB 5433, Backend 4003, Frontend 3003
- 04-pharmacy-management-system: DB 5434, Backend 4004, Frontend 3004
- 05-hospital-management-system: DB 5435, Backend 4005, Frontend 3005

### 3. HEALTH DATA PROTECTION STANDARDS
- Security at Rest: Sensitive health fields, tokens, and clinical notes must be encrypted using AES-256-GCM.
- Access Control: Enforce Role-Based (RBAC) and Relationship-Based (ReBAC) access control on every read/write path.
- Audit Logging: Maintain an append-only, tamper-evident audit log with SHA-256 hash chaining for all sensitive entity reads and mutations.
- Monetary & Quantitative Precision: All monetary transactions must use exact integer cents or NUMERIC types; never use floating point for currency or drug dosages.

### 4. PHASE PROGRESSION GATE
Work phase by phase (Phase 1 through Phase 5). Each phase must:
1. Implement the database schema and seed data.
2. Implement the backend API with authentication and core business engines.
3. Implement the responsive frontend UI.
4. Implement and pass 100% of the unit, integration, and security test suites.
5. Generate docs/requirements.md, docs/architecture.md, docs/api.md, docs/completion-report.md, and README.md.
6. Commit and push before starting the next phase: feat(<project-folder>): complete phase <N> - <short summary>.
```

---

## Part 2: Phased Execution Prompts

### Phase 1: Fitness Tracker (`01-fitness-tracker`)

```markdown
Build Phase 1 of Carewell: "01-fitness-tracker" (Fitness Tracker).

### Scope & Core Capabilities
1. User Management & Metrics:
   - Authentication (bcrypt, JWT) with user profiles (sex, birth date, height in cm, weight in kg).
   - Unit system preference toggle (Metric vs Imperial).
   - Canonical Storage Invariant: Permanently store all body measurements and exercise loads in canonical metric units (kg, cm, meters, seconds); convert solely at presentation boundaries.
2. Exercise Catalog:
   - Exercise categories (STRENGTH, CARDIO, FLEXIBILITY, CALISTHENICS, OLYMPIC).
   - Primary and secondary muscle groups; equipment filters.
   - Scoped custom exercise creation.
3. Workout Execution & Rest Timer:
   - Workout plans, routines, and real-time session logging with set types (WARMUP, NORMAL, DROPSET, FAILURE).
   - Configurable rest interval countdown with timestamp-based drift resilience and completion chimes.
4. Progressive Overload & Formulas:
   - Volume Load = sum(weight * reps) for completed sets.
   - Epley Estimated 1RM: weight * (1 + reps / 30) for reps > 1; exact weight for reps = 1.
   - Dynamic PR recomputation engine: editing/deleting a historical set automatically recalculates personal records.
5. Activity & Energy Expenditure:
   - Daily activity tracking (steps, distance in meters, active time).
   - Calorie Burn: MET * weight_kg * duration_hours with explicit non-diagnostic estimation disclaimers.
6. Privacy & Integrations:
   - Wearable sync adapter with AES-256-GCM encrypted OAuth tokens and externalRecordId deduplication.
   - SHA-256 hash-chained append-only audit trail.
   - Complete GDPR JSON export and cascading account erasure.

### Testing & Deliverables
- Write unit and e2e test suites covering Epley formula, MET calculations, unit conversions, PR recomputation, token encryption, and audit chain verification.
- Provide docker-compose.yml (Postgres on 5431, Redis), .env.example, README.md, and docs/.
- Verify all tests pass before committing.
```

---

### Phase 2: Meal Planner App (`02-meal-planner-app`)

```markdown
Build Phase 2 of Carewell: "02-meal-planner-app" (Meal Planner App).

### Scope & Core Capabilities
1. Household Collaboration & Profiles:
   - Household accounts with roles (OWNER, MEMBER, VIEWER).
   - Per-user dietary exclusion and allergen tags (VEGAN, GLUTEN_FREE, NUT_FREE, etc.).
2. Recipe Management & Scaling Engine:
   - Recipe catalog with ingredients, sequenced cooking steps, and tags.
   - Rational/Decimal Ingredient Scaling: Target Servings / Base Servings applied to scalable ingredients.
   - Non-scalable ingredients (e.g., salt to taste) must preserve text descriptions regardless of scaling.
   - Dimension-safe units: MASS (g, kg, oz, lb), VOLUME (ml, l, tsp, tbsp, cup), COUNT.
3. Weekly Meal Calendar:
   - 7-day grid segmented into BREAKFAST, LUNCH, DINNER, SNACK.
   - Daily nutritional estimation roll-ups (calories, protein, carbs, fat).
4. Intelligent Shopping List & Pantry:
   - Recipe-to-list compiler with dimension-aware ingredient merging.
   - Automatic pantry deduction based on current pantry stock.
   - Store aisle grouping (PRODUCE, DAIRY, PANTRY_BAKING, etc.).
   - Pantry shelf-life tracking with USE_SOON alerts (<= 5 days) and expired item quarantining.
5. Nutritional Data Provenance & Safety:
   - Grounded in open nutritional reference composition tables.
   - Incomplete data handling: Recipes missing nutritional values calculate partial macros and are explicitly tagged "INCOMPLETE".
   - Prominent clinical disclaimer that nutritional estimates are non-prescriptive.
6. SSRF-Protected Recipe Importer:
   - Schema.org Recipe JSON-LD web scraper.
   - Strict SSRF defense: rejects private/link-local/loopback IP ranges (127.0.0.1, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.169.254, ::1), limits response to 2MB, 5s timeout, max 3 redirects.

### Testing & Deliverables
- Write unit and integration tests covering rational scaling, shopping list compilation, pantry deduction, SSRF blocking, and incomplete nutrition handling.
- Provide docker-compose.yml (Postgres on 5432, Redis), .env.example, README.md, and docs/.
- Verify all tests pass before committing.
```

---

### Phase 3: Doctor Appointment System (`03-doctor-appointment-system`)

```markdown
Build Phase 3 of Carewell: "03-doctor-appointment-system" (Doctor Appointment System).

### Scope & Core Capabilities
1. Verification & Scheduling:
   - Roles: PATIENT, DOCTOR, ADMIN.
   - Doctor verification gating (PENDING_VERIFICATION -> VERIFIED). Unverified doctors cannot publish schedules.
   - Server-side slot generation with timezone awareness (UTC storage, clinic IANA timezones).
   - Cross-clinic conflict engine: prevents overlapping slots or travel buffer collisions across multiple clinics.
2. Concurrency & Booking Safety:
   - Zero double-booking guarantee: ACID transaction with row-level locking (SELECT ... FOR UPDATE) on slots.
   - Dynamic test compatibility: booking tests must capture the dynamically winning patient token for subsequent steps.
   - Atomic rescheduling: allocating new slot and releasing prior slot in a single transaction; failure of new slot leaves old slot intact.
   - State machine: REQUESTED -> CONFIRMED -> CHECKED_IN -> COMPLETED (or CANCELLED/RESCHEDULED).
   - Enforce 24-hour cancellation notice policy.
3. Waitlist & Teleconsultation:
   - FIFO waitlist redistribution: cancellations automatically trigger time-bounded reservation offers (2 hours) to the next eligible patient.
   - Teleconsultation links shielded and accessible only within a window: 15 minutes prior to 60 minutes after appointment.
4. Clinical Privacy & Encryption:
   - Post-consultation SOAP notes encrypted at rest using AES-256-GCM.
   - ReBAC access control: notes viewable strictly by the patient and the treating doctor.
   - Append-only read auditing on all clinical records.

### Testing & Deliverables
- Write automated tests covering verification gating, slot generation, cross-clinic conflict detection, atomic booking race conditions, atomic rescheduling, ReBAC note encryption, and cancellation rules.
- Provide docker-compose.yml (Postgres on 5433, Redis), .env.example, README.md, and docs/.
- Verify all tests pass before committing.
```

---

### Phase 4: Pharmacy Management System (`04-pharmacy-management-system`)

```markdown
Build Phase 4 of Carewell: "04-pharmacy-management-system" (Pharmacy Management System).

### Scope & Core Capabilities
1. Medication Catalog & FEFO Inventory:
   - Branded, generic, and OTC medications with NDC, dosage form, and strength.
   - Batches with lot number, expiry date, acquisition cost, and selling price.
   - First-Expired, First-Out (FEFO) allocation algorithm: allocations sort strictly by earliest expiry date.
   - Expired batches automatically quarantined and excluded from allocation.
2. Concurrency & Inventory Invariants:
   - Non-negative stock invariant under concurrent requests via serializable transactions and row-level locks.
   - Immutable, append-only InventoryMovement ledger for every stock delta (RECEIPT, DISPENSE, POS_SALE, ADJUSTMENT).
3. POS Retail Billing:
   - SKU barcode scanning, exact integer-cents arithmetic (unitPriceCents * quantity), and sales tax calculation.
   - Split-tender payment support (Cash, Card, Insurance Co-pay).
4. Controlled Substances Perpetual Register (DEA Title 21 CFR Part 1304):
   - DEA Schedules II through V tracking.
   - Prescriber DEA registration number validation with official checksum algorithm:
     (D1 + D3 + D5) + 2 * (D2 + D4 + D6), last digit matching D7.
   - Prescriber 10-digit NPI format validation.
   - Two-stage dispensing gate: strictly requires licensed pharmacist signature (technicians denied).
   - Patient photo ID recording with SHA-256 cryptographic hashing to avoid plain PII persistence.

### Testing & Deliverables
- Write automated tests covering FEFO cascading allocation, non-negative inventory concurrency, POS integer-cents math, DEA checksum validation, pharmacist role enforcement, and patient ID hashing.
- Provide docker-compose.yml (Postgres on 5434, Redis), .env.example, README.md, and docs/.
- Verify all tests pass before committing.
```

---

### Phase 5: Hospital Management System (`05-hospital-management-system`)

```markdown
Build Phase 5 of Carewell: "05-hospital-management-system" (Hospital Management System).

### Scope & Core Capabilities
1. Patient Demographics & Identification:
   - Medical Record Number (MRN) generation with Luhn check-digit verification.
   - Allergy banner with severity classification (LIFE_THREATENING, MODERATE, MILD).
   - HL7 FHIR R4 JSON export endpoints (Patient, Encounter, Observation, DiagnosticReport).
2. Bed Management & Atomic Admissions:
   - Wards (ICU, General Medicine, Surgery, Pediatrics) and bed statuses (AVAILABLE, OCCUPIED, CLEANING).
   - Atomic bed admission: assigns patient and transitions bed to OCCUPIED in one transaction.
   - Atomic inter-ward transfer: transitions source bed to CLEANING and target bed to OCCUPIED.
   - Concurrency locking preventing double-allocation of beds.
3. Physiological Vitals & Triage:
   - Range validation rejecting physiologically implausible vitals (HR: 20-300 bpm, Systolic: 40-300 mmHg, SpO2: 50-100%, etc.).
   - Automatic risk categorization (NORMAL, WARNING, CRITICAL).
4. Immutable Signed SOAP Notes:
   - SOAP clinical notes lifecycle: DRAFT -> SIGNED_AND_LOCKED.
   - Signed notes permanently locked against modification or deletion (403 Forbidden).
   - Append-only signed addenda referencing parent locked notes.
5. Laboratory 4-Eyes Workflow:
   - ORDERED -> SPECIMEN_COLLECTED -> RESULT_ENTERED -> PATHOLOGIST_VERIFIED -> RELEASED.
   - Unverified lab results shielded from general clinical charts until pathologist verification.
6. ReBAC & Emergency Break-Glass:
   - Chart access restricted strictly to assigned care team members.
   - Emergency Break-Glass protocol: grants emergency clinician access upon submitting mandatory clinical justification reason (logged to audit).

### Testing & Deliverables
- Write automated tests covering Luhn MRN generation, FHIR R4 JSON schemas, vitals plausibility checks, atomic bed allocation and transfer, note signature immutability, lab 4-eyes workflow, and ReBAC break-glass controls.
- Provide docker-compose.yml (Postgres on 5435, Redis), .env.example, README.md, and docs/.
- Verify all tests pass before committing.
```
