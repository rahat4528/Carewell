# Hospital Management System: Requirements Specification

## 1. Functional Scope

### 1.1 Inpatient & Outpatient EHR
- Patient demographics, national identifier, emergency contacts, primary language, insurance policy details.
- Medical Record Number (MRN) generation with Luhn check-digit verification.
- Allergy management with severity tiers (`LIFE_THREATENING`, `MODERATE`, `MILD`) and clinical reaction details.

### 1.2 Ward & Bed Allocation Engine
- Wards categorized by clinical specialty (ICU, General Medicine, General Surgery, Pediatrics, Maternity).
- Ward capacity, current occupancy, and nurse-to-patient staffing ratios.
- Bed management: status tracking (`AVAILABLE`, `OCCUPIED`, `CLEANING`, `MAINTENANCE`).
- Atomic bed reservation: admits patient to bed and locks bed in single transaction.
- Atomic bed transfer: transfers patient from source bed to target bed, marking source bed as `CLEANING` and target bed as `OCCUPIED`.

### 1.3 Plausible Vital Signs Logging
- Range checks on physiological indicators:
  - Heart Rate: 20 - 300 bpm
  - Systolic BP: 40 - 300 mmHg
  - Diastolic BP: 20 - 200 mmHg
  - Respiratory Rate: 4 - 80 bpm
  - Temperature: 30.0 - 45.0 °C
  - Oxygen Saturation (SpO2): 50 - 100%
- Physiological violations rejected with 400 Bad Request.
- Automatic risk classification (`NORMAL`, `WARNING`, `CRITICAL`).

### 1.4 Immutable Signed Clinical Notes
- SOAP format: Subjective, Objective, Assessment, Plan.
- Authoring states: `DRAFT` -> `SIGNED_AND_LOCKED`.
- Once locked, updates or deletions are rejected with 403 Forbidden.
- Addendum workflow: allows attending clinician to append notes referencing parent note ID.

### 1.5 Laboratory 4-Eyes Verification Workflow
- Lab order life cycle: `ORDERED` -> `SPECIMEN_COLLECTED` -> `RESULT_ENTERED` -> `PATHOLOGIST_VERIFIED` -> `RELEASED`.
- Lab technicians can enter results, but results are shielded from general clinical charts until verified by a certified pathologist or attending physician.

### 1.6 Relationship-Based Access Control (ReBAC) & Break-Glass Protocol
- Standard access granted only to assigned care team members (attending physician, assigned primary nurse, ward staff).
- Non-assigned staff attempting read access receive 403 Forbidden.
- Break-Glass protocol: Allows emergency clinician access upon submitting written clinical justification reason. Logs urgent audit record and alerts hospital compliance officer.

### 1.7 FHIR R4 Interoperability
- Export endpoints formatted according to HL7 FHIR R4 JSON schemas (`Patient`, `Encounter`, `Observation`, `DiagnosticReport`).

---

## 2. Regulatory & Non-Diagnostic Constraints
- The software performs workflow orchestration and clinical documentation.
- It does NOT provide autonomous clinical decisions, AI diagnosis, or autonomous triage orders.
- All clinical notes and care plans require human clinical authorization.
