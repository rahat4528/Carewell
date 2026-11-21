import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedPharmacyDatabase() {
  console.log('🌱 Seeding Carewell Pharmacy Management System database...');

  const passwordHash = await bcrypt.hash('Carewell123!', 10);

  // 1. Seed Staff Users
  const pharmacist = await prisma.user.upsert({
    where: { email: 'pharmacist@carewell.local' },
    update: {},
    create: {
      email: 'pharmacist@carewell.local',
      passwordHash,
      name: 'Dr. Marcus Reed, PharmD, RPh',
      role: 'PHARMACIST',
      licenseNumber: 'RPH-99201'
    }
  });

  const tech = await prisma.user.upsert({
    where: { email: 'tech@carewell.local' },
    update: {},
    create: {
      email: 'tech@carewell.local',
      passwordHash,
      name: 'Jordan Taylor, CPhT',
      role: 'PHARMACY_TECH',
      licenseNumber: 'CPHT-4401'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@carewell.local' },
    update: {},
    create: {
      email: 'admin@carewell.local',
      passwordHash,
      name: 'Elena Rostova, Operations Director',
      role: 'ADMIN'
    }
  });

  console.log('✓ Seeded staff accounts (Pharmacist, Pharmacy Tech, Administrator).');

  // 2. Seed Medications & Batches
  const now = new Date();
  const plusMonths = (m: number) => new Date(now.getFullYear(), now.getMonth() + m, 15);
  const minusMonths = (m: number) => new Date(now.getFullYear(), now.getMonth() - m, 15);

  const medicationsData = [
    {
      ndc: '00093-3109-01',
      brandName: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin',
      dosageForm: 'Capsule',
      strength: '500mg',
      packageSize: 100,
      deaSchedule: 'NON_CONTROLLED' as const,
      unitPriceCents: 1850, // $18.50
      costPriceCents: 620,   // $6.20
      reorderLevel: 50,
      requiresPrescription: true,
      batches: [
        { lotNumber: 'AMX-2026A', expiryDate: plusMonths(3), qty: 100, cost: 620, sell: 1850, isQuarantined: false },
        { lotNumber: 'AMX-2026B', expiryDate: plusMonths(12), qty: 250, cost: 600, sell: 1850, isQuarantined: false },
        { lotNumber: 'AMX-2025X', expiryDate: minusMonths(2), qty: 40, cost: 620, sell: 1850, isQuarantined: true }
      ]
    },
    {
      ndc: '00093-7214-01',
      brandName: 'Lisinopril 10mg',
      genericName: 'Lisinopril',
      dosageForm: 'Tablet',
      strength: '10mg',
      packageSize: 100,
      deaSchedule: 'NON_CONTROLLED' as const,
      unitPriceCents: 1200, // $12.00
      costPriceCents: 350,   // $3.50
      reorderLevel: 60,
      requiresPrescription: true,
      batches: [
        { lotNumber: 'LIS-2026A', expiryDate: plusMonths(6), qty: 300, cost: 350, sell: 1200, isQuarantined: false }
      ]
    },
    {
      ndc: '00573-0160-20',
      brandName: 'Advil Liqui-Gels 200mg',
      genericName: 'Ibuprofen',
      dosageForm: 'Capsule',
      strength: '200mg',
      packageSize: 80,
      deaSchedule: 'NON_CONTROLLED' as const,
      unitPriceCents: 1099, // $10.99
      costPriceCents: 450,   // $4.50
      reorderLevel: 40,
      requiresPrescription: false, // OTC (Taxable)
      batches: [
        { lotNumber: 'IBU-2026A', expiryDate: plusMonths(9), qty: 500, cost: 450, sell: 1099, isQuarantined: false }
      ]
    },
    {
      ndc: '00406-1144-01',
      brandName: 'Ritalin 10mg',
      genericName: 'Methylphenidate HCl',
      dosageForm: 'Tablet',
      strength: '10mg',
      packageSize: 100,
      deaSchedule: 'SCHEDULE_II' as const,
      unitPriceCents: 8500, // $85.00
      costPriceCents: 3200,  // $32.00
      reorderLevel: 25,
      requiresPrescription: true,
      batches: [
        { lotNumber: 'MPH-2026A', expiryDate: plusMonths(5), qty: 150, cost: 3200, sell: 8500, isQuarantined: false }
      ]
    },
    {
      ndc: '00093-0058-01',
      brandName: 'Ambien 5mg',
      genericName: 'Zolpidem Tartrate',
      dosageForm: 'Tablet',
      strength: '5mg',
      packageSize: 100,
      deaSchedule: 'SCHEDULE_IV' as const,
      unitPriceCents: 4500, // $45.00
      costPriceCents: 1600,  // $16.00
      reorderLevel: 20,
      requiresPrescription: true,
      batches: [
        { lotNumber: 'ZOL-2026A', expiryDate: plusMonths(7), qty: 120, cost: 1600, sell: 4500, isQuarantined: false }
      ]
    },
    {
      ndc: '00093-1048-01',
      brandName: 'Glucophage 500mg',
      genericName: 'Metformin HCl',
      dosageForm: 'Tablet',
      strength: '500mg',
      packageSize: 100,
      deaSchedule: 'NON_CONTROLLED' as const,
      unitPriceCents: 1400, // $14.00
      costPriceCents: 400,   // $4.00
      reorderLevel: 50,
      requiresPrescription: true,
      batches: [
        { lotNumber: 'MET-2026A', expiryDate: plusMonths(14), qty: 400, cost: 400, sell: 1400, isQuarantined: false }
      ]
    }
  ];

  for (const item of medicationsData) {
    const med = await prisma.medication.upsert({
      where: { ndc: item.ndc },
      update: {},
      create: {
        ndc: item.ndc,
        brandName: item.brandName,
        genericName: item.genericName,
        dosageForm: item.dosageForm,
        strength: item.strength,
        packageSize: item.packageSize,
        deaSchedule: item.deaSchedule,
        unitPriceCents: item.unitPriceCents,
        costPriceCents: item.costPriceCents,
        reorderLevel: item.reorderLevel,
        requiresPrescription: item.requiresPrescription
      }
    });

    for (const b of item.batches) {
      const existingBatch = await prisma.medicationBatch.findFirst({
        where: { medicationId: med.id, lotNumber: b.lotNumber }
      });

      if (!existingBatch) {
        const createdBatch = await prisma.medicationBatch.create({
          data: {
            medicationId: med.id,
            lotNumber: b.lotNumber,
            expiryDate: b.expiryDate,
            initialQty: b.qty,
            currentQty: b.qty,
            costPriceCents: b.cost,
            sellingPriceCents: b.sell,
            isQuarantined: b.isQuarantined
          }
        });

        await prisma.inventoryMovement.create({
          data: {
            batchId: createdBatch.id,
            medicationId: med.id,
            movementType: b.isQuarantined ? 'QUARANTINE' : 'RECEIPT',
            quantityChange: b.qty,
            previousQuantity: 0,
            newQuantity: b.qty,
            referenceType: 'PO_RECEIPT',
            referenceId: `SEED_PO_${b.lotNumber}`,
            actorId: pharmacist.id,
            notes: `Initial seed inventory receipt for lot ${b.lotNumber}`
          }
        });
      }
    }
  }

  console.log(`✓ Seeded ${medicationsData.length} medications and associated manufacturing batches.`);
  console.log('✅ Carewell Pharmacy Management System database seeding completed successfully.');
}

if (require.main === module) {
  seedPharmacyDatabase()
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
