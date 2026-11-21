# Carewell Doctor Appointment System - Test Suites

This directory describes the integration, concurrency, and security test suites for the Doctor Appointment System.

## Test Matrix

| Test Suite | File Path | Focus Area |
|---|---|---|
| **E2E Integration** | `backend/src/tests/e2e.test.ts` | Complete booking lifecycle: verification gating, parallel double-booking race condition, atomic rescheduling, encrypted clinical notes, ReBAC confidentiality, and cancellation policy. |
| **Cross-Clinic Conflicts** | `backend/src/tests/cross-clinic.test.ts` | Slot generation from schedule blocks and collision detection for doctors practicing at multiple facilities. |
| **Cancellation & Visibility** | `backend/src/tests/cancellation-notice.test.ts` | Minimum notice cancellation policy (24h rule) and teleconsultation video link time-window restrictions. |
| **Waitlist Pipeline** | `backend/src/tests/waitlist.test.ts` | Candidate selection, time-bounded offer generation, and prevention of duplicate offers. |
| **Clinical Cryptography** | `backend/src/tests/notes-encryption.test.ts` | AES-256-GCM authenticated encryption/decryption and detection of tampered authentication tags. |

## Running Tests

From `03-doctor-appointment-system/backend`:
```bash
npm test
```
