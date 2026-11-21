import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedHospitalRequest, requireRole } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// POST /laboratory/orders (Place diagnostic lab order)
router.post('/orders', authMiddleware, requireRole('DOCTOR'), async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const { encounterId, testCode, testName } = req.body;
    if (!encounterId || !testCode || !testName) {
      return res.status(400).json({ error: 'encounterId, testCode, and testName are required.' });
    }

    const order = await prisma.labOrder.create({
      data: {
        encounterId,
        testCode,
        testName,
        status: 'ORDERED',
        orderedById: req.user!.id
      }
    });

    await audit.recordEntry({
      action: 'LAB_ORDER_PLACED',
      entityType: 'LabOrder',
      entityId: order.id,
      actorId: req.user!.id,
      details: { testCode, testName }
    });

    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /laboratory/orders/:id/collect (Record specimen collection)
router.post('/orders/:id/collect', authMiddleware, requireRole('NURSE', 'LAB_TECH', 'DOCTOR'), async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const order = await prisma.labOrder.findUnique({
      where: { id: req.params.id as string }
    });
    if (!order) return res.status(404).json({ error: 'Lab order not found.' });

    const updated = await prisma.labOrder.update({
      where: { id: order.id },
      data: {
        status: 'COLLECTED',
        collectedAt: new Date()
      }
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /laboratory/orders/:id/results (Lab Tech raw result entry -> RESULT_PENDING_VERIFICATION)
router.post('/orders/:id/results', authMiddleware, requireRole('LAB_TECH', 'PATHOLOGIST'), async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const { numericValue, unit, referenceRange, isAbnormal, criticalFlag } = req.body;
    if (numericValue === undefined || !unit || !referenceRange) {
      return res.status(400).json({ error: 'numericValue, unit, and referenceRange are required.' });
    }

    const order = await prisma.labOrder.findUnique({
      where: { id: req.params.id as string }
    });
    if (!order) return res.status(404).json({ error: 'Lab order not found.' });

    const result = await prisma.$transaction(async (tx) => {
      const labResult = await tx.labResult.create({
        data: {
          labOrderId: order.id,
          numericValue: Number(numericValue),
          unit,
          referenceRange,
          isAbnormal: Boolean(isAbnormal),
          criticalFlag: Boolean(criticalFlag),
          enteredById: req.user!.id
        }
      });

      const updatedOrder = await tx.labOrder.update({
        where: { id: order.id },
        data: { status: 'RESULT_PENDING_VERIFICATION' }
      });

      return { order: updatedOrder, result: labResult };
    });

    await audit.recordEntry({
      action: 'LAB_RESULT_ENTERED_BY_TECH',
      entityType: 'LabResult',
      entityId: result.result.id,
      actorId: req.user!.id,
      details: { testCode: order.testCode, numericValue }
    });

    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /laboratory/orders/:id/verify (Pathologist / Attending 4-eyes review -> VERIFIED_AND_RELEASED)
router.post('/orders/:id/verify', authMiddleware, requireRole('PATHOLOGIST', 'DOCTOR'), async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const order = await prisma.labOrder.findUnique({
      where: { id: req.params.id as string },
      include: { result: true }
    });

    if (!order) return res.status(404).json({ error: 'Lab order not found.' });
    if (!order.result) return res.status(400).json({ error: 'No entered result found to verify.' });

    if (order.status !== 'RESULT_PENDING_VERIFICATION') {
      return res.status(400).json({ error: `Cannot verify order in status ${order.status}.` });
    }

    const verificationTime = new Date();

    const result = await prisma.$transaction(async (tx) => {
      await tx.labResult.update({
        where: { id: order.result!.id },
        data: {
          verifiedById: req.user!.id,
          verifiedAt: verificationTime
        }
      });

      const releasedOrder = await tx.labOrder.update({
        where: { id: order.id },
        data: { status: 'VERIFIED_AND_RELEASED' },
        include: { result: true }
      });

      return releasedOrder;
    });

    await audit.recordEntry({
      action: 'LAB_RESULT_VERIFIED_AND_RELEASED',
      entityType: 'LabResult',
      entityId: order.result.id,
      actorId: req.user!.id,
      details: { verifiedBy: req.user!.name, license: req.user!.licenseNumber }
    });

    return res.json({
      success: true,
      message: 'Lab result verified and released to patient chart.',
      order: result
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /laboratory/encounters/:id/results (Read lab results for chart - shields unverified results for non-pathologists)
router.get('/encounters/:id/results', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const orders = await prisma.labOrder.findMany({
      where: { encounterId: req.params.id as string },
      include: { result: true },
      orderBy: { orderedAt: 'desc' }
    });

    const isAuthorizedStaff = ['PATHOLOGIST', 'DOCTOR'].includes(req.user!.role);

    // Filter or mask unreleased results for general staff
    const results = orders.map((order) => {
      if (order.status !== 'VERIFIED_AND_RELEASED' && !isAuthorizedStaff) {
        return {
          ...order,
          result: null,
          note: 'Result pending pathologist verification.'
        };
      }
      return order;
    });

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
