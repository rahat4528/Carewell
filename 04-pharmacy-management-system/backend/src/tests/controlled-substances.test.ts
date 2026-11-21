import {
  validateDeaNumber,
  validateNpi,
  validateControlledSubstanceDispense,
  hashPatientId
} from '../modules/controlled/controlled-engine';

describe('Controlled Substance Regulatory Compliance & Verification Engine', () => {
  describe('DEA Checksum Validation', () => {
    // Valid DEA format: 2 letters + 7 digits
    // Example: AB1234563
    // Part1: 1 + 3 + 5 = 9
    // Part2: (2 + 4 + 6) * 2 = 12 * 2 = 24
    // Sum: 9 + 24 = 33 -> Check digit is 3!
    test('accepts valid DEA registration numbers that satisfy federal checksum', () => {
      const validDea = 'AB1234563';
      const check = validateDeaNumber(validDea);
      expect(check.isValid).toBe(true);
    });

    test('rejects DEA numbers with invalid checksum', () => {
      const invalidDea = 'AB1234569'; // Expects 3, given 9
      const check = validateDeaNumber(invalidDea);
      expect(check.isValid).toBe(false);
      expect(check.reason).toContain('DEA checksum failed');
    });

    test('rejects malformed DEA formats', () => {
      expect(validateDeaNumber('123456789').isValid).toBe(false);
      expect(validateDeaNumber('ABC123456').isValid).toBe(false);
      expect(validateDeaNumber('').isValid).toBe(false);
    });
  });

  describe('NPI Format Validation', () => {
    test('accepts valid 10-digit NPIs', () => {
      expect(validateNpi('1234567890').isValid).toBe(true);
    });

    test('rejects NPIs of invalid length or non-numeric characters', () => {
      expect(validateNpi('12345').isValid).toBe(false);
      expect(validateNpi('12345678901').isValid).toBe(false);
      expect(validateNpi('12345ABCDE').isValid).toBe(false);
    });
  });

  describe('Controlled Substance Dispensing Authorization Gate', () => {
    test('authorizes Schedule II dispensing when all statutory criteria are satisfied', () => {
      const input = {
        deaSchedule: 'SCHEDULE_II',
        prescriberDea: 'AB1234563',
        prescriberNpi: '1098765432',
        patientPhotoIdType: 'DRIVERS_LICENSE',
        patientPhotoIdNumber: 'D12345678',
        pharmacistLicenseNumber: 'RPH-99201',
        pharmacistRole: 'PHARMACIST'
      };

      const result = validateControlledSubstanceDispense(input);
      expect(result.isAuthorized).toBe(true);
    });

    test('strictly denies controlled substance release if actor is a pharmacy technician', () => {
      const input = {
        deaSchedule: 'SCHEDULE_II',
        prescriberDea: 'AB1234563',
        prescriberNpi: '1098765432',
        patientPhotoIdType: 'DRIVERS_LICENSE',
        patientPhotoIdNumber: 'D12345678',
        pharmacistLicenseNumber: '',
        pharmacistRole: 'PHARMACY_TECH' // Non-pharmacist
      };

      const result = validateControlledSubstanceDispense(input);
      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain('UNAUTHORIZED_ROLE');
    });

    test('rejects dispensing when patient photo ID is missing', () => {
      const input = {
        deaSchedule: 'SCHEDULE_IV',
        prescriberDea: 'AB1234563',
        prescriberNpi: '1098765432',
        patientPhotoIdType: 'INVALID_TYPE',
        patientPhotoIdNumber: '',
        pharmacistLicenseNumber: 'RPH-99201',
        pharmacistRole: 'PHARMACIST'
      };

      const result = validateControlledSubstanceDispense(input);
      expect(result.isAuthorized).toBe(false);
      expect(result.error).toContain('PATIENT_ID_INVALID');
    });

    test('bypasses DEA checks for non-controlled medications', () => {
      const input = {
        deaSchedule: 'NON_CONTROLLED',
        prescriberDea: '',
        prescriberNpi: '1098765432',
        patientPhotoIdType: '',
        patientPhotoIdNumber: '',
        pharmacistLicenseNumber: 'RPH-99201',
        pharmacistRole: 'PHARMACIST'
      };

      const result = validateControlledSubstanceDispense(input);
      expect(result.isAuthorized).toBe(true);
    });
  });

  describe('Patient ID Cryptographic Hashing', () => {
    test('hashes patient ID deterministically and prevents raw PII persistence', () => {
      const rawId = 'DL-88371920';
      const hash1 = hashPatientId(rawId);
      const hash2 = hashPatientId(rawId);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).not.toContain('88371920');
    });
  });
});
