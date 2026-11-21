import * as crypto from "crypto";

/**
 * Carewell Fitness Tracker - Device Integration Adapter & Token Cryptography
 * 
 * Features:
 * - AES-256-GCM authenticated token encryption and decryption.
 * - Wearable Device Adapter interface with deduplication by externalRecordId.
 * - Test fixture adapter with idempotency guarantees.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export interface EncryptedPayload {
  encryptedToken: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts sensitive OAuth device tokens using AES-256-GCM.
 */
export function encryptToken(token: string, secretKeyHex: string): EncryptedPayload {
  const key = Buffer.from(secretKeyHex, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedToken: encrypted,
    iv: iv.toString("hex"),
    authTag
  };
}

/**
 * Decrypts sensitive OAuth device tokens using AES-256-GCM.
 */
export function decryptToken(payload: EncryptedPayload, secretKeyHex: string): string {
  const key = Buffer.from(secretKeyHex, "hex");
  const iv = Buffer.from(payload.iv, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));
  let decrypted = decipher.update(payload.encryptedToken, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export interface IngestedActivityRecord {
  externalRecordId: string;
  date: string;
  steps: number;
  distanceMeters: number;
  durationSeconds: number;
  source: "DEVICE";
  nature: "MEASURED";
}

export interface DeviceSyncResult {
  totalReceived: number;
  newImported: number;
  duplicatesSkipped: number;
  importedRecords: IngestedActivityRecord[];
}

/**
 * Fixture Wearable Device Provider
 * Simulates external sync with strict deduplication
 */
export class FixtureDeviceAdapter {
  constructor(private readonly providerName: string = "FIXTURE_FITNESS_BAND") {}

  public getProviderName(): string {
    return this.providerName;
  }

  /**
   * Processes a batch of telemetry records, deduplicating against existing IDs
   */
  public deduplicateAndIngest(
    incomingRecords: IngestedActivityRecord[],
    existingExternalIds: Set<string>
  ): DeviceSyncResult {
    const importedRecords: IngestedActivityRecord[] = [];
    let duplicatesSkipped = 0;

    for (const record of incomingRecords) {
      if (existingExternalIds.has(record.externalRecordId)) {
        duplicatesSkipped++;
      } else {
        importedRecords.push(record);
        existingExternalIds.add(record.externalRecordId);
      }
    }

    return {
      totalReceived: incomingRecords.length,
      newImported: importedRecords.length,
      duplicatesSkipped,
      importedRecords
    };
  }
}
