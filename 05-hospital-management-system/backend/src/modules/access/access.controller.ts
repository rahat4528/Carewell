import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedHospitalRequest } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// GET /access/encounters/:id/check (Check ReBAC assignment & break-glass status)
router.get('/encounters/:id/check', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id as string },
      include: { ward: true }
    });
    if (!encounter) return res.status(404).json({ error: 'Encounter not found.' });

    // 1. Direct Assignment Check
    const isAttending = encounter.attendingDoctorId === req.user!.id;
    const isPrimaryNurse = encounter.primaryNurseId === req.user!.id;
    const isDepartmentMatch = req.user!.department && encounter.ward && req.user!.department === encounter.ward.specialty;

    if (isAttending || isPrimaryNurse || isDepartmentMatch || req.user!.role === 'ADMIN') {
      return res.json({
        authorized: true,
        reason: 'DIRECT_CARE_TEAM_ASSIGNMENT',
        isBreakGlass: false
      });
    }

    // 2. Active Break-Glass Override Check
    const activeBreakGlass = await prisma.breakGlassAccess.findFirst({
      where: {
        encounterId: encounter.id,
        clinicianId: req.user!.id,
        expiresAt: { gt: new Date() }
      }
    });

    if (activeBreakGlass) {
      return res.json({
        authorized: true,
        reason: 'ACTIVE_EMERGENCY_BREAK_GLASS',
        isBreakGlass: true,
        expiresAt: activeBreakGlass.expiresAt
      });
    }

    return res.status(403).json({
      authorized: false,
      error: 'REBAC_DENIAL: You are not assigned to this patient encounter. Declare emergency break-glass if urgent clinical access is required.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /access/encounters/:id/break-glass (Emergency clinical override)
router.post('/encounters/:id/break-glass', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const { justificationReason } = req.body;
    if (!justificationReason || justificationReason.trim().length < 15) {
      return res.status(400).json({
        error: 'JUSTIFICATION_REQUIRED: Break-glass emergency override requires a detailed clinical justification (minimum 15 characters).'
      });
    }

    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id as string },
      include: { patient: true }
    });
    if (!encounter) return res.status(404).json({ error: 'Encounter not found.' });

    // 4 hours expiration
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);

    const access = await prisma.breakGlassAccess.create({
      data: {
        encounterId: encounter.id,
        clinicianId: req.user!.id,
        justificationReason: justificationReason.trim(),
        expiresAt
      }
    });

    // High priority audit record
    await audit.recordEntry({
      action: 'EMERGENCY_BREAK_GLASS_DECLARED',
      entityType: 'Encounter',
      entityId: encounter.id,
      actorId: req.user!.id,
      details: {
        patientMrn: encounter.patient.mrn,
        clinicianName: req.user!.name,
        clinicianLicense: req.user!.licenseNumber,
        justification: justificationReason.trim(),
        expiresAt: expiresAt.toISOString()
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Emergency break-glass access granted. Audit notification dispatched to compliance officers.',
      accessId: access.id,
      expiresAt: access.expiresAt
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /access/audit/break-glass (Compliance review)
router.get('/audit/break-glass', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const logs = await prisma.breakGlassAccess.findMany({
      include: {
        encounter: {
          include: { patient: true }
        }
      },
      orderBy: { accessedAt: 'desc' }
    });

    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
