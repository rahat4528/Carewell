import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateLuhnMrn } from './modules/mrn/mrn-generator';

const prisma = new PrismaClient();

export async function seedHospitalDatabase() {
  console.log('🌱 Seeding Carewell Hospital Management System database...');

  const passwordHash = await bcrypt.hash('Carewell123!', 10);

  // 1. Staff Accounts
  const attendingDoctor = await prisma.user.upsert({
    where: { email: 'attending@carewell.local' },
    update: {},
    create: {
      email: 'attending@carewell.local',
      passwordHash,
      name: 'Dr. Marcus Vance, MD, FACC',
      role: 'DOCTOR',
      department: 'ICU',
      licenseNumber: 'MD-88401'
    }
  });

  const otherDoctor = await prisma.user.upsert({
    where: { email: 'otherdoctor@carewell.local' },
    update: {},
    create: {
      email: 'otherdoctor@carewell.local',
      passwordHash,
      name: 'Dr. Helena Rios, MD',
      role: 'DOCTOR',
      department: 'Dermatology',
      licenseNumber: 'MD-77291'
    }
  });

  const primaryNurse = await prisma.user.upsert({
    where: { email: 'nurse@carewell.local' },
    update: {},
    create: {
      email: 'nurse@carewell.local',
      passwordHash,
      name: 'Clara Oswald, BSN, RN',
      role: 'NURSE',
      department: 'ICU',
      licenseNumber: 'RN-10492'
    }
  });

  const pathologist = await prisma.user.upsert({
    where: { email: 'pathologist@carewell.local' },
    update: {},
    create: {
      email: 'pathologist@carewell.local',
      passwordHash,
      name: 'Dr. Raymond Holt, MD, FCAP',
      role: 'PATHOLOGIST',
      department: 'Pathology',
      licenseNumber: 'PATH-4410'
    }
  });

  const labTech = await prisma.user.upsert({
    where: { email: 'labtech@carewell.local' },
    update: {},
    create: {
      email: 'labtech@carewell.local',
      passwordHash,
      name: 'Dexter Morgan, MLS(ASCP)',
      role: 'LAB_TECH',
      department: 'Pathology',
      licenseNumber: 'LT-9912'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@carewell.local' },
    update: {},
    create: {
      email: 'admin@carewell.local',
      passwordHash,
      name: 'Sarah Connor, Chief Clinical Officer',
      role: 'ADMIN'
    }
  });

  console.log('✓ Seeded hospital clinical staff accounts.');

  // 2. Hospital Wards & Beds
  const icuWard = await prisma.ward.upsert({
    where: { name: 'Intensive Care Unit (ICU)' },
    update: {},
    create: {
      name: 'Intensive Care Unit (ICU)',
      specialty: 'ICU',
      floor: 4,
      dailyRateCents: 250000 // $2,500.00 / day
    }
  });

  const generalMedWard = await prisma.ward.upsert({
    where: { name: 'General Medical Ward' },
    update: {},
    create: {
      name: 'General Medical Ward',
      specialty: 'GENERAL_MEDICINE',
      floor: 3,
      dailyRateCents: 75000 // $750.00 / day
    }
  });

  const surgicalWard = await prisma.ward.upsert({
    where: { name: 'Surgical Recovery Ward' },
    update: {},
    create: {
      name: 'Surgical Recovery Ward',
      specialty: 'SURGICAL',
      floor: 2,
      dailyRateCents: 120000 // $1,200.00 / day
    }
  });

  // Beds in ICU
  const bed101 = await prisma.bed.upsert({
    where: { wardId_bedNumber: { wardId: icuWard.id, bedNumber: 'ICU-101' } },
    update: {},
    create: { wardId: icuWard.id, bedNumber: 'ICU-101', status: 'AVAILABLE' }
  });

  const bed102 = await prisma.bed.upsert({
    where: { wardId_bedNumber: { wardId: icuWard.id, bedNumber: 'ICU-102' } },
    update: {},
    create: { wardId: icuWard.id, bedNumber: 'ICU-102', status: 'AVAILABLE' }
  });

  const bed103 = await prisma.bed.upsert({
    where: { wardId_bedNumber: { wardId: icuWard.id, bedNumber: 'ICU-103' } },
    update: {},
    create: { wardId: icuWard.id, bedNumber: 'ICU-103', status: 'OCCUPIED' }
  });

  // Beds in General Med
  await prisma.bed.upsert({
    where: { wardId_bedNumber: { wardId: generalMedWard.id, bedNumber: 'MED-301' } },
    update: {},
    create: { wardId: generalMedWard.id, bedNumber: 'MED-301', status: 'AVAILABLE' }
  });

  await prisma.bed.upsert({
    where: { wardId_bedNumber: { wardId: generalMedWard.id, bedNumber: 'MED-302' } },
    update: {},
    create: { wardId: generalMedWard.id, bedNumber: 'MED-302', status: 'AVAILABLE' }
  });

  console.log('✓ Seeded 3 hospital wards and inpatient beds.');

  // 3. Seed Synthetic Patients with Luhn MRNs
  const mrn1 = generateLuhnMrn(10023);
  const patient1 = await prisma.patient.upsert({
    where: { mrn: mrn1 },
    update: {},
    create: {
      mrn: mrn1,
      fullName: 'Eleanor Rigby',
      dateOfBirth: '1965-08-15',
      gender: 'FEMALE',
      bloodType: 'A+',
      phone: '+1-555-019-2831',
      email: 'eleanor.rigby@carewell.local',
      allergiesJson: JSON.stringify([
        { allergen: 'Penicillin', severity: 'LIFE_THREATENING', reaction: 'Anaphylaxis' },
        { allergen: 'Latex', severity: 'MODERATE', reaction: 'Contact dermatitis' }
      ]),
      emergencyContactName: 'Father McKenzie',
      emergencyContactPhone: '+1-555-019-2832'
    }
  });

  const mrn2 = generateLuhnMrn(20045);
  await prisma.patient.upsert({
    where: { mrn: mrn2 },
    update: {},
    create: {
      mrn: mrn2,
      fullName: 'Arthur Pendelton',
      dateOfBirth: '1982-11-04',
      gender: 'MALE',
      bloodType: 'O-',
      phone: '+1-555-019-8812',
      email: 'arthur.pendelton@carewell.local',
      allergiesJson: '[]',
      emergencyContactName: 'Gwen Pendelton',
      emergencyContactPhone: '+1-555-019-8813'
    }
  });

  // 4. Seed Active Inpatient Encounter for Eleanor Rigby in ICU-103
  const existingEncounter = await prisma.encounter.findFirst({
    where: { patientId: patient1.id, status: 'ACTIVE' }
  });

  if (!existingEncounter) {
    const enc = await prisma.encounter.create({
      data: {
        encounterNumber: 'ENC-009182',
        patientId: patient1.id,
        encounterType: 'INPATIENT',
        status: 'ACTIVE',
        attendingDoctorId: attendingDoctor.id,
        primaryNurseId: primaryNurse.id,
        currentWardId: icuWard.id,
        currentBedId: bed103.id,
        admissionDate: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      }
    });

    // Seed baseline vitals
    await prisma.vitalSign.create({
      data: {
        encounterId: enc.id,
        recordedById: primaryNurse.id,
        heartRateBpm: 76,
        systolicBp: 122,
        diastolicBp: 78,
        respiratoryRateBpm: 16,
        temperatureCelsius: 37.0,
        spo2Percent: 98,
        isAbnormal: false,
        alertLevel: 'NORMAL'
      }
    });

    // Seed signed clinical SOAP note
    await prisma.clinicalNote.create({
      data: {
        encounterId: enc.id,
        authorId: attendingDoctor.id,
        noteType: 'SOAP_PROGRESS',
        subjective: 'Patient reports improved breathing following initiation of supportive oxygen.',
        objective: 'Lungs clear bilaterally. Vitals stable. No peripheral edema.',
        assessment: 'Resolving non-cardiac pulmonary congestion. Stable on low-flow cannula.',
        plan: 'Wean oxygen over the next 24 hours. Step-down transfer to General Medical Ward tomorrow.',
        isSigned: true,
        signedAt: new Date(),
        signedById: attendingDoctor.id
      }
    });

    // Seed verified lab test
    const labOrder = await prisma.labOrder.create({
      data: {
        encounterId: enc.id,
        testCode: 'TROPONIN_I',
        testName: 'High Sensitivity Troponin I',
        status: 'VERIFIED_AND_RELEASED',
        orderedById: attendingDoctor.id,
        collectedAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
      }
    });

    await prisma.labResult.create({
      data: {
        labOrderId: labOrder.id,
        numericValue: 0.01,
        unit: 'ng/mL',
        referenceRange: '< 0.04 ng/mL',
        isAbnormal: false,
        criticalFlag: false,
        enteredById: labTech.id,
        verifiedById: pathologist.id,
        verifiedAt: new Date(Date.now() - 30 * 60 * 60 * 1000)
      }
    });
  }

  console.log('✓ Seeded active encounter, signed note, and verified lab order.');
  console.log('✅ Carewell Hospital Management System database seeding completed successfully.');
}

if (require.main === module) {
  seedHospitalDatabase()
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
