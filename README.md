# Carewell

Carewell is an open-source collection of **5 independent, standalone, production-quality healthcare and health technology applications**.

Each application operates with complete independence: its own dedicated database, backend service, responsive frontend, migration scripts, testing suites, and containerized configuration. There is **no shared runtime database** and **no runtime coupling** between systems.

---

## The 5 Standalone Applications

| Folder | Application Name | Category | Primary Capabilities |
|---|---|---|---|
| **[`01-fitness-tracker`](./01-fitness-tracker/)** | **Fitness Tracker** | Wellness & Activity | Workouts, exercise catalog, set logging, rest timer, progressive overload tracking, body measurements, estimated calorie burn. |
| **[`02-meal-planner-app`](./02-meal-planner-app/)** | **Meal Planner App** | Nutrition & Diet | Recipe organization, weekly meal calendar, serving scaling, aisle-grouped shopping lists with pantry subtraction, estimated macro tracking. |
| **[`03-doctor-appointment-system`](./03-doctor-appointment-system/)** | **Doctor Appointment System** | Clinical Scheduling | Doctor discovery by specialty/location, timezone-aware availability, double-booking prevention, atomic rescheduling, patient timelines. |
| **[`04-pharmacy-management-system`](./04-pharmacy-management-system/)** | **Pharmacy Management System** | Pharmacy Logistics | FEFO batch inventory, POS billing, purchase order workflows, non-negative stock invariants, prescription review & dispensing logs. |
| **[`05-hospital-management-system`](./05-hospital-management-system/)** | **Hospital Management System** | Enterprise Inpatient/Outpatient | MRN generation, ward & bed allocation, clinical notes with locked signatures, allergy banners, lab orders with 4-eyes verification, billing. |

---

## Shared Engineering & Privacy Standards

- **Strict Application Independence**: Every project includes its own `frontend/`, `backend/`, `database/`, `tests/`, `docker-compose.yml`, and `README.md`.
- **Health Data Privacy & Security**:
  - Role-based and relationship-based access controls across all read/write paths.
  - Field-level AES-256-GCM encryption for sensitive clinical records.
  - Tamper-evident, hash-chained, append-only audit trails.
  - Zero Personal Health Information (PHI) leaked in logs or error messages.
  - Safe data export and account deletion workflows for consumer apps.
- **Exact Decimal Precision**: All monetary values, inventory units, and clinical measurements use PostgreSQL `NUMERIC` and exact decimal mathematics to prevent floating-point drift.
- **Canonical Units**: Measurements stored in metric canonical units (kg, cm, sec) with lossless conversion for display preferences.
- **Synthetic Test Data Only**: All fixtures, seed databases, and automated tests use entirely synthetic, generated data.

---

## Medical Disclaimer

> **IMPORTANT**: The software in this repository is designed exclusively for informational, workflow, and operational tracking purposes. **No application in Carewell makes autonomous medical diagnoses, recommends clinical treatments, or calculates medication prescriptions.** Any clinical decision must be made by a qualified, licensed healthcare professional. For immediate medical emergencies, contact local emergency services immediately.

---

## Repository Structure

```
Carewell/
├── LICENSE
├── README.md
├── PROGRESS.md
├── docs/
│   ├── repository-overview.md
│   ├── architecture.md
│   ├── technology-stack.md
│   ├── development-guide.md
│   ├── project-index.md
│   └── health-data-protection.md
├── 01-fitness-tracker/
├── 02-meal-planner-app/
├── 03-doctor-appointment-system/
├── 04-pharmacy-management-system/
└── 05-hospital-management-system/
```

---

## Quick Start (Per-Application)

To run any application, consult its dedicated `README.md`. For example, for the **Fitness Tracker**:

```bash
cd 01-fitness-tracker
docker-compose up -d
cd backend && npm install && npm run test && npm run start:dev
# in another terminal:
cd frontend && npm install && npm run dev
```

Refer to [`docs/development-guide.md`](./docs/development-guide.md) for full developer instructions.
