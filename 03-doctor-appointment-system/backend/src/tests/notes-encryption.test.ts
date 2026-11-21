import { encryptClinicalNote, decryptClinicalNote } from "../modules/crypto/clinical-crypto";

describe("Clinical Notes AES-256-GCM Encryption Engine", () => {
  const SECRET_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  test("encrypts and decrypts sensitive clinical notes losslessly", () => {
    const confidentialNote = "Patient demonstrates mild systolic hypertension. Recommended ambulatory blood pressure monitoring for 14 days.";
    const encrypted = encryptClinicalNote(confidentialNote, SECRET_KEY);

    expect(encrypted.encryptedContent).toBeDefined();
    expect(encrypted.encryptedContent).not.toContain("hypertension");
    expect(encrypted.iv).toHaveLength(32);
    expect(encrypted.authTag).toBeDefined();

    const decrypted = decryptClinicalNote(encrypted, SECRET_KEY);
    expect(decrypted).toBe(confidentialNote);
  });

  test("fails decryption with altered authentication tag (tampering detected)", () => {
    const encrypted = encryptClinicalNote("Confidential patient data", SECRET_KEY);
    const tamperedPayload = {
      ...encrypted,
      authTag: "00112233445566778899aabbccddeeff"
    };

    expect(() => decryptClinicalNote(tamperedPayload, SECRET_KEY)).toThrow();
  });
});
