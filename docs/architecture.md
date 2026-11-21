# Carewell System Architecture

## Architecture Overview

The Carewell platform maintains a decoupled multi-project repository architecture. Each project is an autonomous full-stack software application with its own frontend layer, backend services, dedicated database engine, background workers, and containerized dependencies.

```
Carewell/
├── docs/                                # Shared architectural and data protection standards
├── 01-fitness-tracker/                  # Personal fitness and workout monitoring
│   ├── frontend/                        # Next.js / Tailwind CSS / Recharts
│   ├── backend/                         # NestJS / Prisma ORM / BullMQ
│   ├── database/                        # PostgreSQL schema & migrations (carewell_fitness_db)
│   ├── tests/                           # Unit, API & integration suites
│   ├── docs/                            # App requirements, API specs, and completion report
│   └── docker-compose.yml               # Local Postgres, Redis, and service stack
├── 02-meal-planner-app/                 # Recipe planning & grocery logistics (carewell_meal_planner_db)
├── 03-doctor-appointment-system/        # Clinical scheduling & slot engine (carewell_appointments_db)
├── 04-pharmacy-management-system/       # Batch inventory, FEFO & POS (carewell_pharmacy_db)
└── 05-hospital-management-system/       # Inpatient, outpatient, lab & ward operations (carewell_hospital_db)
```

---

## Core Tenets

### 1. Zero Runtime Coupling
No application depends on another application's API, runtime service, or database. Inter-application boundaries are strictly honored. Where future interactions may occur (e.g. Hospital to Pharmacy), explicit integration adapters with mocked interfaces are utilized for isolated testing.

### 2. Dedicated Data Stores
Each application owns an isolated database schema:
- `carewell_fitness_db`
- `carewell_meal_planner_db`
- `carewell_appointments_db`
- `carewell_pharmacy_db`
- `carewell_hospital_db`

All monetary, quantity, and measurement data types leverage `NUMERIC` and `DECIMAL` types to avoid floating-point drift.

### 3. Asynchronous Processing via Queues
Background jobs (e.g., notification dispatch, data synchronization, expiry scanning, and metric aggregations) execute asynchronously via Redis-backed BullMQ queues, keeping client request-response cycles sub-100ms.

### 4. Storage Architecture
File uploads (such as prescription documents, lab results, and recipe photography) are stored in S3-compatible object stores (MinIO locally). Direct access is blocked; all downloads require short-lived, pre-signed authorization URLs verified against user permissions.
