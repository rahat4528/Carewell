/**
 * Medical Record Number (MRN) Generator & Luhn Check-Digit Validator
 * Standard enterprise format: MRN-<5-8 DIGITS>-<LUHN CHECK DIGIT>
 * Example: MRN-58291-4
 */

export function computeLuhnCheckDigit(numericPayload: string): number {
  const digits = numericPayload.replace(/\D/g, '').split('').map(Number);
  let sum = 0;
  let double = true;

  // Process from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }

  return (10 - (sum % 10)) % 10;
}

export function generateLuhnMrn(baseSeed?: number): string {
  const seedNum = baseSeed !== undefined ? baseSeed : Math.floor(10000 + Math.random() * 90000);
  const payloadStr = String(seedNum).padStart(5, '0');
  const checkDigit = computeLuhnCheckDigit(payloadStr);
  return `MRN-${payloadStr}-${checkDigit}`;
}

export function verifyLuhnMrn(mrn: string): { isValid: boolean; reason?: string } {
  if (!mrn) return { isValid: false, reason: 'MRN is required.' };
  const cleaned = mrn.trim().toUpperCase();

  const match = cleaned.match(/^MRN-(\d{5,8})-(\d)$/);
  if (!match) {
    return { isValid: false, reason: 'MRN does not match standard pattern MRN-<digits>-<checkDigit>.' };
  }

  const payload = match[1];
  const givenCheckDigit = Number(match[2]);
  const expectedCheckDigit = computeLuhnCheckDigit(payload);

  if (givenCheckDigit !== expectedCheckDigit) {
    return {
      isValid: false,
      reason: `Luhn check digit mismatch: expected ${expectedCheckDigit}, received ${givenCheckDigit}.`
    };
  }

  return { isValid: true };
}
