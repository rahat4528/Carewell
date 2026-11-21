import request from 'supertest';
import { createApp } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Clinical Note Immutability & Addenda Integrity Suite', () => {
  const runId = Date.now();
  let doctorToken: string;
  let doctorId: string;
  let encounterId: string;
  let noteId: string;

  beforeAll(async () => {
    // 1. Create doctor
    const docRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `doc_notes_${runId}@carewell.local`,
        password: 'Password123!',
        name: 'Dr. Notes Specialist, MD',
        role: 'DOCTOR',
        licenseNumber: 'MD-NOTES-1'
      });
    doctorToken = docRes.body.token;
    doctorId = docRes.body.user.id;

    // 2. Create patient & encounter
    const patient = await prisma.patient.create({
      data: {
        mrn: `MRN-99881-${runId % 10}`,
        fullName: 'Notes Test Patient',
        dateOfBirth: '1970-01-01',
        gender: 'OTHER'
      }
    });

    const enc = await prisma.encounter.create({
      data: {
        encounterNumber: `ENC-NOTES-${runId}`,
        patientId: patient.id,
        attendingDoctorId: doctorId,
        status: 'ACTIVE'
      }
    });
    encounterId = enc.id;
  });

  test('allows author to draft and modify an unsigned clinical note', async () => {
    const draftRes = await request(app)
      .post(`/api/v1/clinical/encounters/${encounterId}/notes`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        subjective: 'Patient reports mild headache.',
        objective: 'Neurological exam normal.',
        assessment: 'Tension headache.',
        plan: 'Administer hydration and oral analgesic.'
      });

    expect(draftRes.status).toBe(201);
    expect(draftRes.body.isSigned).toBe(false);
    noteId = draftRes.body.id;

    // Author edits draft
    const editRes = await request(app)
      .put(`/api/v1/clinical/notes/${noteId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        subjective: 'Patient reports mild headache and mild photophobia.'
      });

    expect(editRes.status).toBe(200);
    expect(editRes.body.subjective).toContain('photophobia');
  });

  test('attending physician signs note, permanently locking it from further edits', async () => {
    const signRes = await request(app)
      .post(`/api/v1/clinical/notes/${noteId}/sign`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send();

    expect(signRes.status).toBe(200);
    expect(signRes.body.note.isSigned).toBe(true);

    // Subsequent edit attempt must be strictly rejected with 403 Forbidden
    const illegalEditRes = await request(app)
      .put(`/api/v1/clinical/notes/${noteId}`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        subjective: 'Altered retrospective note content.'
      });

    expect(illegalEditRes.status).toBe(403);
    expect(illegalEditRes.body.error).toContain('NOTE_LOCKED');
  });

  test('attaches append-only signed addendum referencing the parent locked note', async () => {
    const addendumRes = await request(app)
      .post(`/api/v1/clinical/notes/${noteId}/addendum`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        subjective: 'Addendum note at 18:00.',
        objective: 'Headache completely resolved.',
        assessment: 'Resolved tension headache.',
        plan: 'Discharge with follow-up as needed.'
      });

    expect(addendumRes.status).toBe(201);
    expect(addendumRes.body.parentNoteId).toBe(noteId);
    expect(addendumRes.body.noteType).toBe('ADDENDUM');
    expect(addendumRes.body.isSigned).toBe(true);
  });
});
