import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedHospitalRequest, requireRole } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';
import { validateVitalSigns } from '../vitals/vitals-engine';
import { validateNoteCanBeModified } from '../notes/notes-engine';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// POST /clinical/encounters/:id/vitals (Record physiological vital signs)
router.post('/encounters/:id/vitals', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const {
      heartRateBpm,
      systolicBp,
      diastolicBp,
      respiratoryRateBpm,
      temperatureCelsius,
      spo2Percent
    } = req.body;

    const validation = validateVitalSigns({
      heartRateBpm: Number(heartRateBpm),
      systolicBp: Number(systolicBp),
      diastolicBp: Number(diastolicBp),
      respiratoryRateBpm: Number(respiratoryRateBpm),
      temperatureCelsius: Number(temperatureCelsius),
      spo2Percent: Number(spo2Percent)
    });

    if (!validation.isPlausible) {
      return res.status(400).json({
        error: 'PHYSIOLOGICAL_VALIDATION_FAILED',
        violations: validation.errors
      });
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id as string }
    });
    if (!encounter) return res.status(404).json({ error: 'Encounter not found.' });

    const vitals = await prisma.vitalSign.create({
      data: {
        encounterId: encounter.id,
        recordedById: req.user!.id,
        heartRateBpm: Number(heartRateBpm),
        systolicBp: Number(systolicBp),
        diastolicBp: Number(diastolicBp),
        respiratoryRateBpm: Number(respiratoryRateBpm),
        temperatureCelsius: Number(temperatureCelsius),
        spo2Percent: Number(spo2Percent),
        isAbnormal: validation.isAbnormal,
        alertLevel: validation.alertLevel
      }
    });

    await audit.recordEntry({
      action: 'VITALS_RECORDED',
      entityType: 'VitalSign',
      entityId: vitals.id,
      actorId: req.user!.id,
      details: { alertLevel: vitals.alertLevel, isAbnormal: vitals.isAbnormal }
    });

    return res.status(201).json(vitals);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /clinical/encounters/:id/vitals (Retrieve vital signs history)
router.get('/encounters/:id/vitals', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const vitals = await prisma.vitalSign.findMany({
      where: { encounterId: req.params.id as string },
      orderBy: { recordedAt: 'desc' }
    });
    return res.json(vitals);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /clinical/encounters/:id/notes (Author clinical SOAP note)
router.post('/encounters/:id/notes', authMiddleware, requireRole('DOCTOR', 'NURSE'), async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const { subjective, objective, assessment, plan, noteType } = req.body;
    if (!subjective || !objective || !assessment || !plan) {
      return res.status(400).json({ error: 'SOAP fields (subjective, objective, assessment, plan) are all required.' });
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id as string }
    });
    if (!encounter) return res.status(404).json({ error: 'Encounter not found.' });

    const note = await prisma.clinicalNote.create({
      data: {
        encounterId: encounter.id,
        authorId: req.user!.id,
        noteType: noteType || 'SOAP_PROGRESS',
        subjective,
        objective,
        assessment,
        plan,
        isSigned: false
      }
    });

    await audit.recordEntry({
      action: 'CLINICAL_NOTE_DRAFTED',
      entityType: 'ClinicalNote',
      entityId: note.id,
      actorId: req.user!.id,
      details: { noteType: note.noteType }
    });

    return res.status(201).json(note);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /clinical/notes/:id/sign (Sign and lock note permanently)
router.post('/notes/:id/sign', authMiddleware, requireRole('DOCTOR'), async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const note = await prisma.clinicalNote.findUnique({
      where: { id: req.params.id as string }
    });
    if (!note) return res.status(404).json({ error: 'Clinical note not found.' });

    if (note.isSigned) {
      return res.status(400).json({ error: 'Note is already signed and permanently locked.' });
    }

    const signed = await prisma.clinicalNote.update({
      where: { id: note.id },
      data: {
        isSigned: true,
        signedAt: new Date(),
        signedById: req.user!.id
      }
    });

    await audit.recordEntry({
      action: 'CLINICAL_NOTE_SIGNED_AND_LOCKED',
      entityType: 'ClinicalNote',
      entityId: signed.id,
      actorId: req.user!.id,
      details: { signedBy: req.user!.name, license: req.user!.licenseNumber }
    });

    return res.json({
      success: true,
      message: 'Note signed and permanently locked from future modifications.',
      note: signed
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /clinical/notes/:id (Update note - strictly blocked if locked)
router.put('/notes/:id', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const note = await prisma.clinicalNote.findUnique({
      where: { id: req.params.id as string }
    });
    if (!note) return res.status(404).json({ error: 'Clinical note not found.' });

    const lockCheck = validateNoteCanBeModified(note.isSigned);
    if (!lockCheck.canModify) {
      return res.status(403).json({ error: lockCheck.error });
    }

    const { subjective, objective, assessment, plan } = req.body;
    const updated = await prisma.clinicalNote.update({
      where: { id: note.id },
      data: {
        subjective: subjective || note.subjective,
        objective: objective || note.objective,
        assessment: assessment || note.assessment,
        plan: plan || note.plan
      }
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /clinical/notes/:id/addendum (Author linked addendum to a signed locked note)
router.post('/notes/:id/addendum', authMiddleware, requireRole('DOCTOR'), async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const parentNote = await prisma.clinicalNote.findUnique({
      where: { id: req.params.id as string }
    });
    if (!parentNote) return res.status(404).json({ error: 'Parent clinical note not found.' });

    const { subjective, objective, assessment, plan } = req.body;
    if (!assessment || !plan) {
      return res.status(400).json({ error: 'Addendum requires assessment and plan documentation.' });
    }

    const addendum = await prisma.clinicalNote.create({
      data: {
        encounterId: parentNote.encounterId,
        authorId: req.user!.id,
        noteType: 'ADDENDUM',
        subjective: subjective || 'Addendum follow-up',
        objective: objective || 'See clinical chart',
        assessment,
        plan,
        isSigned: true,
        signedAt: new Date(),
        signedById: req.user!.id,
        parentNoteId: parentNote.id
      }
    });

    await audit.recordEntry({
      action: 'CLINICAL_ADDENDUM_ATTACHED',
      entityType: 'ClinicalNote',
      entityId: addendum.id,
      actorId: req.user!.id,
      details: { parentNoteId: parentNote.id }
    });

    return res.status(201).json(addendum);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
