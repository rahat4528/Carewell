import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedRequest } from "../auth/auth.middleware";
import { formatWeight, formatLength } from "./unit-engine";

const prisma = new PrismaClient();
const router = Router();

// GET /measurements
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { metricType } = req.query;
    const where: any = { userId: req.user!.id };
    if (metricType && typeof metricType === "string") {
      where.metricType = metricType;
    }

    const measurements = await prisma.bodyMeasurement.findMany({
      where,
      orderBy: { date: "asc" }
    });

    const userProfile = await prisma.fitnessProfile.findUnique({
      where: { userId: req.user!.id }
    });
    const unitSystem = (userProfile?.unitSystem as "METRIC" | "IMPERIAL") || "METRIC";

    // Format for user's unit preference while preserving canonical base
    const formatted = measurements.map(m => {
      if (m.metricType === "WEIGHT_KG") {
        const display = formatWeight(m.value, unitSystem);
        return { ...m, displayValue: display.value, unit: display.unit, canonicalValue: m.value };
      } else {
        const display = formatLength(m.value, unitSystem);
        return { ...m, displayValue: display.value, unit: display.unit, canonicalValue: m.value };
      }
    });

    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /measurements
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { date, metricType, value, source } = req.body;
    if (!date || !metricType || value === undefined) {
      return res.status(400).json({ error: "Date, metricType, and value are required." });
    }

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId: req.user!.id,
        date,
        metricType,
        value: Number(value),
        source: source === "DEVICE" ? "DEVICE" : "MANUAL",
        nature: "MEASURED"
      }
    });

    // If metric is weight, also update profile weight
    if (metricType === "WEIGHT_KG") {
      await prisma.fitnessProfile.update({
        where: { userId: req.user!.id },
        data: { weightKg: Number(value) }
      });
    }

    return res.status(201).json(measurement);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
