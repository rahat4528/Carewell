# Doctor Appointment System - System Requirements Specification

## 1. Executive Summary & Purpose

The **Doctor Appointment System** (`03-doctor-appointment-system`) is a standalone clinical appointment booking and schedule management platform. It connects patients with verified medical practitioners and outpatient clinics, providing timezone-aware slot discovery, atomic concurrency controls preventing double-booking, atomic rescheduling, waitlist management, and secure post-consultation documentation.

> **CRITICAL MEDICAL DISCLAIMER**:
> The Doctor Appointment System is strictly an administrative scheduling and appointment logistics platform. It does NOT make autonomous medical diagnoses, triage patients, recommend treatments, or evaluate clinical urgency. Patients facing acute medical symptoms or emergencies must immediately contact local emergency services.

---

## 2. Core Functional Requirements

### 2.1 User Management & Roles
- **Patient**: Account creation, profile management, doctor discovery, slot booking, atomic rescheduling, cancellation, review authoring, and personal appointment timeline.
- **Doctor**: Onboarding profile, verified credentials, specialty affiliations, clinic schedule definitions, consultation notes, appointment lifecycle progression.
- **Administrator**: Verification gating (`PENDING_VERIFICATION` -> `VERIFIED` / `REJECTED`), specialty management, clinic registry, system audit review.

### 2.2 Availability & Scheduling Engine
- **Weekly Schedule Templates**: Doctors configure recurring weekly availability per clinic location (e.g., Mondays 09:00 - 13:00, 30-minute slot duration, 5-minute buffer).
- **Schedule Exceptions**: Holidays, leave, and temporary clinic closures override weekly templates.
- **Backend-Derived Slots**: Slots are generated on the server; client-submitted arbitrary timestamps are rejected.
- **Cross-Clinic Concurrency Prevention**: A doctor practicing across multiple clinics cannot have overlapping slots or travel buffer collisions across physical locations.
- **Timezone Awareness**: Timestamps stored in UTC with clinic IANA timezone (e.g., `America/New_York`, `Europe/London`). Display adjusted to patient's local timezone with daylight-saving transition resilience.

### 2.3 Booking & Concurrency Controls
- **Zero Double-Booking Guarantee**: Slot reservation runs inside an ACID database transaction utilizing exclusive row-level locking (`SELECT ... FOR UPDATE`) or unique slot constraint (`doctorId`, `startTime`, `status != 'CANCELLED'`).
- **Temporary Slot Holds**: 10-minute hold during checkout; unconfirmed holds expire via scheduled job and revert to available.
- **Atomic Rescheduling**: Booking of new slot and release of prior slot occur in a single atomic transaction. If the new slot fails, the prior appointment remains intact.
- **State Machine**:
  `REQUESTED` -> `CONFIRMED` -> `CHECKED_IN` -> `COMPLETED`
  Branches: `CANCELLED_BY_PATIENT`, `CANCELLED_BY_DOCTOR`, `NO_SHOW`, `RESCHEDULED`.
  Every transition writes an immutable row to `AppointmentStatusHistory`.
- **Cancellation Policy**: Configurable minimum notice window (e.g., 24 hours prior to appointment).

### 2.4 Waiting Lists & Slot Redistribution
- **Waitlist Queue**: Patients register for a specific doctor, clinic, and date range.
- **Automated Offer Pipeline**: When a cancellation occurs, the earliest eligible waitlisted patient receives a time-bounded offer (e.g., 2-hour window).
- **Offer Expiration**: If unclaimed within the offer window, the offer expires and advances to the next waitlisted patient without duplicate offers.

### 2.5 Privacy, Consultation Notes & Prescriptions
- **Field-Level Encryption**: Sensitive consultation notes are encrypted at rest using AES-256-GCM.
- **Strict Clinical Access Control**: Consultation notes are authored and viewable ONLY by the treating physician and the patient. Administrators and unaffiliated doctors have no default read access.
- **Read-Auditing**: Every access to clinical notes creates an append-only audit record.
- **Prescription Attachments**: Physician-uploaded documents (scans/PDFs) stored securely; the system generates NO autonomous prescriptions.
- **Online Teleconsultation Links**: Video consultation URLs are visible only to the confirmed doctor and patient, and strictly within a time window (15 minutes prior to 60 minutes after appointment).
- **Privacy-Preserving Notifications**: Reminders contain zero clinical content ("You have an upcoming appointment with Dr. [Name]. Please sign in to view details.").

### 2.6 Reviews & Moderation
- Reviews permitted ONLY for appointments in `COMPLETED` status.
- Exactly one review allowed per completed appointment.
- Doctors cannot delete or alter patient reviews.
