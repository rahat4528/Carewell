import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedRequest } from "../auth/auth.middleware";
import { calculateEstimated1Rm, calculateSessionVolume, recomputePersonalRecords } from "./workout-engine";

const prisma = new PrismaClient();
const router = Router();

// ======================== WORKOUT PLANS ========================

// GET /workouts/plans
router.get("/plans", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = await prisma.workoutPlan.findMany({
      where: { userId: req.user!.id },
      include: { sessions: { take: 5, orderBy: { createdAt: "desc" } } }
    });
    return res.json(plans);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /workouts/plans
router.post("/plans", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: "Plan name is required." });

    const plan = await prisma.workoutPlan.create({
      data: {
        userId: req.user!.id,
        name,
        description: description || null
      }
    });
    return res.status(201).json(plan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ======================== WORKOUT SESSIONS ========================

// GET /workouts/sessions
router.get("/sessions", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId: req.user!.id },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: { orderBy: { setNumber: "asc" } }
          },
          orderBy: { orderIndex: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json(sessions);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /workouts/sessions (Start/create session)
router.post("/sessions", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, planId, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Session name is required." });

    const session = await prisma.workoutSession.create({
      data: {
        userId: req.user!.id,
        planId: planId || null,
        name,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        notes: notes || null
      }
    });
    return res.status(201).json(session);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /workouts/sessions/:id/exercises
router.post("/sessions/:id/exercises", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { exerciseId, orderIndex, notes } = req.body;
    const session = await prisma.workoutSession.findFirst({
      where: { id: req.params.id, userId: req.user!.id }
    });
    if (!session) return res.status(404).json({ error: "Session not found." });

    const workoutExercise = await prisma.workoutExercise.create({
      data: {
        sessionId: session.id,
        exerciseId,
        orderIndex: orderIndex || 0,
        notes: notes || null
      },
      include: { exercise: true }
    });

    return res.status(201).json(workoutExercise);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /workouts/exercises/:id/sets
router.post("/exercises/:id/sets", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { setNumber, setType, weightKg, reps, rpe, completed } = req.body;
    
    // Verify ownership through session
    const workoutExercise = await prisma.workoutExercise.findUnique({
      where: { id: req.params.id },
      include: { session: true }
    });

    if (!workoutExercise || workoutExercise.session.userId !== req.user!.id) {
      return res.status(404).json({ error: "Workout exercise not found." });
    }

    const set = await prisma.workoutSet.create({
      data: {
        workoutExerciseId: workoutExercise.id,
        setNumber: Number(setNumber),
        setType: setType || "NORMAL",
        weightKg: Number(weightKg),
        reps: Number(reps),
        rpe: rpe ? Number(rpe) : null,
        completed: Boolean(completed)
      }
    });

    // Auto-update PRs if completed
    if (set.completed && set.weightKg > 0 && set.reps > 0) {
      const allSets = await prisma.workoutSet.findMany({
        where: {
          completed: true,
          workoutExercise: { exerciseId: workoutExercise.exerciseId, session: { userId: req.user!.id } }
        }
      });

      const prSummary = recomputePersonalRecords(allSets);
      await prisma.personalRecord.upsert({
        where: {
          userId_exerciseId_recordType: {
            userId: req.user!.id,
            exerciseId: workoutExercise.exerciseId,
            recordType: "HEAVIEST_WEIGHT"
          }
        },
        update: { value: prSummary.heaviestWeightKg, estimated1Rm: prSummary.peakEstimated1RmKg },
        create: {
          userId: req.user!.id,
          exerciseId: workoutExercise.exerciseId,
          recordType: "HEAVIEST_WEIGHT",
          value: prSummary.heaviestWeightKg,
          estimated1Rm: prSummary.peakEstimated1RmKg
        }
      });
    }

    return res.status(201).json(set);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PUT /workouts/sets/:id (Update set & recompute PRs)
router.put("/sets/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { weightKg, reps, rpe, completed, setType } = req.body;

    const existingSet = await prisma.workoutSet.findUnique({
      where: { id: req.params.id },
      include: { workoutExercise: { include: { session: true } } }
    });

    if (!existingSet || existingSet.workoutExercise.session.userId !== req.user!.id) {
      return res.status(404).json({ error: "Set not found." });
    }

    const updatedSet = await prisma.workoutSet.update({
      where: { id: req.params.id },
      data: {
        weightKg: weightKg !== undefined ? Number(weightKg) : undefined,
        reps: reps !== undefined ? Number(reps) : undefined,
        rpe: rpe !== undefined ? Number(rpe) : undefined,
        completed: completed !== undefined ? Boolean(completed) : undefined,
        setType: setType || undefined
      }
    });

    // Recompute PRs for this exercise
    const allSets = await prisma.workoutSet.findMany({
      where: {
        completed: true,
        workoutExercise: {
          exerciseId: existingSet.workoutExercise.exerciseId,
          session: { userId: req.user!.id }
        }
      }
    });

    const prSummary = recomputePersonalRecords(allSets);
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId: req.user!.id,
          exerciseId: existingSet.workoutExercise.exerciseId,
          recordType: "HEAVIEST_WEIGHT"
        }
      },
      update: { value: prSummary.heaviestWeightKg, estimated1Rm: prSummary.peakEstimated1RmKg },
      create: {
        userId: req.user!.id,
        exerciseId: existingSet.workoutExercise.exerciseId,
        recordType: "HEAVIEST_WEIGHT",
        value: prSummary.heaviestWeightKg,
        estimated1Rm: prSummary.peakEstimated1RmKg
      }
    });

    return res.json(updatedSet);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /workouts/sets/:id (Delete set & recompute PRs)
router.delete("/sets/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existingSet = await prisma.workoutSet.findUnique({
      where: { id: req.params.id },
      include: { workoutExercise: { include: { session: true } } }
    });

    if (!existingSet || existingSet.workoutExercise.session.userId !== req.user!.id) {
      return res.status(404).json({ error: "Set not found." });
    }

    const exerciseId = existingSet.workoutExercise.exerciseId;
    await prisma.workoutSet.delete({ where: { id: req.params.id } });

    // Recalculate remaining sets
    const remainingSets = await prisma.workoutSet.findMany({
      where: {
        completed: true,
        workoutExercise: { exerciseId, session: { userId: req.user!.id } }
      }
    });

    const prSummary = recomputePersonalRecords(remainingSets);
    await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_recordType: {
          userId: req.user!.id,
          exerciseId,
          recordType: "HEAVIEST_WEIGHT"
        }
      },
      update: { value: prSummary.heaviestWeightKg, estimated1Rm: prSummary.peakEstimated1RmKg },
      create: {
        userId: req.user!.id,
        exerciseId,
        recordType: "HEAVIEST_WEIGHT",
        value: prSummary.heaviestWeightKg,
        estimated1Rm: prSummary.peakEstimated1RmKg
      }
    });

    return res.json({ success: true, updatedPRs: prSummary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /workouts/sessions/:id/complete
router.post("/sessions/:id/complete", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const session = await prisma.workoutSession.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { exercises: { include: { sets: true } } }
    });

    if (!session) return res.status(404).json({ error: "Session not found." });

    const allSets = session.exercises.flatMap(e => e.sets);
    const totalVolume = calculateSessionVolume(allSets);
    const now = new Date();
    const durationSeconds = session.startedAt
      ? Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)
      : 3600;

    const completedSession = await prisma.workoutSession.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: now,
        durationSeconds,
        totalVolumeKg: totalVolume
      }
    });

    return res.json(completedSession);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
