# Health Data Protection & Privacy Architecture

This document establishes the uniform data governance, encryption, access control, and auditing guidelines implemented across all applications in Carewell.

---

## 1. Data Classification

All data handled across Carewell applications is categorized into strict tiers:

| Tier | Category | Examples | Security Controls |
|---|---|---|---|
| **Tier 1** | **Protected Health Information (PHI) & Clinical Records** | Medical notes, diagnoses, allergies, vitals, prescriptions, lab results | Field-level AES-256-GCM encryption, relationship-based access check, full audit logging |
| **Tier 2** | **Sensitive Personal & Body Metrics** | Body weight, circumference, workouts, dietary preferences | User-scoped RBAC, encryption at rest, secure export/deletion controls |
| **Tier 3** | **Administrative & Operational Data** | Schedules, clinic locations, batch stock, pricing, room occupancy | Role-based access control, transaction auditing |
| **Tier 4** | **Public & Catalog Data** | Exercise catalogs, food composition tables, doctor specialties | Public read access, admin-only write access |

---

## 2. Access Control Principles

1. **Principle of Least Privilege**: Users and roles are granted only the minimum permissions required to execute their responsibilities.
2. **Relationship-Based Access Control (ReBAC)**: In clinical apps (e.g. Hospital and Doctor Appointment systems), possession of a "Doctor" or "Nurse" role is insufficient on its own; there must be an active clinical relationship (an assigned appointment, admission, or ward assignment) to access patient records.
3. **Emergency "Break-Glass" Access**: Where life-critical access is required outside standard assignments, explicit break-glass requests must require a clinical justification reason, grant temporary time-bounded access, trigger instant administrative alerts, and remain immutable in the audit ledger.

---

## 3. Cryptographic Controls

- **Transport Layer**: Strict TLS 1.3 encryption across all network boundaries.
- **Application-Level Encryption**: Sensitive clinical fields (clinical notes, allergy reactions, prescriptions) undergo AES-256-GCM envelope encryption using keys stored in protected environment variables.
- **Credential Storage**: Passwords hashed with Argon2id or bcrypt using high cost factors and unique cryptographic salts.
- **Storage Security**: Document attachments (PDFs, scans) reside in private object storage buckets accessible only via signed URLs with 15-minute expirations.

---

## 4. Tamper-Evident Audit Logging

All access to Tier 1 and Tier 2 records triggers an append-only audit log entry storing:
- `actorId`, `actorRole`, `timestamp` (UTC)
- `action` (`READ`, `WRITE`, `EXPORT`, `BREAK_GLASS`)
- `recordType`, `recordId`, `patientId`
- `ipAddress`, `userAgent`
- `previousHash`, `hash` (SHA-256 hash-chaining to detect tampering)

Audit records are protected by database rules preventing `UPDATE` and `DELETE` operations.

---

## 5. Non-Diagnostic Disclaimer & Regulatory Boundaries

> **IMPORTANT CLINICAL NOTICE**
> Carewell applications are informational, operational, and administrative tools. No application in this repository generates autonomous medical diagnoses, prescribes treatments, calculates drug dosages, or provides clinical decision support. All medical assessments and interventions must be executed by licensed human clinicians. In the event of a medical emergency, users must immediately contact their local emergency services.
>
> Technical data protection mechanisms documented here do not automatically guarantee compliance with legal frameworks (such as HIPAA, GDPR, or national healthcare data regulations). Compliance depends strictly on real-world infrastructure deployment, physical security controls, and operational administrative policies.
