import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedUserRequest } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';
import { calculatePosTotals, validateTender, DEFAULT_TAX_RATE_BPS } from './pos-engine';
import { calculateFefoAllocation } from '../fefo/fefo-engine';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// POST /pos/checkout (Process POS retail sale with FEFO batch depletion)
router.post('/checkout', authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { items, paymentMethod, tender, taxRateBps } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart items cannot be empty.' });
    }

    // 1. Fetch medication details to get current prices and tax status
    const medIds = items.map((i: any) => i.medicationId);
    const meds = await prisma.medication.findMany({
      where: { id: { in: medIds } }
    });
    const medMap = new Map(meds.map((m) => [m.id, m]));

    const cartItems = items.map((i: any) => {
      const med = medMap.get(i.medicationId);
      if (!med) throw new Error(`Medication not found: ${i.medicationId}`);
      return {
        medicationId: med.id,
        name: med.brandName,
        quantity: Number(i.quantity),
        unitPriceCents: med.unitPriceCents,
        // Non-prescription OTC items are taxable; Rx drugs tax exempt
        isTaxable: !med.requiresPrescription
      };
    });

    // 2. Compute exact financial totals in integer cents
    const receiptTotals = calculatePosTotals(cartItems, taxRateBps || DEFAULT_TAX_RATE_BPS);

    // 3. Validate tender
    if (tender) {
      const tenderCheck = validateTender(receiptTotals.totalCents, tender);
      if (!tenderCheck.valid) {
        return res.status(400).json({
          error: `INSUFFICIENT_TENDER: Tender total is ${tenderCheck.tenderTotalCents}¢, but total due is ${receiptTotals.totalCents}¢.`
        });
      }
    }

    const saleNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 4. Execute atomic sale and FEFO inventory deduction
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.posSale.create({
        data: {
          saleNumber,
          cashierId: req.user!.id,
          subtotalCents: receiptTotals.subtotalCents,
          taxCents: receiptTotals.taxCents,
          totalCents: receiptTotals.totalCents,
          paymentMethod: paymentMethod || 'CASH'
        }
      });

      const lineItems: any[] = [];

      for (const item of cartItems) {
        const batches = await tx.medicationBatch.findMany({
          where: { medicationId: item.medicationId }
        });

        const fefo = calculateFefoAllocation(batches as any, item.quantity);

        for (const alloc of fefo.allocations) {
          const currentBatch = await tx.medicationBatch.findUnique({ where: { id: alloc.batchId } });
          if (!currentBatch || currentBatch.currentQty < alloc.allocatedQty) {
            throw new Error(`CONCURRENCY_CONFLICT: Stock for batch ${alloc.lotNumber} changed.`);
          }

          const newStock = currentBatch.currentQty - alloc.allocatedQty;
          if (newStock < 0) {
            throw new Error(`NON_NEGATIVE_STOCK_VIOLATION: Batch ${alloc.lotNumber} would drop to ${newStock}.`);
          }

          await tx.medicationBatch.update({
            where: { id: alloc.batchId },
            data: { currentQty: newStock }
          });

          await tx.inventoryMovement.create({
            data: {
              batchId: alloc.batchId,
              medicationId: item.medicationId,
              movementType: 'POS_SALE',
              quantityChange: -alloc.allocatedQty,
              previousQuantity: currentBatch.currentQty,
              newQuantity: newStock,
              referenceType: 'POS_SALE',
              referenceId: sale.id,
              actorId: req.user!.id,
              notes: `Point of sale sale ${saleNumber}`
            }
          });

          const posLine = await tx.posSaleItem.create({
            data: {
              posSaleId: sale.id,
              medicationId: item.medicationId,
              batchId: alloc.batchId,
              quantity: alloc.allocatedQty,
              unitPriceCents: alloc.unitPriceCents,
              totalPriceCents: alloc.totalPriceCents
            }
          });
          lineItems.push(posLine);
        }
      }

      return { sale, lineItems };
    });

    await audit.recordEntry({
      action: 'POS_SALE_COMPLETED',
      entityType: 'PosSale',
      entityId: result.sale.id,
      actorId: req.user!.id,
      details: { saleNumber, totalCents: receiptTotals.totalCents, itemCount: receiptTotals.itemCount }
    });

    return res.status(201).json({
      success: true,
      saleNumber,
      receipt: {
        ...receiptTotals,
        saleId: result.sale.id,
        createdAt: result.sale.createdAt,
        paymentMethod: result.sale.paymentMethod
      }
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

// GET /pos/sales/:id (Fetch itemized sales receipt)
router.get('/sales/:id', authMiddleware, async (req, res: Response) => {
  try {
    const sale = await prisma.posSale.findUnique({
      where: { id: req.params.id as string },
      include: {
        items: {
          include: {
            medication: true,
            batch: true
          }
        }
      }
    });
    if (!sale) return res.status(404).json({ error: 'Sale record not found.' });
    return res.json(sale);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /pos/movements (Append-only audit ledger of inventory movements)
router.get('/movements', authMiddleware, async (req, res: Response) => {
  try {
    const { medicationId, batchId, limit = 50 } = req.query;
    const where: any = {};
    if (medicationId) where.medicationId = String(medicationId);
    if (batchId) where.batchId = String(batchId);

    const movements = await prisma.inventoryMovement.findMany({
      where,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        medication: { select: { brandName: true, genericName: true, ndc: true } },
        batch: { select: { lotNumber: true, expiryDate: true } }
      }
    });

    return res.json(movements);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
