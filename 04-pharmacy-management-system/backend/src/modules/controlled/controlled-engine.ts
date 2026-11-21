import crypto from 'crypto';

export interface ControlledSubstanceValidationInput {
  deaSchedule: string;
  prescriberDea: string;
  prescriberNpi: string;
  patientPhotoIdType: string;
  patientPhotoIdNumber: string;
  pharmacistLicenseNumber: string;
  pharmacistRole: string;
}

/**
 * Validates DEA Number according to federal checksum algorithm:
 * Standard format: 2 uppercase letters + 7 digits.
 * Checksum: (Digit 1 + Digit 3 + Digit 5) + 2 * (Digit 2 + Digit 4 + Digit 6).
 * The last digit of the checksum must equal Digit 7.
 */
export function validateDeaNumber(deaNumber: string): { isValid: boolean; reason?: string } {
  if (!deaNumber) return { isValid: false, reason: 'DEA number is required.' };
  const cleaned = deaNumber.trim().toUpperCase();

  const regex = /^[A-Z]{2}[0-9]{7}$/;
  if (!regex.test(cleaned)) {
    return { isValid: false, reason: 'DEA number must have 2 uppercase letters followed by 7 digits.' };
  }

  const digits = cleaned.slice(2).split('').map(Number);
  const part1 = digits[0] + digits[2] + digits[4];
  const part2 = (digits[1] + digits[3] + digits[5]) * 2;
  const sum = part1 + part2;
  const checkDigit = sum % 10;

  if (checkDigit !== digits[6]) {
    return {
      isValid: false,
      reason: `DEA checksum failed: expected check digit ${digits[6]}, computed ${checkDigit}.`
    };
  }

  return { isValid: true };
}

/**
 * Validates NPI (National Provider Identifier)
 * 10 numeric digits.
 */
export function validateNpi(npi: string): { isValid: boolean; reason?: string } {
  if (!npi) return { isValid: false, reason: 'NPI is required.' };
  const cleaned = npi.trim();
  if (!/^[0-9]{10}$/.test(cleaned)) {
    return { isValid: false, reason: 'NPI must be exactly 10 numeric digits.' };
  }
  return { isValid: true };
}

/**
 * Hashes sensitive patient identification numbers before persisting to audit records.
 */
export function hashPatientId(idNumber: string): string {
  return crypto.createHash('sha256').update(idNumber.trim()).digest('hex');
}

/**
 * Full regulatory validation gate for dispensing Controlled Substances (Schedule II-V)
 */
export function validateControlledSubstanceDispense(
  input: ControlledSubstanceValidationInput
): { isAuthorized: boolean; error?: string } {
  // If non-controlled, bypass strict DEA checks
  if (input.deaSchedule === 'NON_CONTROLLED') {
    return { isAuthorized: true };
  }

  // 1. Role verification: Only licensed pharmacists can authorize controlled substance release
  if (input.pharmacistRole !== 'PHARMACIST') {
    return {
      isAuthorized: false,
      error: 'UNAUTHORIZED_ROLE: Only a licensed registered PHARMACIST may dispense controlled substances.'
    };
  }

  if (!input.pharmacistLicenseNumber || input.pharmacistLicenseNumber.trim().length === 0) {
    return {
      isAuthorized: false,
      error: 'MISSING_CREDENTIAL: Dispensing pharmacist must provide valid state license credential.'
    };
  }

  // 2. Prescriber DEA check
  const deaCheck = validateDeaNumber(input.prescriberDea);
  if (!deaCheck.isValid) {
    return { isAuthorized: false, error: `PRESCRIBER_DEA_INVALID: ${deaCheck.reason}` };
  }

  // 3. Prescriber NPI check
  const npiCheck = validateNpi(input.prescriberNpi);
  if (!npiCheck.isValid) {
    return { isAuthorized: false, error: `PRESCRIBER_NPI_INVALID: ${npiCheck.reason}` };
  }

  // 4. Patient Photo ID validation
  const validIdTypes = ['DRIVERS_LICENSE', 'PASSPORT', 'STATE_ID', 'MILITARY_ID'];
  if (!validIdTypes.includes(input.patientPhotoIdType.toUpperCase())) {
    return {
      isAuthorized: false,
      error: `PATIENT_ID_INVALID: Photo ID type must be one of: ${validIdTypes.join(', ')}`
    };
  }

  if (!input.patientPhotoIdNumber || input.patientPhotoIdNumber.trim().length < 4) {
    return {
      isAuthorized: false,
      error: 'PATIENT_ID_INVALID: Valid photo ID number is mandatory for controlled substances.'
    };
  }

  return { isAuthorized: true };
}
