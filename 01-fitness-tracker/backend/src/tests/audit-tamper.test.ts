import { AuditService, computeAuditHash } from "../modules/audit/audit.service";

describe("Tamper-Evident Audit Service", () => {
  test("generates SHA-256 hash-chained audit records", () => {
    const auditService = new AuditService();

    const record1 = auditService.createAuditRecord({
      userId: "user_1",
      action: "LOGIN",
      resource: "Session"
    });

    const record2 = auditService.createAuditRecord({
      userId: "user_1",
      action: "DATA_EXPORT",
      resource: "AllPersonalData",
      previousHash: record1.hash
    });

    expect(record1.hash).toBeDefined();
    expect(record2.previousHash).toBe(record1.hash);
    expect(record2.hash).not.toBe(record1.hash);
  });

  test("verifies valid unbroken audit chain", () => {
    const auditService = new AuditService();
    const r1 = auditService.createAuditRecord({ userId: "u1", action: "A1", resource: "R1" });
    const r2 = auditService.createAuditRecord({ userId: "u1", action: "A2", resource: "R2", previousHash: r1.hash });
    const r3 = auditService.createAuditRecord({ userId: "u1", action: "A3", resource: "R3", previousHash: r2.hash });

    const isValid = auditService.verifyChain([r1, r2, r3]);
    expect(isValid).toBe(true);
  });

  test("detects tampered audit record in chain", () => {
    const auditService = new AuditService();
    const r1 = auditService.createAuditRecord({ userId: "u1", action: "A1", resource: "R1" });
    const r2 = auditService.createAuditRecord({ userId: "u1", action: "A2", resource: "R2", previousHash: r1.hash });

    // Tamper with r2 action
    const tamperedR2 = { ...r2, action: "ILLEGAL_MUTATION" };

    const isValid = auditService.verifyChain([r1, tamperedR2]);
    expect(isValid).toBe(false);
  });
});
