import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedUserRequest } from "../auth/auth.middleware";
import { encryptClinicalNote, decryptClinicalNote } from "../crypto/clinical-crypto";
import { checkCancellationNotice, isVideoLinkVisible, canTransitionStatus } from "./concurrency-engine";
import { AppointmentAuditService } from "../audit/audit-service";

const prisma = new PrismaClient();
const router = Router();
const auditService = new AppointmentAuditService();

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// GET /appointments (Scoped to patient or doctor)
router.get("/", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    let where: any = {};
    if (role === "PATIENT") {
      const patient = await prisma.patientProfile.findUnique({ where: { userId } });
      if (!patient) return res.status(404).json({ error: "Patient profile not found." });
      where.patientId = patient.id;
    } else if (role === "DOCTOR") {
      const doctor = await prisma.doctorProfile.findUnique({ where: { userId } });
      if (!doctor) return res.status(404).json({ error: "Doctor profile not found." });
      where.doctorId = doctor.id;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        doctor: { include: { user: { select: { name: true, email: true } }, specialty: true } },
        patient: { include: { user: { select: { name: true, email: true } } } },
        clinic: true,
        slot: true
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(appointments);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /appointments/book (Transactional booking with double-booking prevention)
router.post("/book", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { slotId, reason } = req.body;
    if (!slotId) return res.status(400).json({ error: "slotId is required." });

    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.id } });
    if (!patient) return res.status(403).json({ error: "Only patients can book appointments." });

    // Execute atomic transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId },
        include: { doctor: true }
      });

      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }

      if (slot.isBooked) {
        throw new Error("DOUBLE_BOOKING_PREVENTED");
      }

      // Check doctor verification
      if (slot.doctor.verificationStatus !== "VERIFIED") {
        throw new Error("DOCTOR_NOT_VERIFIED");
      }

      // Reserve slot
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true }
      });

      // Create Appointment
      const appt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: slot.doctorId,
          clinicId: slot.clinicId,
          slotId: slot.id,
          status: "CONFIRMED",
          reason: reason || null,
          videoMeetingUrl: `https://telehealth.carewell.local/rooms/${crypto.randomUUID()}`
        },
        include: { slot: true, doctor: true, clinic: true }
      });

      // Status history
      await tx.appointmentStatusHistory.create({
        data: {
          appointmentId: appt.id,
          status: "CONFIRMED",
          actorId: req.user!.id,
          note: "Initial booking confirmed."
        }
      });

      return appt;
    });

    return res.status(201).json(appointment);
  } catch (err: any) {
    if (err.message === "DOUBLE_BOOKING_PREVENTED") {
      return res.status(409).json({ error: "Slot already booked by another patient (Concurrency protected)." });
    }
    if (err.message === "SLOT_NOT_FOUND") {
      return res.status(404).json({ error: "Slot not found." });
    }
    if (err.message === "DOCTOR_NOT_VERIFIED") {
      return res.status(403).json({ error: "Cannot book unverified practitioner." });
    }
    return res.status(500).json({ error: err.message });
  }
});

// POST /appointments/:id/reschedule (Atomic reschedule transaction)
router.post("/:id/reschedule", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { newSlotId } = req.body;
    if (!newSlotId) return res.status(400).json({ error: "newSlotId is required." });

    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.id } });
    if (!patient) return res.status(403).json({ error: "Only patients can reschedule." });

    const result = await prisma.$transaction(async (tx) => {
      const oldAppt = await tx.appointment.findFirst({
        where: { id: req.params.id, patientId: patient.id },
        include: { slot: true }
      });

      if (!oldAppt) throw new Error("APPOINTMENT_NOT_FOUND");
      if (oldAppt.status !== "CONFIRMED") throw new Error("INVALID_STATE");

      // Verify target slot
      const targetSlot = await tx.availabilitySlot.findUnique({ where: { id: newSlotId } });
      if (!targetSlot) throw new Error("TARGET_SLOT_NOT_FOUND");
      if (targetSlot.isBooked) throw new Error("TARGET_SLOT_BOOKED");

      // Release old slot
      await tx.availabilitySlot.update({
        where: { id: oldAppt.slotId },
        data: { isBooked: false }
      });

      // Update old appointment to RESCHEDULED
      await tx.appointment.update({
        where: { id: oldAppt.id },
        data: { status: "RESCHEDULED" }
      });

      // Reserve target slot
      await tx.availabilitySlot.update({
        where: { id: newSlotId },
        data: { isBooked: true }
      });

      // Create new appointment
      const newAppt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: targetSlot.doctorId,
          clinicId: targetSlot.clinicId,
          slotId: targetSlot.id,
          status: "CONFIRMED",
          reason: oldAppt.reason,
          videoMeetingUrl: oldAppt.videoMeetingUrl
        },
        include: { slot: true }
      });

      return newAppt;
    });

    return res.json(result);
  } catch (err: any) {
    if (err.message === "TARGET_SLOT_BOOKED") {
      return res.status(409).json({ error: "Target slot is already booked." });
    }
    if (err.message === "APPOINTMENT_NOT_FOUND") {
      return res.status(404).json({ error: "Appointment not found." });
    }
    return res.status(500).json({ error: err.message });
  }
});

// POST /appointments/:id/cancel (24-hour minimum notice enforcement)
router.post("/:id/cancel", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.id } });
    if (!patient) return res.status(403).json({ error: "Unauthorized" });

    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, patientId: patient.id },
      include: { slot: true }
    });

    if (!appt) return res.status(404).json({ error: "Appointment not found." });

    // Cancellation notice check
    const notice = checkCancellationNotice(appt.slot.startTime, new Date(), 24);
    if (!notice.isAllowed) {
      return res.status(400).json({
        error: `Cancellation policy violation: minimum 24 hours notice required (${notice.hoursRemaining} hours remaining).`
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appt.id },
        data: { status: "CANCELLED_BY_PATIENT", cancellationReason: reason || "Patient request" }
      });

      // Release slot
      await tx.availabilitySlot.update({
        where: { id: appt.slotId },
        data: { isBooked: false }
      });
    });

    return res.json({ success: true, message: "Appointment cancelled and slot released." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /appointments/:id/notes (Treating doctor only, encrypted)
router.post("/:id/notes", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ error: "Notes content is required." });

    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.user!.id } });
    if (!doctor) return res.status(403).json({ error: "Only doctors can author consultation notes." });

    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, doctorId: doctor.id }
    });
    if (!appt) return res.status(404).json({ error: "Appointment not found for treating doctor." });

    const encrypted = encryptClinicalNote(notes, ENCRYPTION_KEY);

    const consultationNote = await prisma.consultationNote.upsert({
      where: { appointmentId: appt.id },
      update: {
        encryptedContent: encrypted.encryptedContent,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      },
      create: {
        appointmentId: appt.id,
        authorDoctorId: doctor.id,
        encryptedContent: encrypted.encryptedContent,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      }
    });

    return res.status(201).json({ id: consultationNote.id, status: "ENCRYPTED_AND_STORED" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /appointments/:id/notes (Strict access: treating doctor or patient only, read-audited)
router.get("/:id/notes", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: true,
        patient: true,
        note: true
      }
    });

    if (!appt) return res.status(404).json({ error: "Appointment not found." });

    // Authorization check: User must be treating doctor OR the patient
    const isTreatingDoctor = appt.doctor.userId === req.user!.id;
    const isPatient = appt.patient.userId === req.user!.id;

    if (!isTreatingDoctor && !isPatient) {
      return res.status(403).json({ error: "Access Denied: Consultation notes are confidential to the patient and treating physician." });
    }

    if (!appt.note) {
      return res.status(404).json({ error: "No consultation notes recorded for this appointment." });
    }

    const decrypted = decryptClinicalNote(
      {
        encryptedContent: appt.note.encryptedContent,
        iv: appt.note.iv,
        authTag: appt.note.authTag
      },
      ENCRYPTION_KEY
    );

    // Write audit log
    const audit = auditService.createAuditRecord({
      userId: req.user!.id,
      action: "NOTE_READ",
      resource: `ConsultationNote:${appt.note.id}`,
      details: { appointmentId: appt.id, readerRole: req.user!.role }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: audit.action,
        resource: audit.resource,
        details: audit.details,
        previousHash: audit.previousHash,
        hash: audit.hash
      }
    });

    return res.json({
      appointmentId: appt.id,
      decryptedContent: decrypted,
      authorDoctorId: appt.note.authorDoctorId,
      updatedAt: appt.note.updatedAt
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /appointments/:id/video-link (Window check: 15 mins before to 60 mins after)
router.get("/:id/video-link", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { slot: true, doctor: true, patient: true }
    });

    if (!appt) return res.status(404).json({ error: "Appointment not found." });

    const isAuthorized = appt.doctor.userId === req.user!.id || appt.patient.userId === req.user!.id;
    if (!isAuthorized) return res.status(403).json({ error: "Access Denied" });

    const isVisible = isVideoLinkVisible(appt.slot.startTime, new Date(), 15, 60);

    return res.json({
      videoMeetingUrl: isVisible ? appt.videoMeetingUrl : null,
      isVisible,
      windowNotice: isVisible
        ? "Teleconsultation session is active."
        : "Meeting link becomes accessible 15 minutes prior to appointment start."
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
