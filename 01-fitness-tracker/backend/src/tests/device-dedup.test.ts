import {
  encryptToken,
  decryptToken,
  FixtureDeviceAdapter,
  IngestedActivityRecord
} from "../modules/integrations/device.adapter";

describe("Device Integration, Deduplication & Cryptography", () => {
  const SECRET_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  test("encrypts and decrypts OAuth device tokens using AES-256-GCM without data loss", () => {
    const rawToken = "oauth2_refresh_token_carewell_secret_12345";
    const encryptedPayload = encryptToken(rawToken, SECRET_KEY);

    expect(encryptedPayload.encryptedToken).toBeDefined();
    expect(encryptedPayload.iv).toHaveLength(32); // 16 bytes in hex
    expect(encryptedPayload.authTag).toBeDefined();

    const decrypted = decryptToken(encryptedPayload, SECRET_KEY);
    expect(decrypted).toBe(rawToken);
  });

  test("deduplicates incoming wearable telemetry by externalRecordId", () => {
    const adapter = new FixtureDeviceAdapter();
    const existingIds = new Set<string>(["sync_rec_001", "sync_rec_002"]);

    const incomingBatch: IngestedActivityRecord[] = [
      {
        externalRecordId: "sync_rec_002", // duplicate
        date: "2026-11-19",
        steps: 8000,
        distanceMeters: 6000,
        durationSeconds: 4000,
        source: "DEVICE",
        nature: "MEASURED"
      },
      {
        externalRecordId: "sync_rec_003", // new
        date: "2026-11-20",
        steps: 10500,
        distanceMeters: 7900,
        durationSeconds: 5200,
        source: "DEVICE",
        nature: "MEASURED"
      },
      {
        externalRecordId: "sync_rec_004", // new
        date: "2026-11-21",
        steps: 9200,
        distanceMeters: 6800,
        durationSeconds: 4600,
        source: "DEVICE",
        nature: "MEASURED"
      }
    ];

    const syncResult = adapter.deduplicateAndIngest(incomingBatch, existingIds);

    expect(syncResult.totalReceived).toBe(3);
    expect(syncResult.duplicatesSkipped).toBe(1);
    expect(syncResult.newImported).toBe(2);
    expect(syncResult.importedRecords.map(r => r.externalRecordId)).toEqual([
      "sync_rec_003",
      "sync_rec_004"
    ]);
  });
});
