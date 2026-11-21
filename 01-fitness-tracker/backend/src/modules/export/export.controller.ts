import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedRequest } from "../auth/auth.middleware";
import { AuditService } from "../audit/audit.service";

const prisma = new PrismaClient();
const router = Router();
const auditService = new AuditService();

// GET /export/data (Complete personal data export for data sovereignty)
router.get("/data", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [
      user,
      workoutPlans,
      sessions,
      personalRecords,
      measurements,
      activityRecords,
      goals,
      customExercises
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      }),
      prisma.workoutPlan.findMany({ where: { userId } }),
      prisma.workoutSession.findMany({
        where: { userId },
        include: { exercises: { include: { sets: true } } }
      }),
      prisma.personalRecord.findMany({ where: { userId }, include: { exercise: true } }),
      prisma.bodyMeasurement.findMany({ where: { userId } }),
      prisma.activityRecord.findMany({ where: { userId } }),
      prisma.fitnessGoal.findMany({ where: { userId } }),
      prisma.exercise.findMany({ where: { ownerId: userId, isCustom: true } })
    ]);

    // Create tamper-evident audit record
    const audit = auditService.createAuditRecord({
      userId,
      action: "DATA_EXPORT",
      resource: "AllPersonalData",
      details: { exportTimestamp: new Date().toISOString() }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: audit.action,
        resource: audit.resource,
        details: audit.details,
        previousHash: audit.previousHash,
        hash: audit.hash
      }
    });

    const exportPackage = {
      exportMetadata: {
        system: "Carewell Fitness Tracker",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        auditHash: audit.hash
      },
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        profile: user?.profile
      },
      workoutPlans,
      sessions,
      personalRecords,
      measurements,
      activityRecords,
      fitnessGoals: goals,
      customExercises
    };

    res.setHeader("Content-Disposition", `attachment; filename=carewell-fitness-export-${userId}.json`);
    res.setHeader("Content-Type", "application/json");
    return res.json(exportPackage);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /export/account (Right to Erasure / Account and Data Deletion)
router.delete("/account", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Log deletion before cascading purge
    const audit = auditService.createAuditRecord({
      userId,
      action: "ACCOUNT_DELETION",
      resource: "UserAccount",
      details: { email: req.user!.email }
    });

    await prisma.auditLog.create({
      data: {
        userId: null, // Scoped to system since user is being purged
        action: audit.action,
        resource: audit.resource,
        details: audit.details,
        previousHash: audit.previousHash,
        hash: audit.hash
      }
    });

    // Cascade delete user
    await prisma.user.delete({ where: { id: userId } });

    return res.json({
      success: true,
      message: "User account and all associated fitness records have been permanently erased."
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
