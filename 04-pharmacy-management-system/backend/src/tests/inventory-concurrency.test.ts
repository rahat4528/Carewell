import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Inventory Invariants & Concurrency Race Condition Suite', () => {
  let pharmacistToken: string;
  let testMedId: string;
  let testBatchId: string;

  beforeAll(async () => {
    // 1. Create staff user
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `tech_race_${Date.now()}@carewell.local`,
        password: 'Password123!',
        name: 'Race Condition Tester',
        role: 'PHARMACIST',
        licenseNumber: 'RPH-TEST-99'
      });
    pharmacistToken = regRes.body.token;

    // 2. Create medication with limited stock (exactly 10 units)
    const med = await prisma.medication.create({
      data: {
        ndc: `TEST-RACE-${Date.now()}`,
        brandName: 'Race Test Medication',
        genericName: 'RaceTest',
        dosageForm: 'Tablet',
        strength: '10mg',
        unitPriceCents: 1000,
        costPriceCents: 300,
        deaSchedule: 'NON_CONTROLLED',
        requiresPrescription: false
      }
    });
    testMedId = med.id;

    // 3. Create batch with exactly 10 units
    const batch = await prisma.medicationBatch.create({
      data: {
        medicationId: med.id,
        lotNumber: `LOT-RACE-${Date.now()}`,
        expiryDate: new Date('2027-12-31T00:00:00Z'),
        initialQty: 10,
        currentQty: 10,
        costPriceCents: 300,
        sellingPriceCents: 1000,
        isQuarantined: false
      }
    });
    testBatchId = batch.id;
  });

  test('prevents over-depletion and non-negative stock violations under concurrent parallel checkouts', async () => {
    // Both parallel requests attempt to buy 7 units from a stock of 10
    // Total requested = 14 > 10. Only 1 can succeed, other must be rejected.
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/pos/checkout')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          items: [{ medicationId: testMedId, quantity: 7 }],
          paymentMethod: 'CASH'
        }),
      request(app)
        .post('/api/v1/pos/checkout')
        .set('Authorization', `Bearer ${pharmacistToken}`)
        .send({
          items: [{ medicationId: testMedId, quantity: 7 }],
          paymentMethod: 'CASH'
        })
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one 201 (Created) and one 400 or 409
    expect(statuses[0]).toBe(201);
    expect([400, 409]).toContain(statuses[1]);

    // Check final stock in database: must be exactly 3 (10 - 7), NEVER negative
    const finalBatch = await prisma.medicationBatch.findUnique({
      where: { id: testBatchId }
    });
    expect(finalBatch?.currentQty).toBe(3);
    expect(finalBatch!.currentQty).toBeGreaterThanOrEqual(0);
  });
});
