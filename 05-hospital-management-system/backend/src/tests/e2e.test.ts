import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';
import { generateLuhnMrn } from '../modules/mrn/mrn-generator';

const prisma = new PrismaClient();
const app = createApp();

describe('Hospital Management System - Comprehensive End-to-End Suite', () => {
  const runId = Date.now();

  let doctorToken: string;
  let doctorId: string;
  let nurseToken: string;
  let pathologistToken: string;
  let labTechToken: string;

  let patientId: string;
  let mrn: string;
  let icuWardId: string;
  let genWardId: string;
  let icuBedId: string;
  let genBedId: string;
  let encounterId: string;
  let noteId: string;
  let labOrderId: string;

  beforeAll(async () => {
    // 1. Register Clinical Staff
    const docRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `doc_e2e_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. James Wilson, MD',
        role: 'DOCTOR',
        department: 'ICU',
        licenseNumber: 'MD-E2E-1'
      });
    doctorToken = docRes.body.token;
    doctorId = docRes.body.user.id;

    const nurseRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `nurse_e2e_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Nurse Carol Hathaway, RN',
        role: 'NURSE',
        department: 'ICU',
        licenseNumber: 'RN-E2E-1'
      });
    nurseToken = nurseRes.body.token;

    const pathRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `path_e2e_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. Beverly Crusher, MD',
        role: 'PATHOLOGIST',
        licenseNumber: 'PATH-E2E-1'
      });
    pathologistToken = pathRes.body.token;

    const techRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `tech_e2e_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Leo Fitz, Lab Tech',
        role: 'LAB_TECH',
        licenseNumber: 'LT-E2E-1'
      });
    labTechToken = techRes.body.token;

    // 2. Setup Wards & Beds
    const icu = await prisma.ward.create({
      data: {
        name: `ICU Ward ${runId}`,
        specialty: 'ICU',
        floor: 4,
        dailyRateCents: 250000 // $2,500/day
      }
    });
    icuWardId = icu.id;

    const gen = await prisma.ward.create({
      data: {
        name: `General Ward ${runId}`,
        specialty: 'GENERAL_MEDICINE',
        floor: 3,
        dailyRateCents: 75000 // $750/day
      }
    });
    genWardId = gen.id;

    const bed1 = await prisma.bed.create({
      data: {
        wardId: icuWardId,
        bedNumber: `ICU-BED-${runId}`,
        status: 'AVAILABLE'
      }
    });
    icuBedId = bed1.id;

    const bed2 = await prisma.bed.create({
      data: {
        wardId: genWardId,
        bedNumber: `GEN-BED-${runId}`,
        status: 'AVAILABLE'
      }
    });
    genBedId = bed2.id;
  });

  test('1. System Health Probe & Clinical Disclaimer Header', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.headers['x-carewell-clinical-notice']).toContain('licensed healthcare professionals');
  });

  test('2. Patient Registration with Validated Luhn MRN', async () => {
    mrn = generateLuhnMrn();
    const regRes = await request(app)
      .post('/api/v1/patients')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        mrn,
        fullName: 'Marcus Aurelius',
        dateOfBirth: '1974-04-26',
        gender: 'MALE',
        bloodType: 'AB+',
        phone: '+1-555-883-9921',
        email: 'marcus.aurelius@carewell.local',
        allergies: [
          { allergen: 'Sulfa Drugs', severity: 'MODERATE', reaction: 'Skin rash' }
        ]
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.mrn).toBe(mrn);
    patientId = regRes.body.id;
  });

  test('3. Standardized HL7 FHIR R4 Patient Resource Export', async () => {
    const fhirRes = await request(app)
      .get(`/api/v1/patients/${patientId}/fhir`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(fhirRes.status).toBe(200);
    expect(fhirRes.body.resourceType).toBe('Patient');
    expect(fhirRes.body.identifier[0].value).toBe(mrn);
    expect(fhirRes.body.gender).toBe('male');
  });

  test('4. Inpatient Admission to ICU Bed (Atomic Transaction)', async () => {
    const admitRes = await request(app)
      .post('/api/v1/inpatient/admit')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        patientId,
        wardId: icuWardId,
        bedId: icuBedId,
        attendingDoctorId: doctorId,
        encounterType: 'INPATIENT'
      });

    expect(admitRes.status).toBe(201);
    expect(admitRes.body.status).toBe('ACTIVE');
    expect(admitRes.body.currentBedId).toBe(icuBedId);
    encounterId = admitRes.body.id;

    // Verify bed is now OCCUPIED
    const bedCheck = await prisma.bed.findUnique({ where: { id: icuBedId } });
    expect(bedCheck?.status).toBe('OCCUPIED');
  });

  test('5. Vitals Recording with Physiological Plausibility Validation', async () => {
    const vitalsRes = await request(app)
      .post(`/api/v1/clinical/encounters/${encounterId}/vitals`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send({
        heartRateBpm: 78,
        systolicBp: 124,
        diastolicBp: 82,
        respiratoryRateBpm: 16,
        temperatureCelsius: 37.1,
        spo2Percent: 99
      });

    expect(vitalsRes.status).toBe(201);
    expect(vitalsRes.body.alertLevel).toBe('NORMAL');
    expect(vitalsRes.body.isAbnormal).toBe(false);
  });

  test('6. Diagnostic Laboratory Order, Specimen Collection, and 4-Eyes Pathologist Verification', async () => {
    // 1. Doctor orders High-Sensitivity Troponin
    const orderRes = await request(app)
      .post('/api/v1/laboratory/orders')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        encounterId,
        testCode: 'TROPONIN_HS',
        testName: 'High Sensitivity Troponin T'
      });

    expect(orderRes.status).toBe(201);
    labOrderId = orderRes.body.id;

    // 2. Nurse records specimen collection
    await request(app)
      .post(`/api/v1/laboratory/orders/${labOrderId}/collect`)
      .set('Authorization', `Bearer ${nurseToken}`)
      .send();

    // 3. Lab Tech enters result
    const resultRes = await request(app)
      .post(`/api/v1/laboratory/orders/${labOrderId}/results`)
      .set('Authorization', `Bearer ${labTechToken}`)
      .send({
        numericValue: 0.02,
        unit: 'ng/mL',
        referenceRange: '< 0.04 ng/mL',
        isAbnormal: false,
        criticalFlag: false
      });

    expect(resultRes.status).toBe(201);
    expect(resultRes.body.order.status).toBe('RESULT_PENDING_VERIFICATION');

    // 4. Pathologist verifies and releases
    const verifyRes = await request(app)
      .post(`/api/v1/laboratory/orders/${labOrderId}/verify`)
      .set('Authorization', `Bearer ${pathologistToken}`)
      .send();

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.order.status).toBe('VERIFIED_AND_RELEASED');
  });

  test('7. Attending SOAP Note Authoring & Permanent Signature Locking', async () => {
    // Author draft note
    const noteRes = await request(app)
      .post(`/api/v1/clinical/encounters/${encounterId}/notes`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        subjective: 'Patient denies chest pressure, dyspnea, or palpitations.',
        objective: 'Telemetry displays sinus rhythm. Troponin normal at 0.02 ng/mL.',
        assessment: 'Cardiomyopathy ruled out. Hemodynamically stable.',
        plan: 'Transfer to General Medical Ward for observation; discharge tomorrow morning.'
      });

    expect(noteRes.status).toBe(201);
    noteId = noteRes.body.id;

    // Sign and lock note
    const signRes = await request(app)
      .post(`/api/v1/clinical/notes/${noteId}/sign`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send();

    expect(signRes.status).toBe(200);
    expect(signRes.body.note.isSigned).toBe(true);
  });

  test('8. Inter-Ward Stepdown Bed Transfer (ICU -> General Med)', async () => {
    const transferRes = await request(app)
      .post(`/api/v1/inpatient/encounters/${encounterId}/transfer`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        targetWardId: genWardId,
        targetBedId: genBedId,
        transferReason: 'Clinical stepdown from ICU'
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.currentWardId).toBe(genWardId);
    expect(transferRes.body.currentBedId).toBe(genBedId);

    // Old ICU bed must be marked CLEANING
    const oldBedCheck = await prisma.bed.findUnique({ where: { id: icuBedId } });
    expect(oldBedCheck?.status).toBe('CLEANING');

    // New General bed must be OCCUPIED
    const newBedCheck = await prisma.bed.findUnique({ where: { id: genBedId } });
    expect(newBedCheck?.status).toBe('OCCUPIED');
  });

  test('9. Inpatient Discharge with Room Charges Calculation', async () => {
    const dischargeRes = await request(app)
      .post(`/api/v1/inpatient/encounters/${encounterId}/discharge`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send();

    expect(dischargeRes.status).toBe(200);
    expect(dischargeRes.body.encounter.status).toBe('DISCHARGED');
    expect(dischargeRes.body.billing.daysCharged).toBeGreaterThanOrEqual(1);
    expect(dischargeRes.body.billing.totalRoomChargesCents).toBeGreaterThan(0);

    // Bed must be freed to CLEANING
    const bedCheck = await prisma.bed.findUnique({ where: { id: genBedId } });
    expect(bedCheck?.status).toBe('CLEANING');
  });

  test('10. Tamper-Evident Audit Trail Integrity Verification', async () => {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'Encounter',
        entityId: encounterId
      }
    });

    expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    const actions = auditLogs.map((a: any) => a.action);
    expect(actions).toContain('PATIENT_ADMITTED');
    expect(actions).toContain('PATIENT_DISCHARGED');
  });
});
