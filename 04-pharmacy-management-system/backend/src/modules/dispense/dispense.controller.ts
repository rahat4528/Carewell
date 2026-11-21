import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedUserRequest, requireRole } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';
import { calculateFefoAllocation } from '../fefo/fefo-engine';
import { validateControlledSubstanceDispense, hashPatientId } from '../controlled/controlled-engine';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// POST /dispense/prescriptions (Create prescription order)
router.post('/prescriptions', authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const {
      patientName,
      patientDob,
      patientIdNumber,
      prescriberName,
      prescriberNpi,
      prescriberDea,
      instructions,
      items
    } = req.body;

    if (!patientName || !patientDob || !prescriberName || !prescriberNpi || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing mandatory prescription fields.' });
    }

    const rxNumber = `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const patientIdHash = hashPatientId(patientIdNumber || `${patientName}_${patientDob}`);

    const prescription = await prisma.prescription.create({
      data: {
        rxNumber,
        patientName,
        patientDob,
        patientIdHash,
        prescriberName,
        prescriberNpi,
        prescriberDea: prescriberDea || null,
        instructions: instructions || 'Take as directed',
        status: 'PENDING_REVIEW',
        items: {
          create: items.map((it: any) => ({
            medicationId: it.medicationId,
            quantityPrescribed: Number(it.quantityPrescribed),
            refillsRemaining: Number(it.refillsRemaining || 0),
            status: 'PENDING'
          }))
        }
      },
      include: { items: { include: { medication: true } } }
    });

    await audit.recordEntry({
      action: 'PRESCRIPTION_CREATED',
      entityType: 'Prescription',
      entityId: prescription.id,
      actorId: req.user!.id,
      details: { rxNumber, patientName, itemCount: items.length }
    });

    return res.status(201).json(prescription);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /dispense/prescriptions/:id/review (Pharmacist Review Gate)
router.post('/prescriptions/:id/review', authMiddleware, requireRole('PHARMACIST'), async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { decision } = req.body; // 'APPROVE' | 'REJECT'
    const rx = await prisma.prescription.findUnique({
      where: { id: req.params.id as string },
      include: { items: { include: { medication: true } } }
    });
    if (!rx) return res.status(404).json({ error: 'Prescription not found.' });

    if (rx.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: `Cannot review prescription in state ${rx.status}.` });
    }

    const newStatus = decision === 'REJECT' ? 'REJECTED' : 'PHARMACIST_APPROVED';

    const updated = await prisma.prescription.update({
      where: { id: rx.id },
      data: {
        status: newStatus,
        reviewedById: req.user!.id,
        reviewedAt: new Date()
      },
      include: { items: true }
    });

    await audit.recordEntry({
      action: `PRESCRIPTION_REVIEW_${newStatus}`,
      entityType: 'Prescription',
      entityId: updated.id,
      actorId: req.user!.id,
      details: { rxNumber: rx.rxNumber, decision: newStatus }
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /dispense/preview-allocation (Calculate FEFO allocation without committing)
router.post('/preview-allocation', authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { medicationId, quantity } = req.body;
    if (!medicationId || !quantity) {
      return res.status(400).json({ error: 'medicationId and quantity are required.' });
    }

    const batches = await prisma.medicationBatch.findMany({
      where: { medicationId }
    });

    const result = calculateFefoAllocation(batches as any, Number(quantity));
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// POST /dispense/execute (Transactional FEFO Dispensing with Concurrency & Invariant Verification)
router.post('/execute', authMiddleware, requireRole('PHARMACIST', 'PHARMACY_TECH'), async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { prescriptionId, controlledDetails } = req.body;
    if (!prescriptionId) {
      return res.status(400).json({ error: 'prescriptionId is required.' });
    }

    const rx = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: { include: { medication: true } } }
    });
    if (!rx) return res.status(404).json({ error: 'Prescription not found.' });

    if (rx.status !== 'PHARMACIST_APPROVED') {
      return res.status(400).json({
        error: `PRESCRIPTION_NOT_APPROVED: Prescription must be reviewed and approved by a pharmacist prior to dispensing (Current status: ${rx.status}).`
      });
    }

    // Check if any medication is controlled
    const controlledItem = rx.items.find((it) => it.medication.deaSchedule !== 'NON_CONTROLLED');
    if (controlledItem) {
      // Validate controlled substance authorization gate
      const validation = validateControlledSubstanceDispense({
        deaSchedule: controlledItem.medication.deaSchedule,
        prescriberDea: rx.prescriberDea || '',
        prescriberNpi: rx.prescriberNpi,
        patientPhotoIdType: controlledDetails?.patientPhotoIdType || '',
        patientPhotoIdNumber: controlledDetails?.patientPhotoIdNumber || '',
        pharmacistLicenseNumber: req.user!.licenseNumber || '',
        pharmacistRole: req.user!.role
      });

      if (!validation.isAuthorized) {
        return res.status(403).json({ error: validation.error });
      }
    }

    // Atomic FEFO Transaction
    const dispenseResult = await prisma.$transaction(async (tx) => {
      const allocationsSummary: any[] = [];

      for (const item of rx.items) {
        const qtyToDispense = item.quantityPrescribed - item.quantityDispensed;
        if (qtyToDispense <= 0) continue;

        // Fetch fresh batches inside transaction
        const batches = await tx.medicationBatch.findMany({
          where: { medicationId: item.medicationId }
        });

        const fefoResult = calculateFefoAllocation(batches as any, qtyToDispense);

        // Deplete batches and write movements
        for (const alloc of fefoResult.allocations) {
          const currentBatch = await tx.medicationBatch.findUnique({ where: { id: alloc.batchId } });
          if (!currentBatch || currentBatch.currentQty < alloc.allocatedQty) {
            throw new Error(`CONCURRENCY_CONFLICT: Stock for batch ${alloc.lotNumber} changed during allocation.`);
          }

          const newStock = currentBatch.currentQty - alloc.allocatedQty;
          if (newStock < 0) {
            throw new Error(`NON_NEGATIVE_STOCK_VIOLATION: Batch ${alloc.lotNumber} would drop to ${newStock}.`);
          }

          // Decrement batch stock
          await tx.medicationBatch.update({
            where: { id: alloc.batchId },
            data: { currentQty: newStock }
          });

          // Record immutable movement
          await tx.inventoryMovement.create({
            data: {
              batchId: alloc.batchId,
              medicationId: item.medicationId,
              movementType: 'DISPENSE',
              quantityChange: -alloc.allocatedQty,
              previousQuantity: currentBatch.currentQty,
              newQuantity: newStock,
              referenceType: 'PRESCRIPTION',
              referenceId: rx.id,
              actorId: req.user!.id,
              notes: `Dispensed for Rx ${rx.rxNumber}`
            }
          });

          // Link allocation to item
          await tx.dispenseAllocation.create({
            data: {
              prescriptionItemId: item.id,
              batchId: alloc.batchId,
              allocatedQty: alloc.allocatedQty
            }
          });
        }

        // Update prescription item dispensed qty
        await tx.prescriptionItem.update({
          where: { id: item.id },
          data: {
            quantityDispensed: item.quantityPrescribed,
            status: 'DISPENSED'
          }
        });

        allocationsSummary.push({
          medicationId: item.medicationId,
          medicationName: item.medication.brandName,
          allocations: fefoResult.allocations
        });
      }

      // If controlled, log to ControlledSubstanceLog
      if (controlledItem) {
        const totalControlledDispensed = controlledItem.quantityPrescribed;
        const currentTotalMedStock = await tx.medicationBatch.aggregate({
          where: { medicationId: controlledItem.medicationId },
          _sum: { currentQty: true }
        });
        const currentBalance = currentTotalMedStock._sum.currentQty || 0;

        await tx.controlledSubstanceLog.create({
          data: {
            prescriptionId: rx.id,
            medicationId: controlledItem.medicationId,
            schedule: controlledItem.medication.deaSchedule,
            patientPhotoIdType: controlledDetails.patientPhotoIdType,
            patientPhotoIdNumberHash: hashPatientId(controlledDetails.patientPhotoIdNumber),
            prescriberDea: rx.prescriberDea!,
            prescriberNpi: rx.prescriberNpi,
            dispensingPharmacistId: req.user!.id,
            dispensingPharmacistLicense: req.user!.licenseNumber!,
            quantityDispensed: totalControlledDispensed,
            priorBalance: currentBalance + totalControlledDispensed,
            newBalance: currentBalance
          }
        });
      }

      // Mark prescription DISPENSED
      const updatedRx = await tx.prescription.update({
        where: { id: rx.id },
        data: {
          status: 'DISPENSED',
          dispensedById: req.user!.id,
          dispensedAt: new Date()
        }
      });

      return { prescription: updatedRx, allocationsSummary };
    });

    await audit.recordEntry({
      action: 'PRESCRIPTION_DISPENSED',
      entityType: 'Prescription',
      entityId: rx.id,
      actorId: req.user!.id,
      details: { rxNumber: rx.rxNumber, dispensedBy: req.user!.name }
    });

    return res.json({
      success: true,
      message: 'Prescription successfully dispensed via FEFO batch allocation.',
      result: dispenseResult
    });
  } catch (err: any) {
    if (err.message?.includes('CONCURRENCY_CONFLICT')) {
      return res.status(409).json({ error: err.message });
    }
    if (err.message?.includes('INSUFFICIENT_STOCK')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
});

export default router;
