import * as crypto from "crypto";

export interface AuditEntryInput {
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  previousHash?: string;
}

export interface AuditRecordOutput {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details?: string;
  timestamp: Date;
  previousHash: string;
  hash: string;
}

export function computeAuditHash(
  previousHash: string,
  timestamp: string,
  userId: string | undefined,
  action: string,
  resource: string,
  details: string
): string {
  const payload = `${previousHash}|${timestamp}|${userId || "ANONYMOUS"}|${action}|${resource}|${details}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export class AppointmentAuditService {
  private lastHash: string = "GENESIS_HASH_CAREWELL_APPOINTMENTS_2026";

  public createAuditRecord(input: AuditEntryInput): AuditRecordOutput {
    const timestamp = new Date();
    const detailsString = input.details ? JSON.stringify(input.details) : "";
    const prevHash = input.previousHash || this.lastHash;
    const hash = computeAuditHash(
      prevHash,
      timestamp.toISOString(),
      input.userId,
      input.action,
      input.resource,
      detailsString
    );

    this.lastHash = hash;

    return {
      id: crypto.randomUUID(),
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      details: detailsString,
      timestamp,
      previousHash: prevHash,
      hash
    };
  }

  public verifyChain(entries: AuditRecordOutput[]): boolean {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const prevHash = i === 0 ? entry.previousHash : entries[i - 1].hash;
      const expectedHash = computeAuditHash(
        prevHash,
        entry.timestamp.toISOString(),
        entry.userId,
        entry.action,
        entry.resource,
        entry.details || ""
      );

      if (entry.hash !== expectedHash) {
        return false;
      }
    }
    return true;
  }
}
