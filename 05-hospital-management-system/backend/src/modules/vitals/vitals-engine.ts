export interface VitalSignsInput {
  heartRateBpm: number;
  systolicBp: number;
  diastolicBp: number;
  respiratoryRateBpm: number;
  temperatureCelsius: number;
  spo2Percent: number;
}

export interface VitalSignsValidationResult {
  isPlausible: boolean;
  errors: string[];
  alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL';
  isAbnormal: boolean;
}

export function validateVitalSigns(vitals: VitalSignsInput): VitalSignsValidationResult {
  const errors: string[] = [];

  // 1. Plausibility Range Checks
  if (vitals.heartRateBpm < 20 || vitals.heartRateBpm > 300) {
    errors.push(`Heart Rate ${vitals.heartRateBpm} bpm is physiologically implausible (Expected: 20 - 300 bpm).`);
  }

  if (vitals.systolicBp < 40 || vitals.systolicBp > 300) {
    errors.push(`Systolic BP ${vitals.systolicBp} mmHg is physiologically implausible (Expected: 40 - 300 mmHg).`);
  }

  if (vitals.diastolicBp < 20 || vitals.diastolicBp > 200) {
    errors.push(`Diastolic BP ${vitals.diastolicBp} mmHg is physiologically implausible (Expected: 20 - 200 mmHg).`);
  }

  if (vitals.systolicBp <= vitals.diastolicBp) {
    errors.push(`Systolic BP (${vitals.systolicBp}) must be strictly greater than Diastolic BP (${vitals.diastolicBp}).`);
  }

  if (vitals.respiratoryRateBpm < 4 || vitals.respiratoryRateBpm > 80) {
    errors.push(`Respiratory Rate ${vitals.respiratoryRateBpm} bpm is physiologically implausible (Expected: 4 - 80 bpm).`);
  }

  if (vitals.temperatureCelsius < 30.0 || vitals.temperatureCelsius > 45.0) {
    errors.push(`Temperature ${vitals.temperatureCelsius} °C is physiologically implausible (Expected: 30.0 - 45.0 °C).`);
  }

  if (vitals.spo2Percent < 50 || vitals.spo2Percent > 100) {
    errors.push(`Oxygen Saturation ${vitals.spo2Percent}% is physiologically implausible (Expected: 50 - 100%).`);
  }

  if (errors.length > 0) {
    return {
      isPlausible: false,
      errors,
      alertLevel: 'NORMAL',
      isAbnormal: true
    };
  }

  // 2. Clinical Alert Triage Level Classification
  let alertLevel: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';

  // Critical indicators
  if (
    vitals.heartRateBpm < 40 ||
    vitals.heartRateBpm > 140 ||
    vitals.systolicBp < 80 ||
    vitals.systolicBp > 190 ||
    vitals.spo2Percent < 90 ||
    vitals.temperatureCelsius >= 39.5 ||
    vitals.temperatureCelsius <= 35.0 ||
    vitals.respiratoryRateBpm < 8 ||
    vitals.respiratoryRateBpm > 30
  ) {
    alertLevel = 'CRITICAL';
  } else if (
    vitals.heartRateBpm < 55 ||
    vitals.heartRateBpm > 100 ||
    vitals.systolicBp > 140 ||
    vitals.diastolicBp > 90 ||
    vitals.spo2Percent < 95 ||
    vitals.temperatureCelsius >= 38.0
  ) {
    alertLevel = 'WARNING';
  }

  return {
    isPlausible: true,
    errors: [],
    alertLevel,
    isAbnormal: alertLevel !== 'NORMAL'
  };
}
