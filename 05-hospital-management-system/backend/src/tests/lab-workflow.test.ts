import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Laboratory 4-Eyes Verification & Result Shielding Suite', () => {
  const runId = Date.now();
  let doctorToken: string;
  let labTechToken: string;
  let pathologistToken: string;
  let nurseToken: string;
  let encounterId: string;
  let labOrderId: string;

  beforeAll(async () => {
    // 1. Register Staff
    const docRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `doc_lab_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. Ordering Physician',
        role: 'DOCTOR',
        licenseNumber: 'MD-LAB-1'
      });
    doctorToken = docRes.body.token;

    const techRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `tech_lab_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Alex Lab Tech',
        role: 'LAB_TECH',
        licenseNumber: 'LT-LAB-1'
      });
    labTechToken = techRes.body.token;

    const pathRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `path_lab_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. Certified Pathologist',
        role: 'PATHOLOGIST',
        licenseNumber: 'PATH-LAB-1'
      });
    pathologistToken = pathRes.body.token;

    const nurseRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `nurse_lab_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Nurse Chart Viewer',
        role: 'NURSE',
        licenseNumber: 'RN-LAB-1'
      });
    nurseToken = nurseRes.body.token;

    // 2. Create Patient and Encounter
    const patient = await prisma.patient.create({
      data: {
        mrn: `MRN-33441-${runId % 10}`,
        fullName: 'Lab Test Patient',
        dateOfBirth: '1978-05-12',
        gender: 'MALE'
      }
    });

    const enc = await prisma.encounter.create({
      data: {
        encounterNumber: `ENC-LAB-${runId}`,
        patientId: patient.id,
        attendingDoctorId: docRes.body.user.id,
        status: 'ACTIVE'
      }
    });
    encounterId = enc.id;
  });

  test('full laboratory 4-eyes lifecycle from order to specimen collection, entry and release', async () => {
    // 1. Doctor places lab order
    const orderRes = await request(app)
      .post('/api/v1/laboratory/orders')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        testCode: 'K_POTASSIUM',
        testName: 'Serum Potassium'
      });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.status).toBe('ORDERED');
    labOrderId = orderRes.body.id;

    // 2. Specimen collection recorded
    const collectRes = await request(app)
      .post(`/api/v1/laboratory/orders/${labOrderId}/collect`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send();

    expect(collectRes.status).toBe(200);
    expect(collectRes.body.status).toBe('COLLECTED');

    // 3. Lab Tech enters raw result -> RESULT_PENDING_VERIFICATION
    const resultRes = await request(app)
      .post(`/api/v1/laboratory/orders/${labOrderId}/results`)
      .set('Authorization', `Bearer ${labTechToken}`)
      .send({
        numericValue: 6.2, // Hyperkalemia
        unit: 'mEq/L',
        referenceRange: '3.5 - 5.0 mEq/L',
        isAbnormal: true,
        criticalFlag: true
      });

    expect(resultRes.status).toBe(201);
    expect(resultRes.body.order.status).toBe('RESULT_PENDING_VERIFICATION');

    // 4. Result Shielding: Nurse viewing chart sees masked result pending verification
    const nurseViewRes = await request(app)
      .get(`/api/v1/laboratory/encounters/${encounterId}/results`)
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(nurseViewRes.status).toBe(200);
    expect(nurseViewRes.body[0].result).toBeNull();
    expect(nurseViewRes.body[0].note).toContain('pending pathologist verification');

    // 5. Pathologist reviews and verifies result -> VERIFIED_AND_RELEASED
    const verifyRes = await request(app)
      .post(`/api/v1/laboratory/orders/${labOrderId}/verify`)
      .set('Authorization', `Bearer ${pathologistToken}`)
      .send();

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.order.status).toBe('VERIFIED_AND_RELEASED');

    // 6. Released result is now visible in the patient chart
    const releasedViewRes = await request(app)
      .get(`/api/v1/laboratory/encounters/${encounterId}/results`)
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(releasedViewRes.status).toBe(200);
    expect(releasedViewRes.body[0].result.numericValue).toBe(6.2);
    expect(releasedViewRes.body[0].result.criticalFlag).toBe(true);
  });
});
