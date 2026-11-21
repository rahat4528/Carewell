import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedRequest } from "../auth/auth.middleware";

const prisma = new PrismaClient();
const router = Router();

// GET /analytics/personal-records
router.get("/personal-records", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prs = await prisma.personalRecord.findMany({
      where: { userId: req.user!.id },
      include: { exercise: true },
      orderBy: { achievedAt: "desc" }
    });
    return res.json(prs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /analytics/overload-trends
router.get("/overload-trends", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await prisma.workoutSession.findMany({
      where: { userId: req.user!.id, status: "COMPLETED" },
      include: {
        exercises: {
          include: { exercise: true, sets: { where: { completed: true } } }
        }
      },
      orderBy: { completedAt: "asc" }
    });

    const trends = sessions.map(s => {
      const muscleVolumeMap: Record<string, number> = {};
      s.exercises.forEach(we => {
        const muscle = we.exercise.primaryMuscle;
        const vol = we.sets.reduce((sum, set) => sum + (set.weightKg * set.reps), 0);
        muscleVolumeMap[muscle] = (muscleVolumeMap[muscle] || 0) + vol;
      });

      return {
        sessionId: s.id,
        sessionName: s.name,
        date: s.completedAt ? s.completedAt.toISOString().split("T")[0] : s.createdAt.toISOString().split("T")[0],
        totalVolumeKg: s.totalVolumeKg,
        durationMinutes: Math.round(s.durationSeconds / 60),
        muscleVolumes: muscleVolumeMap
      };
    });

    return res.json(trends);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /analytics/dashboard-summary
router.get("/dashboard-summary", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const [recentWorkouts, totalCompletedWorkouts, prCount, recentActivities, profile] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userId, createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.workoutSession.count({ where: { userId, status: "COMPLETED" } }),
      prisma.personalRecord.count({ where: { userId } }),
      prisma.activityRecord.findMany({
        where: { userId },
        take: 7,
        orderBy: { date: "desc" }
      }),
      prisma.fitnessProfile.findUnique({ where: { userId } })
    ]);

    const weeklyVolume = recentWorkouts
      .filter(w => w.status === "COMPLETED")
      .reduce((acc, w) => acc + w.totalVolumeKg, 0);

    return res.json({
      summary: {
        totalWorkoutsCompleted: totalCompletedWorkouts,
        workoutsThisWeek: recentWorkouts.length,
        volumeThisWeekKg: Math.round(weeklyVolume * 100) / 100,
        personalRecordsCount: prCount,
        unitSystem: profile?.unitSystem || "METRIC",
        currentWeightKg: profile?.weightKg || null
      },
      recentActivities,
      recentWorkouts
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
