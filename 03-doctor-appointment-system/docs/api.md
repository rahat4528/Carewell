# Doctor Appointment System - REST API Documentation

Base URL: `/api/v1`

---

## 1. Authentication & Profiles

### `POST /auth/register`
Registers user as `PATIENT` or `DOCTOR`.
Doctors default to `verificationStatus: PENDING_VERIFICATION`.

### `POST /auth/login`
Authenticates user and returns JWT token with role.

### `GET /profile`
Returns authenticated patient or doctor profile.

---

## 2. Doctor Discovery & Schedules

### `GET /doctors`
Public discovery endpoint listing verified doctors (`verificationStatus = VERIFIED`).
- Query filters: `specialty`, `search`, `clinicId`.

### `GET /doctors/:id/slots`
Returns derived available time slots for a given doctor and date range (`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`).

### `POST /doctors/schedules` (Doctor only)
Defines weekly schedule blocks (day of week, start time, end time, slot duration, clinic).

---

## 3. Appointments Lifecycle

### `POST /appointments/book`
Atomically books an available time slot.
- Body: `{ "slotId": "slot_...", "reason": "Annual checkup" }`
- Enforces double-booking prevention.

### `POST /appointments/:id/reschedule`
Atomically moves appointment to a new slot in a single transaction.

### `POST /appointments/:id/cancel`
Cancels appointment subject to 24-hour minimum notice policy.

### `GET /appointments`
Returns user's appointments (scoped to patient or doctor).

---

## 4. Consultation Notes & Teleconsultation

### `POST /appointments/:id/notes` (Doctor only)
Creates an AES-256-GCM encrypted consultation note.

### `GET /appointments/:id/notes`
Retrieves decrypted note. Allowed strictly for the treating doctor and patient; denied to administrators and outside clinicians.

### `GET /appointments/:id/video-link`
Returns teleconsultation meeting URL. Accessible strictly between 15 minutes before and 60 minutes after appointment start time.

---

## 5. Waiting List & Admin

### `POST /waitlist`
Places a patient on the waiting list for a doctor and date.

### `PATCH /admin/doctors/:id/verify` (Admin only)
Approves or rejects doctor credentials (`VERIFIED` / `REJECTED`).
