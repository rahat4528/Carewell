import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedRequest } from "../auth/auth.middleware";
import { estimateCaloriesForActivity, calculateEstimatedCalories } from "./calorie-engine";

const prisma = new PrismaClient();
const router = Router();

// GET /activity/daily
router.get("/daily", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = { userId: req.user!.id };

    if (startDate && typeof startDate === "string") {
      where.date = { gte: startDate };
    }
    if (endDate && typeof endDate === "string") {
      where.date = { ...(where.date || {}), lte: endDate };
    }

    const records = await prisma.activityRecord.findMany({
      where,
      orderBy: { date: "desc" }
    });

    return res.json(records);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /activity/daily (Record activity entry with calculated MET calorie estimation)
router.post("/daily", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, steps, distanceMeters, durationSeconds, activityType, source } = req.body;
    if (!date) return res.status(400).json({ error: "Date (YYYY-MM-DD) is required." });

    const userProfile = await prisma.fitnessProfile.findUnique({
      where: { userId: req.user!.id }
    });
    const bodyWeightKg = userProfile?.weightKg || 70.0;
    const durationMinutes = (durationSeconds || 0) / 60;

    // Calculate estimated calories using MET formula
    const calEstimation = estimateCaloriesForActivity(
      activityType || "WALKING_MODERATE",
      bodyWeightKg,
      durationMinutes
    );

    const record = await prisma.activityRecord.upsert({
      where: {
        userId_date_source: {
          userId: req.user!.id,
          date,
          source: source === "DEVICE" ? "DEVICE" : "MANUAL"
        }
      },
      update: {
        steps: steps !== undefined ? Number(steps) : undefined,
        distanceMeters: distanceMeters !== undefined ? Number(distanceMeters) : undefined,
        durationSeconds: durationSeconds !== undefined ? Number(durationSeconds) : undefined,
        estimatedCalories: calEstimation.estimatedCalories,
        nature: "ESTIMATED"
      },
      create: {
        userId: req.user!.id,
        date,
        steps: Number(steps || 0),
        distanceMeters: Number(distanceMeters || 0),
        durationSeconds: Number(durationSeconds || 0),
        estimatedCalories: calEstimation.estimatedCalories,
        source: source === "DEVICE" ? "DEVICE" : "MANUAL",
        nature: "ESTIMATED"
      }
    });

    return res.status(201).json({
      ...record,
      calorieMetadata: {
        formula: calEstimation.formula,
        metValue: calEstimation.metValue,
        nature: "ESTIMATED",
        disclaimer: calEstimation.disclaimer
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
