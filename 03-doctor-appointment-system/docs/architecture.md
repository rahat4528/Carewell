# Doctor Appointment System - System Architecture

## 1. Architectural Overview

The Doctor Appointment System is structured as a decoupled, enterprise web application comprising a Next.js clinical booking portal, an Express/TypeScript modular API backend, a PostgreSQL relational database (`carewell_appointments_db`), and a Redis-backed queue worker for appointment reminders and slot expiration sweeps.

```
+-------------------------------------------------------------+
|                Next.js Clinic Booking Portal                |
|  (Doctor Search, Slot Picker, Patient Timeline, Calendar)   |
+------------------------------+------------------------------+
                               | HTTPS / JSON REST
+------------------------------v------------------------------+
|                     Modular Backend API                     |
|  - AuthModule (RBAC: Patient, Doctor, Administrator)        |
|  - DoctorsModule (Discovery, Verification Gating)          |
|  - ScheduleEngine (Slot Generator, Cross-Clinic Defense)   |
|  - AppointmentEngine (Atomic Booking, Double-Booking Guard)|
|  - WaitlistService (State-Machine Slot Redistribution)      |
|  - ClinicalNotesModule (AES-256-GCM Field Encryption)      |
|  - NotificationModule (Privacy-Preserving Email Adapter)    |
|  - AuditService (Tamper-Evident SHA-256 Hash Chain)         |
+------------------------------+------------------------------+
                               | Prisma ORM (ACID Isolation)
+------------------------------v------------------------------+
|             PostgreSQL (carewell_appointments_db)           |
|   Users, Patients, Doctors, Specialties, Clinics, Slots,    |
|   Appointments, StatusHistory, Notes, Waitlist, AuditLogs   |
+-------------------------------------------------------------+
```

---

## 2. Core Scheduling & Concurrency Algorithms

### 2.1 Double-Booking Prevention & Concurrency Guarantees
To prevent race conditions where two concurrent requests target the same slot:
1. Transaction initiated with Serializable / Read Committed isolation.
2. The slot row is locked exclusively:
   ```sql
   SELECT * FROM AvailabilitySlot WHERE id = :slotId FOR UPDATE;
   ```
3. Verify that `slot.isBooked == false` and `slot.heldUntil < NOW()`.
4. Create Appointment record and immediately mark `slot.isBooked = true`.
5. Unique constraint on `[doctorId, startTime, clinicLocationId]` prevents overlapping active bookings across multiple clinics for the same physician.

### 2.2 Atomic Rescheduling Algorithm
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock new target slot
  const newSlot = await tx.availabilitySlot.findUnique({ where: { id: newSlotId } });
  if (newSlot.isBooked) throw new Error("Target slot already booked");

  // 2. Release prior slot
  await tx.availabilitySlot.update({
    where: { id: oldAppointment.slotId },
    data: { isBooked: false }
  });

  // 3. Mark old appointment RESCHEDULED
  await tx.appointment.update({
    where: { id: oldAppointmentId },
    data: { status: "RESCHEDULED" }
  });

  // 4. Create new appointment with link
  const newAppt = await tx.appointment.create({
    data: { slotId: newSlotId, status: "CONFIRMED", ... }
  });

  return newAppt;
});
```

### 2.3 Timezone & Daylight Saving Time (DST) Handling
All scheduling boundaries are persisted in UTC. Each clinic specifies an IANA timezone identifier (e.g., `America/New_York`, `Europe/London`).
Calculations use standard calendar date offsets so that a 09:00 appointment remains 09:00 local time across DST transitions.

---

## 3. Database Schema Overview (`carewell_appointments_db`)

- `User`: Base identity (`id`, `email`, `passwordHash`, `role` [PATIENT, DOCTOR, ADMIN]).
- `PatientProfile`: Demographic details (`id`, `userId`, `phone`, `dateOfBirth`, `timezone`).
- `DoctorProfile`: Professional details (`id`, `userId`, `specialtyId`, `licenseNumber`, `consultationFee`, `verificationStatus` [PENDING_VERIFICATION, VERIFIED, REJECTED]).
- `Specialty`: Medical disciplines (`id`, `name`, `description`).
- `Clinic`: Healthcare facilities (`id`, `name`, `address`, `timezone`).
- `DoctorSchedule`: Weekly recurring availability template.
- `AvailabilitySlot`: Discrete derived slots (`id`, `doctorId`, `clinicId`, `startTime`, `endTime`, `isBooked`, `heldUntil`).
- `Appointment`: Clinical bookings (`id`, `patientId`, `doctorId`, `clinicId`, `slotId`, `status`, `cancellationReason`).
- `AppointmentStatusHistory`: Immutable audit log of lifecycle changes.
- `ConsultationNote`: Encrypted clinical documentation (`id`, `appointmentId`, `encryptedContent`, `iv`, `authTag`, `authorDoctorId`).
- `WaitlistEntry`: Queue entry for freed slots (`id`, `patientId`, `doctorId`, `targetDate`, `status` [WAITING, OFFERED, CLAIMED, EXPIRED]).
- `AuditLog`: SHA-256 hash-chained compliance audit log.
