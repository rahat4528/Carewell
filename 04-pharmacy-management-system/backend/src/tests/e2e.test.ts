import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Pharmacy Management System - Comprehensive End-to-End Suite', () => {
  const runId = Date.now();

  let pharmacistToken: string;
  let pharmacistId: string;
  let techToken: string;
  let medicationId: string;
  let earlyBatchId: string;
  let lateBatchId: string;
  let controlledMedId: string;
  let prescriptionId: string;

  beforeAll(async () => {
    // 1. Register Pharmacist
    const rphRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `rph_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. Evelyn Stone, RPh',
        role: 'PHARMACIST',
        licenseNumber: 'RPH-10928'
      });
    pharmacistToken = rphRes.body.token;
    pharmacistId = rphRes.body.user.id;

    // 2. Register Pharmacy Tech
    const techRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `tech_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Alex Rivera, CPhT',
        role: 'PHARMACY_TECH'
      });
    techToken = techRes.body.token;
  });

  test('1. System Health & Clinical Disclaimer Header', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.headers['x-carewell-clinical-notice']).toContain('licensed human pharmacist');
  });

  test('2. Medication Catalog Creation & Goods Receipt (Batches with FEFO expiry)', async () => {
    // Create new medication
    const medRes = await request(app)
      .post('/api/v1/medications')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        ndc: `00093-${runId % 10000}-01`,
        brandName: 'Cephalexin 500mg',
        genericName: 'Cephalexin',
        dosageForm: 'Capsule',
        strength: '500mg',
        packageSize: 100,
        deaSchedule: 'NON_CONTROLLED',
        unitPriceCents: 2450, // $24.50
        costPriceCents: 800,   // $8.00
        reorderLevel: 30,
        requiresPrescription: true
      });

    expect(medRes.status).toBe(201);
    medicationId = medRes.body.id;

    // Receive Batch 1 (Early expiry: +2 months, 50 units)
    const earlyExp = new Date();
    earlyExp.setMonth(earlyExp.getMonth() + 2);

    const b1Res = await request(app)
      .post(`/api/v1/medications/${medicationId}/batches`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        lotNumber: `CEP-EARLY-${runId}`,
        expiryDate: earlyExp.toISOString(),
        quantity: 50,
        poReference: `PO_EARLY_${runId}`
      });

    expect(b1Res.status).toBe(201);
    earlyBatchId = b1Res.body.batch.id;

    // Receive Batch 2 (Late expiry: +10 months, 100 units)
    const lateExp = new Date();
    lateExp.setMonth(lateExp.getMonth() + 10);

    const b2Res = await request(app)
      .post(`/api/v1/medications/${medicationId}/batches`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        lotNumber: `CEP-LATE-${runId}`,
        expiryDate: lateExp.toISOString(),
        quantity: 100,
        poReference: `PO_LATE_${runId}`
      });

    expect(b2Res.status).toBe(201);
    lateBatchId = b2Res.body.batch.id;

    // Verify aggregate stock = 150
    const checkRes = await request(app).get(`/api/v1/medications/${medicationId}`);
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.totalAvailableStock).toBe(150);
  });

  test('3. Prescription Order Workflow: Pending Review -> Pharmacist Approval', async () => {
    // Tech inputs prescription
    const rxRes = await request(app)
      .post('/api/v1/dispense/prescriptions')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        patientName: 'Jane Doe',
        patientDob: '1988-04-12',
        patientIdNumber: 'DL-99482',
        prescriberName: 'Dr. Alan Grant, MD',
        prescriberNpi: '1098765432',
        instructions: 'Take 1 capsule by mouth every 8 hours for 7 days',
        items: [
          { medicationId, quantityPrescribed: 21, refillsRemaining: 1 }
        ]
      });

    expect(rxRes.status).toBe(201);
    expect(rxRes.body.status).toBe('PENDING_REVIEW');
    prescriptionId = rxRes.body.id;

    // Tech attempts to dispense without approval -> Blocked (400)
    const blockedDispense = await request(app)
      .post('/api/v1/dispense/execute')
      .set('Authorization', `Bearer ${techToken}`)
      .send({ prescriptionId });
    expect(blockedDispense.status).toBe(400);
    expect(blockedDispense.body.error).toContain('PRESCRIPTION_NOT_APPROVED');

    // Pharmacist reviews and approves
    const approveRes = await request(app)
      .post(`/api/v1/dispense/prescriptions/${prescriptionId}/review`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({ decision: 'APPROVE' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe('PHARMACIST_APPROVED');
  });

  test('4. FEFO Dispensing Execution: Earliest batch allocated first', async () => {
    // Dispense prescription of 21 units
    const dispenseRes = await request(app)
      .post('/api/v1/dispense/execute')
      .set('Authorization', `Bearer ${techToken}`)
      .send({ prescriptionId });

    expect(dispenseRes.status).toBe(200);
    expect(dispenseRes.body.success).toBe(true);

    // Verify early batch was decremented by 21 (50 - 21 = 29 remaining)
    const earlyBatch = await prisma.medicationBatch.findUnique({ where: { id: earlyBatchId } });
    expect(earlyBatch?.currentQty).toBe(29);

    // Late batch should remain untouched (100 units)
    const lateBatch = await prisma.medicationBatch.findUnique({ where: { id: lateBatchId } });
    expect(lateBatch?.currentQty).toBe(100);
  });

  test('5. Controlled Substance Dispensing: DEA & Pharmacist Dual Gate', async () => {
    // 1. Create Schedule II Medication (e.g. Dextroamphetamine)
    const c2Med = await prisma.medication.create({
      data: {
        ndc: `00406-${runId % 10000}-01`,
        brandName: 'Dextroamphetamine 10mg',
        genericName: 'Dextroamphetamine',
        dosageForm: 'Tablet',
        strength: '10mg',
        packageSize: 100,
        deaSchedule: 'SCHEDULE_II',
        unitPriceCents: 6500,
        costPriceCents: 2200,
        requiresPrescription: true
      }
    });
    controlledMedId = c2Med.id;

    // Add batch of 60
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 6);
    await prisma.medicationBatch.create({
      data: {
        medicationId: c2Med.id,
        lotNumber: `DEX-${runId}`,
        expiryDate: exp,
        initialQty: 60,
        currentQty: 60,
        costPriceCents: 2200,
        sellingPriceCents: 6500
      }
    });

    // Create prescription with Valid DEA: AB1234563
    const rxRes = await request(app)
      .post('/api/v1/dispense/prescriptions')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        patientName: 'Robert Langdon',
        patientDob: '1975-06-22',
        patientIdNumber: 'DL-883719',
        prescriberName: 'Dr. Gregory House, MD',
        prescriberNpi: '1098765432',
        prescriberDea: 'AB1234563',
        instructions: 'Take 1 tablet daily in the morning',
        items: [{ medicationId: c2Med.id, quantityPrescribed: 30 }]
      });

    const c2RxId = rxRes.body.id;

    // Pharmacist approves
    await request(app)
      .post(`/api/v1/dispense/prescriptions/${c2RxId}/review`)
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({ decision: 'APPROVE' });

    // Tech attempts to dispense Schedule II -> Blocked (403 Forbidden)
    const techDispense = await request(app)
      .post('/api/v1/dispense/execute')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        prescriptionId: c2RxId,
        controlledDetails: {
          patientPhotoIdType: 'DRIVERS_LICENSE',
          patientPhotoIdNumber: 'DL-883719'
        }
      });
    expect(techDispense.status).toBe(403);
    expect(techDispense.body.error).toContain('UNAUTHORIZED_ROLE');

    // Pharmacist dispenses with valid photo ID -> Success
    const rphDispense = await request(app)
      .post('/api/v1/dispense/execute')
      .set('Authorization', `Bearer ${pharmacistToken}`)
      .send({
        prescriptionId: c2RxId,
        controlledDetails: {
          patientPhotoIdType: 'DRIVERS_LICENSE',
          patientPhotoIdNumber: 'DL-883719'
        }
      });

    expect(rphDispense.status).toBe(200);

    // Verify ControlledSubstanceLog entry exists
    const cLog = await prisma.controlledSubstanceLog.findUnique({
      where: { prescriptionId: c2RxId }
    });
    expect(cLog).not.toBeNull();
    expect(cLog?.prescriberDea).toBe('AB1234563');
    expect(cLog?.dispensingPharmacistLicense).toBe('RPH-10928');
    expect(cLog?.quantityDispensed).toBe(30);
  });

  test('6. POS Retail Checkout with FEFO Batch Deduction and Exact Decimal Cents', async () => {
    // OTC Item (Taxable)
    const otcMed = await prisma.medication.create({
      data: {
        ndc: `00573-${runId % 10000}-01`,
        brandName: 'OTC Pain Relief 200mg',
        genericName: 'Ibuprofen',
        dosageForm: 'Tablet',
        strength: '200mg',
        unitPriceCents: 1000, // $10.00
        costPriceCents: 300,
        deaSchedule: 'NON_CONTROLLED',
        requiresPrescription: false
      }
    });

    const exp = new Date();
    exp.setMonth(exp.getMonth() + 12);
    await prisma.medicationBatch.create({
      data: {
        medicationId: otcMed.id,
        lotNumber: `OTC-${runId}`,
        expiryDate: exp,
        initialQty: 100,
        currentQty: 100,
        costPriceCents: 300,
        sellingPriceCents: 1000
      }
    });

    const checkoutRes = await request(app)
      .post('/api/v1/pos/checkout')
      .set('Authorization', `Bearer ${techToken}`)
      .send({
        items: [{ medicationId: otcMed.id, quantity: 2 }],
        paymentMethod: 'CASH',
        tender: { cashCents: 2500 } // Customer pays $25.00
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.receipt.subtotalCents).toBe(2000); // 2 * $10.00 = $20.00
    // Tax at 8.25% on $20.00 = $1.65 (165 cents)
    expect(checkoutRes.body.receipt.taxCents).toBe(165);
    expect(checkoutRes.body.receipt.totalCents).toBe(2165); // $21.65
  });

  test('7. Append-Only Inventory Movements Ledger Audit', async () => {
    const movements = await prisma.inventoryMovement.findMany({
      where: { medicationId }
    });

    // Should have 2 RECEIPT movements and 1 DISPENSE movement
    expect(movements.length).toBeGreaterThanOrEqual(3);
    const types = movements.map((m: any) => m.movementType);
    expect(types).toContain('RECEIPT');
    expect(types).toContain('DISPENSE');
  });
});
