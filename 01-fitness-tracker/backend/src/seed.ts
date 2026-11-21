import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const INITIAL_EXERCISES = [
  {
    name: "Barbell Bench Press",
    category: "STRENGTH",
    primaryMuscle: "CHEST",
    equipment: "BARBELL",
    instructions: "Lie flat on the bench with feet firmly planted. Grip bar slightly wider than shoulder width. Lower bar to mid-chest with elbows at approximately 45 degrees, then press upward to lockout."
  },
  {
    name: "Incline Dumbbell Press",
    category: "STRENGTH",
    primaryMuscle: "CHEST",
    equipment: "DUMBBELL",
    instructions: "Set bench at a 30-degree incline. Press dumbbells vertically over upper chest with controlled descent."
  },
  {
    name: "Cable Chest Fly",
    category: "STRENGTH",
    primaryMuscle: "CHEST",
    equipment: "CABLE",
    instructions: "Position pulleys at chest height. Bring handles together in a hugging motion, maintaining a slight bend in elbows."
  },
  {
    name: "Barbell Back Squat",
    category: "STRENGTH",
    primaryMuscle: "LEGS_QUADRICEPS",
    equipment: "BARBELL",
    instructions: "Rest bar securely on upper trapezius. Descend by bending hips and knees simultaneously until thighs are parallel to the floor. Drive upward through mid-foot."
  },
  {
    name: "Romanian Deadlift",
    category: "STRENGTH",
    primaryMuscle: "LEGS_HAMSTRINGS",
    equipment: "BARBELL",
    instructions: "Hinge at the hips with soft knees, lowering the bar along shins while maintaining neutral spine tension. Return by contracting glutes and hamstrings."
  },
  {
    name: "Leg Press",
    category: "STRENGTH",
    primaryMuscle: "LEGS_QUADRICEPS",
    equipment: "MACHINE",
    instructions: "Place feet shoulder-width on platform. Release safety handles and lower carriage until knees reach 90 degrees, then extend legs without locking knees."
  },
  {
    name: "Conventional Deadlift",
    category: "STRENGTH",
    primaryMuscle: "BACK",
    equipment: "BARBELL",
    instructions: "Stand with mid-foot under barbell. Hinge down to grip bar, brace core, set lats, and pull bar smoothly upward keeping bar close to body throughout ascent."
  },
  {
    name: "Barbell Bent-Over Row",
    category: "STRENGTH",
    primaryMuscle: "BACK",
    equipment: "BARBELL",
    instructions: "Hinge torso forward to roughly 45 degrees. Pull barbell toward lower ribs, squeezing shoulder blades together at the top."
  },
  {
    name: "Lat Pulldown",
    category: "STRENGTH",
    primaryMuscle: "BACK",
    equipment: "CABLE",
    instructions: "Grip wide bar, sit upright with thighs secured under pads. Pull bar downward to upper chest, initiating movement with latissimus dorsi."
  },
  {
    name: "Bodyweight Pull-Up",
    category: "CALISTHENICS",
    primaryMuscle: "BACK",
    equipment: "BODYWEIGHT",
    instructions: "Hang from pull-up bar with overhand grip. Pull chest toward bar until chin clears bar height, then lower with control."
  },
  {
    name: "Overhead Military Press",
    category: "STRENGTH",
    primaryMuscle: "SHOULDERS",
    equipment: "BARBELL",
    instructions: "Press bar overhead from collarbone level while bracing core and glutes. Lock out overhead with head moving through arms."
  },
  {
    name: "Dumbbell Lateral Raise",
    category: "STRENGTH",
    primaryMuscle: "SHOULDERS",
    equipment: "DUMBBELL",
    instructions: "Raise dumbbells laterally until arms are parallel to the floor, leading with elbows and keeping shoulders depressed."
  },
  {
    name: "Barbell Bicep Curl",
    category: "STRENGTH",
    primaryMuscle: "BICEPS",
    equipment: "BARBELL",
    instructions: "Stand tall with underhand grip. Curl bar upward while keeping elbows pinned to ribs, contracting biceps firmly at peak."
  },
  {
    name: "Triceps Cable Pushdown",
    category: "STRENGTH",
    primaryMuscle: "TRICEPS",
    equipment: "CABLE",
    instructions: "Attach rope or straight bar. Extend elbows downward fully, flexing triceps at bottom position with minimal shoulder movement."
  },
  {
    name: "Parallel Bar Dips",
    category: "CALISTHENICS",
    primaryMuscle: "TRICEPS",
    equipment: "BODYWEIGHT",
    instructions: "Support bodyweight on parallel bars. Lower torso until elbows reach 90 degrees, then push back up to straight arms."
  },
  {
    name: "Hanging Leg Raise",
    category: "CALISTHENICS",
    primaryMuscle: "CORE",
    equipment: "BODYWEIGHT",
    instructions: "Hang from bar and raise legs smoothly to 90 degrees without swinging or using momentum."
  },
  {
    name: "Standard Plank",
    category: "FLEXIBILITY",
    primaryMuscle: "CORE",
    equipment: "BODYWEIGHT",
    instructions: "Hold rigid horizontal body position supported on forearms and toes, engaging abdominals, glutes, and quadriceps."
  },
  {
    name: "Treadmill Running",
    category: "CARDIO",
    primaryMuscle: "FULL_BODY",
    equipment: "MACHINE",
    instructions: "Maintain consistent cadence, upright posture, and mid-foot strike at desired incline and speed."
  },
  {
    name: "Stationary Cycling",
    category: "CARDIO",
    primaryMuscle: "LEGS_QUADRICEPS",
    equipment: "MACHINE",
    instructions: "Adjust saddle height so knee has slight flexion at pedal bottom. Maintain steady cadence between 80-95 RPM."
  }
];

export async function seedDatabase() {
  console.log("🌱 Seeding Carewell Fitness Tracker database...");

  // 1. Seed Exercises Catalog
  for (const ex of INITIAL_EXERCISES) {
    const existing = await prisma.exercise.findFirst({
      where: { name: ex.name, isCustom: false }
    });
    if (!existing) {
      await prisma.exercise.create({
        data: {
          name: ex.name,
          category: ex.category,
          primaryMuscle: ex.primaryMuscle,
          equipment: ex.equipment,
          instructions: ex.instructions,
          isCustom: false
        }
      });
    }
  }
  console.log(`✓ Seeded ${INITIAL_EXERCISES.length} catalog exercises.`);

  // 2. Seed Demo User
  const demoEmail = "demo@carewell.local";
  let demoUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!demoUser) {
    const passwordHash = await bcrypt.hash("CarewellDemo2026!", 10);
    demoUser = await prisma.user.create({
      data: {
        email: demoEmail,
        passwordHash,
        name: "Alex Morgan",
        role: "USER",
        profile: {
          create: {
            unitSystem: "METRIC",
            heightCm: 178.0,
            weightKg: 76.5,
            biologicalSex: "MALE",
            birthDate: new Date("1995-04-12")
          }
        }
      }
    });
    console.log(`✓ Created demo user: ${demoEmail}`);
  }

  // 3. Seed Workout Plan
  const existingPlan = await prisma.workoutPlan.findFirst({
    where: { userId: demoUser.id, name: "Push Day Strength" }
  });

  let plan = existingPlan;
  if (!plan) {
    plan = await prisma.workoutPlan.create({
      data: {
        userId: demoUser.id,
        name: "Push Day Strength",
        description: "Upper body pushing routine focusing on chest, anterior delts, and triceps hypertrophy."
      }
    });
  }

  // 4. Seed a Completed Workout Session
  const benchExercise = await prisma.exercise.findFirst({ where: { name: "Barbell Bench Press" } });
  const militaryPress = await prisma.exercise.findFirst({ where: { name: "Overhead Military Press" } });

  if (benchExercise && militaryPress) {
    const existingSession = await prisma.workoutSession.findFirst({
      where: { userId: demoUser.id, name: "Monday Push Session" }
    });

    if (!existingSession) {
      const session = await prisma.workoutSession.create({
        data: {
          userId: demoUser.id,
          planId: plan.id,
          name: "Monday Push Session",
          status: "COMPLETED",
          startedAt: new Date(Date.now() - 3600000 * 2),
          completedAt: new Date(Date.now() - 3600000 * 1),
          durationSeconds: 3600,
          totalVolumeKg: 4250.0,
          notes: "Felt strong on bench press; smooth lockout on final set.",
          exercises: {
            create: [
              {
                exerciseId: benchExercise.id,
                orderIndex: 0,
                sets: {
                  create: [
                    { setNumber: 1, setType: "WARMUP", weightKg: 60.0, reps: 10, completed: true },
                    { setNumber: 2, setType: "NORMAL", weightKg: 85.0, reps: 8, completed: true },
                    { setNumber: 3, setType: "NORMAL", weightKg: 95.0, reps: 5, completed: true },
                    { setNumber: 4, setType: "NORMAL", weightKg: 100.0, reps: 3, completed: true }
                  ]
                }
              },
              {
                exerciseId: militaryPress.id,
                orderIndex: 1,
                sets: {
                  create: [
                    { setNumber: 1, setType: "NORMAL", weightKg: 50.0, reps: 8, completed: true },
                    { setNumber: 2, setType: "NORMAL", weightKg: 55.0, reps: 6, completed: true },
                    { setNumber: 3, setType: "NORMAL", weightKg: 55.0, reps: 5, completed: true }
                  ]
                }
              }
            ]
          }
        }
      });

      // 5. Seed Personal Records for Bench Press
      await prisma.personalRecord.upsert({
        where: {
          userId_exerciseId_recordType: {
            userId: demoUser.id,
            exerciseId: benchExercise.id,
            recordType: "HEAVIEST_WEIGHT"
          }
        },
        update: { value: 100.0, estimated1Rm: 100.0 * (1 + 3 / 30.0) },
        create: {
          userId: demoUser.id,
          exerciseId: benchExercise.id,
          recordType: "HEAVIEST_WEIGHT",
          value: 100.0,
          estimated1Rm: 110.0
        }
      });
      console.log(`✓ Seeded completed workout session and personal records.`);
    }
  }

  // 6. Seed Body Measurements
  const existingMeasurement = await prisma.bodyMeasurement.findFirst({
    where: { userId: demoUser.id }
  });
  if (!existingMeasurement) {
    await prisma.bodyMeasurement.createMany({
      data: [
        { userId: demoUser.id, date: "2026-11-01", metricType: "WEIGHT_KG", value: 78.0, source: "MANUAL", nature: "MEASURED" },
        { userId: demoUser.id, date: "2026-11-08", metricType: "WEIGHT_KG", value: 77.4, source: "MANUAL", nature: "MEASURED" },
        { userId: demoUser.id, date: "2026-11-15", metricType: "WEIGHT_KG", value: 76.8, source: "MANUAL", nature: "MEASURED" },
        { userId: demoUser.id, date: "2026-11-20", metricType: "WEIGHT_KG", value: 76.5, source: "MANUAL", nature: "MEASURED" },
        { userId: demoUser.id, date: "2026-11-20", metricType: "WAIST_CM", value: 82.5, source: "MANUAL", nature: "MEASURED" },
        { userId: demoUser.id, date: "2026-11-20", metricType: "CHEST_CM", value: 104.0, source: "MANUAL", nature: "MEASURED" }
      ]
    });
    console.log(`✓ Seeded historical body measurements.`);
  }

  // 7. Seed Daily Activity Records
  const existingActivity = await prisma.activityRecord.findFirst({
    where: { userId: demoUser.id }
  });
  if (!existingActivity) {
    await prisma.activityRecord.createMany({
      data: [
        {
          userId: demoUser.id,
          date: "2026-11-18",
          steps: 8450,
          distanceMeters: 6200.0,
          durationSeconds: 4200,
          estimatedCalories: 380.0,
          source: "DEVICE",
          nature: "MEASURED"
        },
        {
          userId: demoUser.id,
          date: "2026-11-19",
          steps: 10240,
          distanceMeters: 7500.0,
          durationSeconds: 5100,
          estimatedCalories: 460.0,
          source: "DEVICE",
          nature: "MEASURED"
        },
        {
          userId: demoUser.id,
          date: "2026-11-20",
          steps: 9100,
          distanceMeters: 6700.0,
          durationSeconds: 4500,
          estimatedCalories: 410.0,
          source: "MANUAL",
          nature: "ESTIMATED"
        }
      ]
    });
    console.log(`✓ Seeded daily activity records.`);
  }

  // 8. Seed Fitness Goals
  const existingGoal = await prisma.fitnessGoal.findFirst({
    where: { userId: demoUser.id }
  });
  if (!existingGoal) {
    await prisma.fitnessGoal.create({
      data: {
        userId: demoUser.id,
        metricType: "WEIGHT",
        startValue: 78.0,
        targetValue: 74.0,
        startDate: new Date("2026-11-01"),
        targetDate: new Date("2027-02-01"),
        status: "IN_PROGRESS"
      }
    });
    console.log(`✓ Seeded fitness goal.`);
  }

  console.log("✅ Carewell Fitness Tracker database seeding completed successfully.");
}

if (require.main === module) {
  seedDatabase()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
