import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedRequest } from "../auth/auth.middleware";
import { FixtureDeviceAdapter, encryptToken, decryptToken, IngestedActivityRecord } from "./device.adapter";
import { AuditService } from "../audit/audit.service";

const prisma = new PrismaClient();
const router = Router();
const auditService = new AuditService();
const adapter = new FixtureDeviceAdapter();

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// POST /integrations/sync (Sync wearable devices with deduplication)
router.post("/sync", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { simulatedTelemetry } = req.body;

    // Check integration connection
    const integration = await prisma.deviceIntegration.findUnique({
      where: { userId_provider: { userId, provider: adapter.getProviderName() } }
    });

    if (integration && integration.status === "REVOKED") {
      return res.status(403).json({ error: "Device integration token has been revoked by user." });
    }

    // Default simulated batch if not passed
    const incomingRecords: IngestedActivityRecord[] = simulatedTelemetry || [
      {
        externalRecordId: `dev_${userId}_20261120`,
        date: "2026-11-20",
        steps: 10450,
        distanceMeters: 7800.0,
        durationSeconds: 5400,
        source: "DEVICE",
        nature: "MEASURED"
      },
      {
        externalRecordId: `dev_${userId}_20261121`,
        date: "2026-11-21",
        steps: 8200,
        distanceMeters: 6100.0,
        durationSeconds: 4200,
        source: "DEVICE",
        nature: "MEASURED"
      }
    ];

    // Get existing external IDs
    const existing = await prisma.activityRecord.findMany({
      where: { userId, externalId: { not: null } },
      select: { externalId: true }
    });
    const existingIds = new Set(existing.map(e => e.externalId!).filter(Boolean));

    const syncResult = adapter.deduplicateAndIngest(incomingRecords, existingIds);

    // Save newly imported records
    for (const record of syncResult.importedRecords) {
      await prisma.activityRecord.upsert({
        where: { userId_date_source: { userId, date: record.date, source: "DEVICE" } },
        update: {
          steps: record.steps,
          distanceMeters: record.distanceMeters,
          durationSeconds: record.durationSeconds,
          externalId: record.externalRecordId,
          nature: "MEASURED"
        },
        create: {
          userId,
          date: record.date,
          steps: record.steps,
          distanceMeters: record.distanceMeters,
          durationSeconds: record.durationSeconds,
          estimatedCalories: Math.round(3.5 * 70 * (record.durationSeconds / 3600)),
          source: "DEVICE",
          nature: "MEASURED",
          externalId: record.externalRecordId
        }
      });
    }

    // Update integration lastSyncAt
    if (!integration) {
      const encrypted = encryptToken("mock_oauth_device_token_xyz_2026", ENCRYPTION_KEY);
      await prisma.deviceIntegration.create({
        data: {
          userId,
          provider: adapter.getProviderName(),
          encryptedToken: encrypted.encryptedToken,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          status: "ACTIVE",
          lastSyncAt: new Date()
        }
      });
    } else {
      await prisma.deviceIntegration.update({
        where: { id: integration.id },
        data: { lastSyncAt: new Date() }
      });
    }

    return res.json({
      provider: adapter.getProviderName(),
      syncResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /integrations/revoke (Revoke integration tokens)
router.post("/revoke", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const integration = await prisma.deviceIntegration.findUnique({
      where: { userId_provider: { userId, provider: adapter.getProviderName() } }
    });

    if (!integration) {
      return res.status(404).json({ error: "No active integration found for provider." });
    }

    await prisma.deviceIntegration.update({
      where: { id: integration.id },
      data: { status: "REVOKED" }
    });

    const auditEntry = auditService.createAuditRecord({
      userId,
      action: "TOKEN_REVOCATION",
      resource: "DeviceIntegration",
      details: { provider: adapter.getProviderName() }
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: auditEntry.action,
        resource: auditEntry.resource,
        details: auditEntry.details,
        previousHash: auditEntry.previousHash,
        hash: auditEntry.hash
      }
    });

    return res.json({ success: true, message: "Device integration revoked successfully." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
