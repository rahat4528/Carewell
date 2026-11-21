import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Inpatient Bed Allocation & Inter-Ward Transfer Concurrency Suite', () => {
  const runId = Date.now();
  let staffToken: string;
  let wardAId: string;
  let wardBId: string;
  let targetBedId: string;
  let transferTargetBedId: string;
  let patient1Id: string;
  let patient2Id: string;
  let doctorId: string;

  beforeAll(async () => {
    // 1. Staff user
    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `nurse_bed_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Nurse Bed Coordinator',
        role: 'NURSE',
        licenseNumber: 'RN-BED-1'
      });
    staffToken = userRes.body.token;
    doctorId = userRes.body.user.id;

    // 2. Setup Ward A & Ward B
    const wardA = await prisma.ward.create({
      data: {
        name: `Ward A ${runId}`,
        specialty: 'ICU',
        floor: 4,
        dailyRateCents: 250000
      }
    });
    wardAId = wardA.id;

    const wardB = await prisma.ward.create({
      data: {
        name: `Ward B ${runId}`,
        specialty: 'GENERAL_MEDICINE',
        floor: 3,
        dailyRateCents: 75000
      }
    });
    wardBId = wardB.id;

    // 3. Create single available bed in Ward A
    const bedA = await prisma.bed.create({
      data: {
        wardId: wardAId,
        bedNumber: `BED-A-${runId}`,
        status: 'AVAILABLE'
      }
    });
    targetBedId = bedA.id;

    // Create target bed in Ward B
    const bedB = await prisma.bed.create({
      data: {
        wardId: wardBId,
        bedNumber: `BED-B-${runId}`,
        status: 'AVAILABLE'
      }
    });
    transferTargetBedId = bedB.id;

    // 4. Create two synthetic patients
    const pat1 = await prisma.patient.create({
      data: {
        mrn: `MRN-11001-${runId % 10}`,
        fullName: 'Candidate Patient 1',
        dateOfBirth: '1985-02-14',
        gender: 'MALE'
      }
    });
    patient1Id = pat1.id;

    const pat2 = await prisma.patient.create({
      data: {
        mrn: `MRN-11002-${(runId + 1) % 10}`,
        fullName: 'Candidate Patient 2',
        dateOfBirth: '1990-09-20',
        gender: 'FEMALE'
      }
    });
    patient2Id = pat2.id;
  });

  test('prevents double-allocation when two admissions race for the same available bed', async () => {
    // Both patients race for targetBedId in Ward A
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/inpatient/admit')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: patient1Id,
          wardId: wardAId,
          bedId: targetBedId,
          attendingDoctorId: doctorId
        }),
      request(app)
        .post('/api/v1/inpatient/admit')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          patientId: patient2Id,
          wardId: wardAId,
          bedId: targetBedId,
          attendingDoctorId: doctorId
        })
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one 201 Created and one 409 Conflict
    expect(statuses).toEqual([201, 409]);

    const winnerRes = res1.status === 201 ? res1 : res2;
    const loserRes = res1.status === 409 ? res1 : res2;

    expect(loserRes.body.error).toContain('BED_UNAVAILABLE');

    // Bed status in DB must be OCCUPIED
    const bedInDb = await prisma.bed.findUnique({ where: { id: targetBedId } });
    expect(bedInDb?.status).toBe('OCCUPIED');

    // Test inter-ward transfer of the admitted patient to Ward B
    const winningEncounterId = winnerRes.body.id;
    const transferRes = await request(app)
      .post(`/api/v1/inpatient/encounters/${winningEncounterId}/transfer`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        targetWardId: wardBId,
        targetBedId: transferTargetBedId,
        transferReason: 'Clinical step-down'
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.currentBedId).toBe(transferTargetBedId);

    // Old bed must be marked CLEANING
    const oldBedCheck = await prisma.bed.findUnique({ where: { id: targetBedId } });
    expect(oldBedCheck?.status).toBe('CLEANING');

    // New bed must be marked OCCUPIED
    const newBedCheck = await prisma.bed.findUnique({ where: { id: transferTargetBedId } });
    expect(newBedCheck?.status).toBe('OCCUPIED');
  });
});
