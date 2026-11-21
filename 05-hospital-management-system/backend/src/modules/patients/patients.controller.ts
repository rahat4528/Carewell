import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedHospitalRequest } from '../auth/auth.middleware';
import { AuditService } from '../audit/audit-service';
import { generateLuhnMrn, verifyLuhnMrn } from '../mrn/mrn-generator';

const router = Router();
const prisma = new PrismaClient();
const audit = new AuditService(prisma);

// GET /patients (Search patient index)
router.get('/', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { mrn: { contains: String(search) } },
        { dateOfBirth: { contains: String(search) } }
      ];
    }

    const patients = await prisma.patient.findMany({
      where,
      orderBy: { fullName: 'asc' },
      take: 50
    });

    return res.json(patients);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /patients (Register patient with verified Luhn MRN)
router.post('/', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const {
      mrn,
      fullName,
      dateOfBirth,
      gender,
      bloodType,
      phone,
      email,
      allergies,
      emergencyContactName,
      emergencyContactPhone
    } = req.body;

    if (!fullName || !dateOfBirth || !gender) {
      return res.status(400).json({ error: 'fullName, dateOfBirth, and gender are required.' });
    }

    let finalMrn = mrn;
    if (finalMrn) {
      const check = verifyLuhnMrn(finalMrn);
      if (!check.isValid) {
        return res.status(400).json({ error: `INVALID_MRN: ${check.reason}` });
      }
    } else {
      finalMrn = generateLuhnMrn();
    }

    const patient = await prisma.patient.create({
      data: {
        mrn: finalMrn,
        fullName,
        dateOfBirth,
        gender,
        bloodType: bloodType || null,
        phone: phone || null,
        email: email || null,
        allergiesJson: allergies ? JSON.stringify(allergies) : '[]',
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null
      }
    });

    await audit.recordEntry({
      action: 'PATIENT_REGISTERED',
      entityType: 'Patient',
      entityId: patient.id,
      actorId: req.user!.id,
      details: { mrn: patient.mrn, fullName: patient.fullName }
    });

    return res.status(201).json(patient);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /patients/:id (Full patient chart)
router.get('/:id', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id as string },
      include: {
        encounters: {
          orderBy: { admissionDate: 'desc' },
          include: {
            ward: true,
            bed: true,
            vitals: { orderBy: { recordedAt: 'desc' }, take: 10 },
            notes: {
              where: { parentNoteId: null },
              include: { addenda: true },
              orderBy: { createdAt: 'desc' }
            },
            labOrders: {
              include: { result: true },
              orderBy: { orderedAt: 'desc' }
            }
          }
        }
      }
    });

    if (!patient) return res.status(404).json({ error: 'Patient chart not found.' });

    await audit.recordEntry({
      action: 'CHART_ACCESSED',
      entityType: 'Patient',
      entityId: patient.id,
      actorId: req.user!.id,
      details: { mrn: patient.mrn }
    });

    return res.json(patient);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /patients/:id/fhir (HL7 FHIR R4 Patient Resource)
router.get('/:id/fhir', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id as string }
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found.' });

    const fhirResource = {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        {
          use: 'usual',
          type: {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                code: 'MR',
                display: 'Medical Record Number'
              }
            ]
          },
          system: 'https://carewell.hospital.local/mrn',
          value: patient.mrn
        }
      ],
      name: [
        {
          use: 'official',
          text: patient.fullName
        }
      ],
      gender: patient.gender.toLowerCase(),
      birthDate: patient.dateOfBirth,
      telecom: [
        patient.phone ? { system: 'phone', value: patient.phone, use: 'mobile' } : null,
        patient.email ? { system: 'email', value: patient.email } : null
      ].filter(Boolean)
    };

    return res.json(fhirResource);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
