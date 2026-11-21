import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Relationship-Based Access Control (ReBAC) & Break-Glass Override Suite', () => {
  const runId = Date.now();
  let attendingDoctorToken: string;
  let outsideDoctorToken: string;
  let encounterId: string;

  beforeAll(async () => {
    // 1. Attending Doctor (ICU)
    const attendingRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `doc_attending_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. Primary Attending, MD',
        role: 'DOCTOR',
        department: 'ICU',
        licenseNumber: 'MD-ATT-1'
      });
    attendingDoctorToken = attendingRes.body.token;

    // 2. Unaffiliated Outside Doctor (Dermatology)
    const outsideRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `doc_outside_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. Outside Consultant, MD',
        role: 'DOCTOR',
        department: 'Dermatology',
        licenseNumber: 'MD-OUT-1'
      });
    outsideDoctorToken = outsideRes.body.token;

    // 3. Create Patient & Active ICU Encounter
    const ward = await prisma.ward.create({
      data: {
        name: `ReBAC Ward ${runId}`,
        specialty: 'ICU',
        floor: 4,
        dailyRateCents: 250000
      }
    });

    const patient = await prisma.patient.create({
      data: {
        mrn: `MRN-55441-${runId % 10}`,
        fullName: 'ReBAC Subject Patient',
        dateOfBirth: '1962-10-30',
        gender: 'FEMALE'
      }
    });

    const enc = await prisma.encounter.create({
      data: {
        encounterNumber: `ENC-REBAC-${runId}`,
        patientId: patient.id,
        attendingDoctorId: attendingRes.body.user.id,
        currentWardId: ward.id,
        status: 'ACTIVE'
      }
    });
    encounterId = enc.id;
  });

  test('assigned attending physician has authorized chart access', async () => {
    const res = await request(app)
      .get(`/api/v1/access/encounters/${encounterId}/check`)
      .set('Authorization', `Bearer ${attendingDoctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.authorized).toBe(true);
    expect(res.body.reason).toBe('DIRECT_CARE_TEAM_ASSIGNMENT');
  });

  test('unaffiliated outside doctor is denied chart access under ReBAC (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/v1/access/encounters/${encounterId}/check`)
      .set('Authorization', `Bearer ${outsideDoctorToken}`);

    expect(res.status).toBe(403);
    expect(res.body.authorized).toBe(false);
    expect(res.body.error).toContain('REBAC_DENIAL');
  });

  test('emergency break-glass override requires detailed clinical justification (min 15 chars)', async () => {
    // Insufficient justification
    const shortJustification = await request(app)
      .post(`/api/v1/access/encounters/${encounterId}/break-glass`)
      .set('Authorization', `Bearer ${outsideDoctorToken}`)
      .send({ justificationReason: 'Emergency' });

    expect(shortJustification.status).toBe(400);
    expect(shortJustification.body.error).toContain('JUSTIFICATION_REQUIRED');

    // Valid clinical emergency justification
    const validBreakGlass = await request(app)
      .post(`/api/v1/access/encounters/${encounterId}/break-glass`)
      .set('Authorization', `Bearer ${outsideDoctorToken}`)
      .send({
        justificationReason: 'Emergency code blue called in ICU; covering physician performing urgent airway intervention.'
      });

    expect(validBreakGlass.status).toBe(201);
    expect(validBreakGlass.body.success).toBe(true);
    expect(validBreakGlass.body.message).toContain('Audit notification dispatched');

    // Access check now succeeds under ACTIVE_EMERGENCY_BREAK_GLASS
    const accessCheckAfter = await request(app)
      .get(`/api/v1/access/encounters/${encounterId}/check`)
      .set('Authorization', `Bearer ${outsideDoctorToken}`);

    expect(accessCheckAfter.status).toBe(200);
    expect(accessCheckAfter.body.authorized).toBe(true);
    expect(accessCheckAfter.body.isBreakGlass).toBe(true);

    // Verify tamper-evident audit record was logged
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'EMERGENCY_BREAK_GLASS_DECLARED', entityId: encounterId }
    });
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].detailsJson).toContain('code blue');
  });
});
