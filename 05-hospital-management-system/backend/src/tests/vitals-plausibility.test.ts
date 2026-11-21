import { validateVitalSigns } from '../modules/vitals/vitals-engine';

describe('Vital Signs Physiological Plausibility & Triage Engine', () => {
  test('accepts normal resting physiological parameters', () => {
    const normalInput = {
      heartRateBpm: 72,
      systolicBp: 120,
      diastolicBp: 80,
      respiratoryRateBpm: 16,
      temperatureCelsius: 37.0,
      spo2Percent: 98
    };

    const result = validateVitalSigns(normalInput);
    expect(result.isPlausible).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.alertLevel).toBe('NORMAL');
    expect(result.isAbnormal).toBe(false);
  });

  test('flags CRITICAL alert for severe physiological distress (tachycardia + hypoxia)', () => {
    const criticalInput = {
      heartRateBpm: 152, // Severe tachycardia
      systolicBp: 85,
      diastolicBp: 50,
      respiratoryRateBpm: 32, // Tachypnea
      temperatureCelsius: 39.8, // High fever
      spo2Percent: 88 // Severe hypoxia
    };

    const result = validateVitalSigns(criticalInput);
    expect(result.isPlausible).toBe(true);
    expect(result.alertLevel).toBe('CRITICAL');
    expect(result.isAbnormal).toBe(true);
  });

  test('flags WARNING alert for moderate physiological deviations', () => {
    const warningInput = {
      heartRateBpm: 110, // Moderate tachycardia
      systolicBp: 145, // Stage 1 hypertension
      diastolicBp: 88,
      respiratoryRateBpm: 18,
      temperatureCelsius: 38.2, // Low-grade fever
      spo2Percent: 93
    };

    const result = validateVitalSigns(warningInput);
    expect(result.isPlausible).toBe(true);
    expect(result.alertLevel).toBe('WARNING');
    expect(result.isAbnormal).toBe(true);
  });

  test('strictly rejects physiologically implausible outliers', () => {
    const impossibleInput = {
      heartRateBpm: 450, // Implausible
      systolicBp: 350,  // Implausible
      diastolicBp: 360,  // Diastolic > Systolic!
      respiratoryRateBpm: 120, // Implausible
      temperatureCelsius: 22.0, // Implausible
      spo2Percent: 115   // SpO2 > 100% is impossible
    };

    const result = validateVitalSigns(impossibleInput);
    expect(result.isPlausible).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(5);
  });
});
