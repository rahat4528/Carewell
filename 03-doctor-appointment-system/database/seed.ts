import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { encryptClinicalNote } from "./modules/crypto/clinical-crypto";

const prisma = new PrismaClient();
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

export async function seedAppointmentDatabase() {
  console.log("🌱 Seeding Carewell Doctor Appointment System database...");

  // 1. Seed Specialties
  const specialties = [
    { name: "Cardiology", description: "Heart and cardiovascular system care." },
    { name: "Dermatology", description: "Skin, hair, and nail health." },
    { name: "Pediatrics", description: "Infant, child, and adolescent healthcare." },
    { name: "Orthopedics", description: "Musculoskeletal system, joints, and spine." },
    { name: "Family Medicine", description: "Comprehensive primary care for all ages." },
    { name: "Neurology", description: "Disorders of the nervous system and brain." }
  ];

  const createdSpecialties: Record<string, string> = {};
  for (const s of specialties) {
    const record = await prisma.specialty.upsert({
      where: { name: s.name },
      update: { description: s.description },
      create: s
    });
    createdSpecialties[s.name] = record.id;
  }
  console.log(`✓ Seeded ${specialties.length} medical specialties.`);

  // 2. Seed Clinics
  const clinic1 = await prisma.clinic.upsert({
    where: { id: "clinic_outpatient_pavilion" },
    update: {},
    create: {
      id: "clinic_outpatient_pavilion",
      name: "Carewell Outpatient Pavilion",
      address: "100 Medical Parkway, New York, NY 10001",
      timezone: "America/New_York",
      phone: "+1 (212) 555-0100"
    }
  });

  const clinic2 = await prisma.clinic.upsert({
    where: { id: "clinic_downtown_medical" },
    update: {},
    create: {
      id: "clinic_downtown_medical",
      name: "Carewell Downtown Medical Center",
      address: "450 Broadway, Suite 500, New York, NY 10013",
      timezone: "America/New_York",
      phone: "+1 (212) 555-0200"
    }
  });

  // 3. Seed Administrator
  const adminEmail = "admin@carewell.local";
  const passHash = await bcrypt.hash("CarewellDemo2026!", 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: passHash,
      name: "System Administrator",
      role: "ADMIN"
    }
  });

  // 4. Seed Verified Doctor (Dr. Sarah Jenkins - Cardiology)
  const drJenkinsEmail = "dr.jenkins@carewell.local";
  let drJenkins = await prisma.user.findUnique({ where: { email: drJenkinsEmail } });
  if (!drJenkins) {
    drJenkins = await prisma.user.create({
      data: {
        email: drJenkinsEmail,
        passwordHash: passHash,
        name: "Dr. Sarah Jenkins, MD",
        role: "DOCTOR",
        doctor: {
          create: {
            specialtyId: createdSpecialties["Cardiology"],
            licenseNumber: "NY-MED-84920",
            consultationFee: 200.0,
            bio: "Board-certified cardiologist specializing in preventive cardiology and hypertension management.",
            verificationStatus: "VERIFIED",
            rating: 4.9,
            ratingCount: 38
          }
        }
      }
    });

    const docProfile = await prisma.doctorProfile.findUnique({ where: { userId: drJenkins.id } });
    if (docProfile) {
      // Affiliate with clinic
      await prisma.doctorClinicAffiliation.create({
        data: { doctorId: docProfile.id, clinicId: clinic1.id }
      });

      // Seed recurring Monday schedule
      await prisma.doctorSchedule.create({
        data: {
          doctorId: docProfile.id,
          clinicId: clinic1.id,
          dayOfWeek: 1, // Monday
          startTime: "09:00",
          endTime: "12:00",
          slotDurationMinutes: 30,
          bufferMinutes: 5
        }
      });

      // Seed discrete time slots for upcoming Monday
      const slot1 = await prisma.availabilitySlot.create({
        data: {
          doctorId: docProfile.id,
          clinicId: clinic1.id,
          startTime: new Date("2026-11-23T14:00:00Z"), // 09:00 EST in UTC
          endTime: new Date("2026-11-23T14:30:00Z"),
          isBooked: false
        }
      });

      const slot2 = await prisma.availabilitySlot.create({
        data: {
          doctorId: docProfile.id,
          clinicId: clinic1.id,
          startTime: new Date("2026-11-23T14:35:00Z"), // 09:35 EST in UTC
          endTime: new Date("2026-11-23T15:05:00Z"),
          isBooked: false
        }
      });
    }
  }

  // 5. Seed Unverified Doctor (Dr. Emily Vance - Pending Verification)
  const drVanceEmail = "dr.vance@carewell.local";
  let drVance = await prisma.user.findUnique({ where: { email: drVanceEmail } });
  if (!drVance) {
    drVance = await prisma.user.create({
      data: {
        email: drVanceEmail,
        passwordHash: passHash,
        name: "Dr. Emily Vance, MD",
        role: "DOCTOR",
        doctor: {
          create: {
            specialtyId: createdSpecialties["Pediatrics"],
            licenseNumber: "NY-PENDING-12345",
            consultationFee: 150.0,
            bio: "Pediatric care specialist awaiting credential verification.",
            verificationStatus: "PENDING_VERIFICATION"
          }
        }
      }
    });
  }

  // 6. Seed Demo Patient
  const patientEmail = "patient@carewell.local";
  let patientUser = await prisma.user.findUnique({ where: { email: patientEmail } });
  if (!patientUser) {
    patientUser = await prisma.user.create({
      data: {
        email: patientEmail,
        passwordHash: passHash,
        name: "David Miller",
        role: "PATIENT",
        patient: {
          create: {
            phone: "+1 (555) 345-6789",
            dateOfBirth: "1988-03-22",
            gender: "MALE",
            timezone: "America/New_York"
          }
        }
      }
    });
  }

  console.log("✅ Carewell Doctor Appointment System database seeding completed successfully.");
}

if (require.main === module) {
  seedAppointmentDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
