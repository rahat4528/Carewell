import * as crypto from "crypto";

/**
 * Carewell Doctor Appointment System - Clinical Notes Cryptography
 * 
 * AES-256-GCM authenticated encryption for consultation notes.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

export interface EncryptedNotePayload {
  encryptedContent: string;
  iv: string;
  authTag: string;
}

export function encryptClinicalNote(plainText: string, secretKeyHex: string): EncryptedNotePayload {
  const key = Buffer.from(secretKeyHex, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedContent: encrypted,
    iv: iv.toString("hex"),
    authTag
  };
}

export function decryptClinicalNote(payload: EncryptedNotePayload, secretKeyHex: string): string {
  const key = Buffer.from(secretKeyHex, "hex");
  const iv = Buffer.from(payload.iv, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));
  let decrypted = decipher.update(payload.encryptedContent, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
