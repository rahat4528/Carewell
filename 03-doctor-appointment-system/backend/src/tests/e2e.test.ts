import request from "supertest";
import { createApp } from "../app";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const app = createApp();

describe("Doctor Appointment System - Comprehensive E2E & Concurrency Suite", () => {
  const runId = Date.now();

  let adminToken: string;
  let patientAToken: string;
  let patientAId: string;
  let patientBToken: string;
  let patientBId: string;
  let doctorToken: string;
  let doctorId: string;
  let otherDoctorToken: string;
  let slotAId: string;
  let slotBId: string;
  let appointmentId: string;
  let clinicId: string;
  let winningPatientToken: string;

  beforeAll(async () => {
    // 1. Setup Specialty and Clinic
    const specialty = await prisma.specialty.upsert({
      where: { name: "Cardiology" },
      update: {},
      create: { name: "Cardiology", description: "Heart health care" }
    });

    const clinic = await prisma.clinic.upsert({
      where: { id: "clinic_e2e_central" },
      update: {},
      create: {
        id: "clinic_e2e_central",
        name: "Central Health Clinic",
        address: "500 Madison Ave",
        timezone: "America/New_York"
      }
    });
    clinicId = clinic.id;

    // 2. Register Admin
    const adminRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `admin_${runId}@carewell.local`,
        password: "AdminPassword123!",
        name: "System Admin",
        role: "ADMIN"
      });
    adminToken = adminRes.body.token;

    // 3. Register Patient A
    const patARes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `patientA_${runId}@carewell.local`,
        password: "PatientPassword123!",
        name: "Patient Alice",
        role: "PATIENT"
      });
    patientAToken = patARes.body.token;
    patientAId = patARes.body.user.profileId;

    // 4. Register Patient B
    const patBRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `patientB_${runId}@carewell.local`,
        password: "PatientPassword123!",
        name: "Patient Bob",
        role: "PATIENT"
      });
    patientBToken = patBRes.body.token;
    patientBId = patBRes.body.user.profileId;

    // 5. Register Doctor (Starts PENDING_VERIFICATION)
    const docRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `doctor_${runId}@carewell.local`,
        password: "DoctorPassword123!",
        name: "Dr. Marcus Welby, MD",
        role: "DOCTOR",
        specialtyId: specialty.id,
        licenseNumber: `NY-LIC-${runId}`,
        consultationFee: 220.0
      });
    doctorToken = docRes.body.token;
    doctorId = docRes.body.user.profileId;

    // 6. Register Outside Doctor
    const otherDocRes = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: `otherdoc_${runId}@carewell.local`,
        password: "DoctorPassword123!",
        name: "Dr. Gregory House, MD",
        role: "DOCTOR",
        specialtyId: specialty.id,
        licenseNumber: `NJ-LIC-${runId}`
      });
    otherDoctorToken = otherDocRes.body.token;

    // Create 2 test availability slots for the doctor
    const sA = await prisma.availabilitySlot.create({
      data: {
        doctorId,
        clinicId,
        startTime: new Date(Date.now() + 48 * 3600 * 1000), // +48 hours
        endTime: new Date(Date.now() + 48.5 * 3600 * 1000),
        isBooked: false
      }
    });
    slotAId = sA.id;

    const sB = await prisma.availabilitySlot.create({
      data: {
        doctorId,
        clinicId,
        startTime: new Date(Date.now() + 72 * 3600 * 1000), // +72 hours
        endTime: new Date(Date.now() + 72.5 * 3600 * 1000),
        isBooked: false
      }
    });
    slotBId = sB.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("1. System Health & Protocol Availability", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.service).toContain("Doctor Appointment System");
  });

  test("2. Verification Gating: Unverified doctors hidden and unbookable until verified by Admin", async () => {
    // Check public list - Dr. Welby should NOT appear
    const pubListRes = await request(app).get("/api/v1/doctors");
    expect(pubListRes.body.some((d: any) => d.id === doctorId)).toBe(false);

    // Patient attempts to book unverified doctor -> 403 Forbidden
    const unverifiedBookRes = await request(app)
      .post("/api/v1/appointments/book")
      .set("Authorization", `Bearer ${patientAToken}`)
      .send({ slotId: slotAId, reason: "Checkup" });
    expect(unverifiedBookRes.status).toBe(403);
    expect(unverifiedBookRes.body.error).toContain("Cannot book unverified practitioner");

    // Admin verifies doctor
    const verifyRes = await request(app)
      .patch(`/api/v1/admin/doctors/${doctorId}/verify`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "VERIFIED" });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.verificationStatus).toBe("VERIFIED");

    // Doctor now visible in public directory
    const pubListAfter = await request(app).get("/api/v1/doctors");
    expect(pubListAfter.body.some((d: any) => d.id === doctorId)).toBe(true);
  });

  test("3. Concurrency & Double-Booking Prevention: Parallel booking race condition", async () => {
    // Both Patient A and Patient B simultaneously attempt to book slotAId
    const [bookingA, bookingB] = await Promise.all([
      request(app)
        .post("/api/v1/appointments/book")
        .set("Authorization", `Bearer ${patientAToken}`)
        .send({ slotId: slotAId, reason: "Annual physical" }),
      request(app)
        .post("/api/v1/appointments/book")
        .set("Authorization", `Bearer ${patientBToken}`)
        .send({ slotId: slotAId, reason: "Heart checkup" })
    ]);

    // Exactly one must succeed (201) and one must be rejected (409 Conflict)
    const statuses = [bookingA.status, bookingB.status].sort();
    expect(statuses).toEqual([201, 409]);

    const successfulRes = bookingA.status === 201 ? bookingA : bookingB;
    const conflictingRes = bookingA.status === 409 ? bookingA : bookingB;

    expect(conflictingRes.body.error).toContain("Concurrency protected");
    appointmentId = successfulRes.body.id;
    winningPatientToken = bookingA.status === 201 ? patientAToken : patientBToken;
  });

  test("4. Atomic Rescheduling: moves appointment to new slot and frees old slot in single transaction", async () => {
    // Reschedule from slotA to slotB
    const reschedRes = await request(app)
      .post(`/api/v1/appointments/${appointmentId}/reschedule`)
      .set("Authorization", `Bearer ${winningPatientToken}`)
      .send({ newSlotId: slotBId });

    expect(reschedRes.status).toBe(200);
    expect(reschedRes.body.slotId).toBe(slotBId);
    expect(reschedRes.body.status).toBe("CONFIRMED");

    // Verify slotA was freed
    const slotACheck = await prisma.availabilitySlot.findUnique({ where: { id: slotAId } });
    expect(slotACheck?.isBooked).toBe(false);

    // Verify slotB is now booked
    const slotBCheck = await prisma.availabilitySlot.findUnique({ where: { id: slotBId } });
    expect(slotBCheck?.isBooked).toBe(true);

    appointmentId = reschedRes.body.id;
  });

  test("5. Encrypted Clinical Notes & Strict Access Control (ReBAC)", async () => {
    // Treating doctor authors consultation note
    const noteContent = "Patient exhibits normal cardiac rhythm. ECG clear. Continue standard routine.";
    const writeNoteRes = await request(app)
      .post(`/api/v1/appointments/${appointmentId}/notes`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({ notes: noteContent });

    expect(writeNoteRes.status).toBe(201);
    expect(writeNoteRes.body.status).toBe("ENCRYPTED_AND_STORED");

    // 1. Patient reads note -> Allowed
    const patientReadRes = await request(app)
      .get(`/api/v1/appointments/${appointmentId}/notes`)
      .set("Authorization", `Bearer ${winningPatientToken}`);
    expect(patientReadRes.status).toBe(200);
    expect(patientReadRes.body.decryptedContent).toBe(noteContent);

    // 2. Treating doctor reads note -> Allowed
    const doctorReadRes = await request(app)
      .get(`/api/v1/appointments/${appointmentId}/notes`)
      .set("Authorization", `Bearer ${doctorToken}`);
    expect(doctorReadRes.status).toBe(200);
    expect(doctorReadRes.body.decryptedContent).toBe(noteContent);

    // 3. Unaffiliated outside doctor reads note -> 403 Forbidden
    const illegalDoctorRead = await request(app)
      .get(`/api/v1/appointments/${appointmentId}/notes`)
      .set("Authorization", `Bearer ${otherDoctorToken}`);
    expect(illegalDoctorRead.status).toBe(403);

    // 4. Administrator reads note -> 403 Forbidden (Privacy protection)
    const adminRead = await request(app)
      .get(`/api/v1/appointments/${appointmentId}/notes`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(adminRead.status).toBe(403);

    // 5. Verify audit log entry was written
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: "NOTE_READ" }
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  test("6. Cancellation Notice Policy Enforcement", async () => {
    // Appointment is scheduled for ~72 hours in the future -> cancellation allowed
    const cancelRes = await request(app)
      .post(`/api/v1/appointments/${appointmentId}/cancel`)
      .set("Authorization", `Bearer ${winningPatientToken}`)
      .send({ reason: "Scheduling conflict" });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);

    // Verify slotB is freed
    const slotBCheck = await prisma.availabilitySlot.findUnique({ where: { id: slotBId } });
    expect(slotBCheck?.isBooked).toBe(false);
  });
});
