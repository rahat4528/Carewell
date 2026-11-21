import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedUserRequest, requireRole } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';
import { identifyExpiredBatches } from '../fefo/fefo-engine';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// GET /medications (Search catalog)
router.get('/', async (req, res: Response) => {
  try {
    const { search, deaSchedule } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { brandName: { contains: String(search) } },
        { genericName: { contains: String(search) } },
        { ndc: { contains: String(search) } }
      ];
    }

    if (deaSchedule) {
      where.deaSchedule = String(deaSchedule);
    }

    const medications = await prisma.medication.findMany({
      where,
      include: {
        batches: {
          where: { isQuarantined: false, currentQty: { gt: 0 } },
          orderBy: { expiryDate: 'asc' }
        }
      },
      orderBy: { brandName: 'asc' }
    });

    // Compute aggregated available stock
    const results = medications.map((med) => {
      const totalAvailableStock = med.batches.reduce((sum, b) => sum + b.currentQty, 0);
      return {
        ...med,
        totalAvailableStock,
        isLowStock: totalAvailableStock <= med.reorderLevel
      };
    });

    return res.json(results);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /medications (Create catalog item - Staff only)
router.post('/', authMiddleware, requireRole('PHARMACIST', 'ADMIN'), async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const {
      ndc,
      brandName,
      genericName,
      dosageForm,
      strength,
      packageSize,
      deaSchedule,
      unitPriceCents,
      costPriceCents,
      reorderLevel,
      requiresPrescription
    } = req.body;

    if (!ndc || !brandName || !genericName || !unitPriceCents || !costPriceCents) {
      return res.status(400).json({ error: 'Missing mandatory medication catalog fields.' });
    }

    const med = await prisma.medication.create({
      data: {
        ndc,
        brandName,
        genericName,
        dosageForm: dosageForm || 'Tablet',
        strength: strength || '10mg',
        packageSize: packageSize || 100,
        deaSchedule: deaSchedule || 'NON_CONTROLLED',
        unitPriceCents: Number(unitPriceCents),
        costPriceCents: Number(costPriceCents),
        reorderLevel: Number(reorderLevel || 50),
        requiresPrescription: requiresPrescription !== undefined ? requiresPrescription : true
      }
    });

    await audit.recordEntry({
      action: 'MEDICATION_CATALOG_CREATED',
      entityType: 'Medication',
      entityId: med.id,
      actorId: req.user!.id,
      details: { ndc: med.ndc, brandName: med.brandName, deaSchedule: med.deaSchedule }
    });

    return res.status(201).json(med);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /medications/:id (Medication details with all batches)
router.get('/:id', async (req, res: Response) => {
  try {
    const med = await prisma.medication.findUnique({
      where: { id: req.params.id as string },
      include: {
        batches: { orderBy: { expiryDate: 'asc' } },
        movements: { orderBy: { createdAt: 'desc' }, take: 20 }
      }
    });
    if (!med) return res.status(404).json({ error: 'Medication not found.' });

    const totalAvailableStock = med.batches
      .filter((b) => !b.isQuarantined && new Date(b.expiryDate) > new Date())
      .reduce((sum, b) => sum + b.currentQty, 0);

    return res.json({ ...med, totalAvailableStock });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /medications/:id/batches (Goods receipt / PO Receiving - creates batch & logs movement)
router.post('/:id/batches', authMiddleware, requireRole('PHARMACIST', 'PHARMACY_TECH', 'ADMIN'), async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { lotNumber, expiryDate, quantity, costPriceCents, sellingPriceCents, poReference } = req.body;
    if (!lotNumber || !expiryDate || !quantity) {
      return res.status(400).json({ error: 'lotNumber, expiryDate, and quantity are required.' });
    }

    const med = await prisma.medication.findUnique({ where: { id: req.params.id as string } });
    if (!med) return res.status(404).json({ error: 'Medication not found.' });

    const qtyNumber = Number(quantity);
    if (qtyNumber <= 0) return res.status(400).json({ error: 'Quantity must be positive.' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create batch
      const batch = await tx.medicationBatch.create({
        data: {
          medicationId: med.id,
          lotNumber,
          expiryDate: new Date(expiryDate),
          initialQty: qtyNumber,
          currentQty: qtyNumber,
          costPriceCents: costPriceCents ? Number(costPriceCents) : med.costPriceCents,
          sellingPriceCents: sellingPriceCents ? Number(sellingPriceCents) : med.unitPriceCents,
          isQuarantined: false
        }
      });

      // 2. Append-only InventoryMovement
      const movement = await tx.inventoryMovement.create({
        data: {
          batchId: batch.id,
          medicationId: med.id,
          movementType: 'RECEIPT',
          quantityChange: qtyNumber,
          previousQuantity: 0,
          newQuantity: qtyNumber,
          referenceType: 'PO_RECEIPT',
          referenceId: poReference || `PO_${Date.now()}`,
          actorId: req.user!.id,
          notes: `Goods receipt lot ${lotNumber}`
        }
      });

      return { batch, movement };
    });

    await audit.recordEntry({
      action: 'GOODS_RECEIPT_BATCH_ADDED',
      entityType: 'MedicationBatch',
      entityId: result.batch.id,
      actorId: req.user!.id,
      details: { lotNumber, quantity: qtyNumber, medicationId: med.id }
    });

    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /medications/:id/quarantine-expired (Quarantine expired batches)
router.post('/:id/quarantine-expired', authMiddleware, requireRole('PHARMACIST', 'ADMIN'), async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const med = await prisma.medication.findUnique({
      where: { id: req.params.id as string },
      include: { batches: true }
    });
    if (!med) return res.status(404).json({ error: 'Medication not found.' });

    const now = new Date();
    const expiredBatches = identifyExpiredBatches((med as any).batches, now);

    const quarantinedResults = [];
    for (const exp of expiredBatches) {
      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.medicationBatch.update({
          where: { id: exp.id },
          data: { isQuarantined: true }
        });

        await tx.inventoryMovement.create({
          data: {
            batchId: b.id,
            medicationId: med.id,
            movementType: 'QUARANTINE',
            quantityChange: 0,
            previousQuantity: b.currentQty,
            newQuantity: b.currentQty,
            referenceType: 'QUARANTINE_SWEEP',
            referenceId: `SWEEP_${now.getTime()}`,
            actorId: req.user!.id,
            notes: `Batch expired on ${new Date(b.expiryDate).toISOString()}`
          }
        });
        return b;
      });
      quarantinedResults.push(updated);
    }

    return res.json({
      message: `Quarantine sweep completed. ${quarantinedResults.length} batches quarantined.`,
      quarantinedBatches: quarantinedResults
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
