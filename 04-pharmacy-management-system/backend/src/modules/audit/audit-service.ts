import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

export class AuditService {
  private prisma: PrismaClient;
  private salt: string;

  constructor(prismaClient: PrismaClient, salt = 'carewell-pharmacy-audit-tamper-evident-salt-2026') {
    this.prisma = prismaClient;
    this.salt = salt;
  }

  async recordEntry(data: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    details: Record<string, any>;
  }): Promise<void> {
    const lastEntry = await this.prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const previousHash = lastEntry ? lastEntry.currentHash : 'GENESIS_HASH_CAREWELL_PHARMACY';
    const timestamp = new Date().toISOString();
    const detailsJson = JSON.stringify(data.details);

    const payload = `${previousHash}|${data.action}|${data.entityType}|${data.entityId}|${data.actorId}|${detailsJson}|${timestamp}|${this.salt}`;
    const currentHash = crypto.createHash('sha256').update(payload).digest('hex');

    await this.prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        actorId: data.actorId,
        detailsJson,
        previousHash,
        currentHash
      }
    });
  }
}
