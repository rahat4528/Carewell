# Carewell Fitness Tracker - Test Suite Overview

This directory contains integration, end-to-end, and cross-cutting security test suites for the Fitness Tracker application.

## Test Matrix

| Test Suite | File Path | Focus Area |
|---|---|---|
| **E2E Lifecycle** | `backend/src/tests/e2e.test.ts` | Complete athlete workflow: registration, exercise creation, session execution, dynamic PR evaluation, activity logging, measurements, export & erasure. |
| **API & Isolation** | `backend/src/tests/api-integration.test.ts` | Supertest API test covering endpoints and cross-user data isolation checks. |
| **Unit Conversion** | `backend/src/tests/unit-conversion.test.ts` | Canonical SI unit arithmetic (kg/lbs, cm/in, m/miles) verifying zero drift across round-trips. |
| **1RM Epley Engine** | `backend/src/tests/epley-1rm.test.ts` | Epley formula validation: $1\text{RM} = w \times (1 + r / 30)$. |
| **MET Calorie Estimator** | `backend/src/tests/calorie-formula.test.ts` | Compendium MET multipliers and non-diagnostic estimate labels. |
| **Dynamic PR Detection** | `backend/src/tests/pr-detection.test.ts` | Milestone detection and automatic recalculation upon set modification or deletion. |
| **Progressive Overload** | `backend/src/tests/volume-overload.test.ts` | Set and session volume load calculations ($\sum \text{sets} \times \text{reps} \times \text{weight}$). |
| **Calendar Recurrence** | `backend/src/tests/calendar-recurrence.test.ts` | Weekly recurrence date computation and automatic transition of overdue workouts to `MISSED`. |
| **Device Deduplication** | `backend/src/tests/device-dedup.test.ts` | AES-256-GCM token encryption/decryption, wearable sync deduplication via `externalRecordId`, token revocation. |
| **Tamper-Evident Audit** | `backend/src/tests/audit-tamper.test.ts` | Cryptographic SHA-256 hash-chain verification and detection of mutated audit records. |

---

## Running the Automated Test Suite

From the `01-fitness-tracker/backend` directory:

```bash
npm test
```
