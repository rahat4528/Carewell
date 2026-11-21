import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedHospitalRequest } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';
import { calculateRoomCharges } from './bed-engine';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// GET /inpatient/wards (List wards with occupancy count)
router.get('/wards', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const wards = await prisma.ward.findMany({
      include: {
        beds: true
      },
      orderBy: { name: 'asc' }
    });

    const summary = wards.map((w) => {
      const totalBeds = w.beds.length;
      const occupiedBeds = w.beds.filter((b) => b.status === 'OCCUPIED').length;
      const availableBeds = w.beds.filter((b) => b.status === 'AVAILABLE').length;
      return {
        ...w,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
      };
    });

    return res.json(summary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /inpatient/wards/:id/beds (List beds in a ward)
router.get('/wards/:id/beds', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const beds = await prisma.bed.findMany({
      where: { wardId: req.params.id as string },
      include: {
        encounters: {
          where: { status: 'ACTIVE' },
          include: { patient: true }
        }
      },
      orderBy: { bedNumber: 'asc' }
    });
    return res.json(beds);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /inpatient/admit (Atomic bed admission)
router.post('/admit', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const { patientId, wardId, bedId, attendingDoctorId, primaryNurseId, encounterType } = req.body;
    if (!patientId || !wardId || !bedId || !attendingDoctorId) {
      return res.status(400).json({ error: 'patientId, wardId, bedId, and attendingDoctorId are required.' });
    }

    const encounterNumber = `ENC-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Lock bed and verify AVAILABLE status
      const bed = await tx.bed.findUnique({
        where: { id: bedId }
      });

      if (!bed) throw new Error('BED_NOT_FOUND');
      if (bed.status !== 'AVAILABLE') {
        throw new Error(`BED_UNAVAILABLE: Bed ${bed.bedNumber} is currently in status ${bed.status}.`);
      }

      // 2. Mark bed as OCCUPIED
      await tx.bed.update({
        where: { id: bed.id },
        data: { status: 'OCCUPIED' }
      });

      // 3. Create Encounter
      const encounter = await tx.encounter.create({
        data: {
          encounterNumber,
          patientId,
          encounterType: encounterType || 'INPATIENT',
          status: 'ACTIVE',
          attendingDoctorId,
          primaryNurseId: primaryNurseId || null,
          currentWardId: wardId,
          currentBedId: bed.id,
          admissionDate: new Date()
        },
        include: { patient: true, ward: true, bed: true }
      });

      return encounter;
    });

    await audit.recordEntry({
      action: 'PATIENT_ADMITTED',
      entityType: 'Encounter',
      entityId: result.id,
      actorId: req.user!.id,
      details: { encounterNumber, patientId, wardId, bedId }
    });

    return res.status(201).json(result);
  } catch (err: any) {
    if (err.message?.includes('BED_UNAVAILABLE')) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

// POST /inpatient/encounters/:id/transfer (Atomic inter-ward / bed transfer)
router.post('/encounters/:id/transfer', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const { targetWardId, targetBedId, transferReason } = req.body;
    if (!targetWardId || !targetBedId) {
      return res.status(400).json({ error: 'targetWardId and targetBedId are required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find encounter
      const encounter = await tx.encounter.findUnique({
        where: { id: req.params.id as string },
        include: { bed: true }
      });

      if (!encounter || encounter.status !== 'ACTIVE') {
        throw new Error('ENCOUNTER_NOT_ACTIVE');
      }

      // 2. Lock target bed
      const targetBed = await tx.bed.findUnique({
        where: { id: targetBedId }
      });

      if (!targetBed) throw new Error('TARGET_BED_NOT_FOUND');
      if (targetBed.status !== 'AVAILABLE') {
        throw new Error(`TARGET_BED_UNAVAILABLE: Bed ${targetBed.bedNumber} is currently ${targetBed.status}.`);
      }

      // 3. Mark old bed as CLEANING
      if (encounter.currentBedId) {
        await tx.bed.update({
          where: { id: encounter.currentBedId },
          data: { status: 'CLEANING' }
        });
      }

      // 4. Mark target bed as OCCUPIED
      await tx.bed.update({
        where: { id: targetBed.id },
        data: { status: 'OCCUPIED' }
      });

      // 5. Update encounter
      const updatedEncounter = await tx.encounter.update({
        where: { id: encounter.id },
        data: {
          currentWardId: targetWardId,
          currentBedId: targetBed.id
        },
        include: { ward: true, bed: true, patient: true }
      });

      return updatedEncounter;
    });

    await audit.recordEntry({
      action: 'PATIENT_TRANSFERRED',
      entityType: 'Encounter',
      entityId: result.id,
      actorId: req.user!.id,
      details: { targetWardId, targetBedId, transferReason }
    });

    return res.json(result);
  } catch (err: any) {
    if (err.message?.includes('TARGET_BED_UNAVAILABLE')) {
      return res.status(409).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

// POST /inpatient/encounters/:id/discharge (Discharge patient and calculate room billing)
router.post('/encounters/:id/discharge', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const dischargeTime = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const encounter = await tx.encounter.findUnique({
        where: { id: req.params.id as string },
        include: { ward: true, bed: true }
      });

      if (!encounter || encounter.status !== 'ACTIVE') {
        throw new Error('ENCOUNTER_NOT_ACTIVE');
      }

      // Calculate room charges
      const dailyRate = encounter.ward?.dailyRateCents || 75000;
      const billing = calculateRoomCharges(encounter.admissionDate, dischargeTime, dailyRate);

      // Release bed to CLEANING
      if (encounter.currentBedId) {
        await tx.bed.update({
          where: { id: encounter.currentBedId },
          data: { status: 'CLEANING' }
        });
      }

      // Update encounter status
      const discharged = await tx.encounter.update({
        where: { id: encounter.id },
        data: {
          status: 'DISCHARGED',
          dischargeDate: dischargeTime,
          totalRoomChargesCents: billing.totalRoomChargesCents,
          currentBedId: null
        },
        include: { patient: true, ward: true }
      });

      return { encounter: discharged, billing };
    });

    await audit.recordEntry({
      action: 'PATIENT_DISCHARGED',
      entityType: 'Encounter',
      entityId: result.encounter.id,
      actorId: req.user!.id,
      details: { roomCharges: result.billing.totalRoomChargesCents, days: result.billing.daysCharged }
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
