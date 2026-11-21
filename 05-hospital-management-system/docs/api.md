# Hospital Management System: API Reference

All endpoints are prefixed with `/api/v1` and require Bearer token authentication unless otherwise specified.

---

## 1. Authentication & Staff Roles (`/api/v1/auth`)
- `POST /register`: Register hospital staff account (`DOCTOR`, `NURSE`, `PATHOLOGIST`, `LAB_TECH`, `ADMIN`).
- `POST /login`: Authenticate and receive JWT.
- `GET /me`: Profile details.

---

## 2. Patients & Medical Records (`/api/v1/patients`)
- `GET /`: Search patient index by MRN, name, or DOB.
- `POST /`: Register new patient with validated Luhn MRN.
- `GET /:id`: Full patient chart (demographics, active allergies, encounter history).
- `GET /:id/fhir`: Standardized HL7 FHIR R4 Patient representation.

---

## 3. Inpatient Encounters, Wards & Bed Board (`/api/v1/inpatient`)
- `GET /wards`: List hospital wards with live occupancy count.
- `GET /wards/:id/beds`: Detailed bed layout with status indicators.
- `POST /admit`: Admit patient to an available bed in a ward (Atomic transaction).
- `POST /encounters/:id/transfer`: Transfer admitted patient to a new bed atomically.
- `POST /encounters/:id/discharge`: Discharge patient, compute room billing, and mark bed for `CLEANING`.

---

## 4. Vitals & Clinical Documentation (`/api/v1/clinical`)
- `POST /encounters/:id/vitals`: Record vital signs with physiological plausibility validation.
- `GET /encounters/:id/vitals`: Retrieve vital history.
- `POST /encounters/:id/notes`: Author SOAP clinical note.
- `POST /notes/:id/sign`: Permanently sign and lock clinical note (Attending physician only).
- `POST /notes/:id/addendum`: Append signed addendum to a locked note.

---

## 5. Laboratory & 4-Eyes Verification (`/api/v1/laboratory`)
- `POST /orders`: Place diagnostic laboratory order.
- `POST /orders/:id/collect`: Record specimen collection timestamp.
- `POST /orders/:id/results`: Lab technician inputs raw test results (`RESULT_PENDING_VERIFICATION`).
- `POST /orders/:id/verify`: Pathologist or attending physician verifies results (`RELEASED`).

---

## 6. Access Control & Emergency Break-Glass (`/api/v1/access`)
- `POST /encounters/:id/break-glass`: Clinician emergency access override with mandatory justification.
- `GET /audit/break-glass`: Compliance officer perpetual audit review.
