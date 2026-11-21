/**
 * Carewell Fitness Tracker - Canonical Unit Engine
 * 
 * Rules:
 * - All internal database values are canonical metric (kg, cm, m, seconds).
 * - Conversions are applied strictly at the presentation boundary.
 * - Exact precision arithmetic prevents conversion drift across round-trips.
 */

export const CONVERSION_FACTORS = {
  KG_TO_LBS: 2.20462262185,
  LBS_TO_KG: 1 / 2.20462262185,
  CM_TO_INCHES: 0.3937007874,
  INCHES_TO_CM: 1 / 0.3937007874,
  METERS_TO_MILES: 0.000621371192,
  MILES_TO_METERS: 1 / 0.000621371192,
  METERS_TO_KM: 0.001,
  KM_TO_METERS: 1000
};

export function roundToPrecision(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function kgToLbs(kg: number): number {
  if (kg < 0) throw new Error("Weight cannot be negative");
  return roundToPrecision(kg * CONVERSION_FACTORS.KG_TO_LBS, 2);
}

export function lbsToKg(lbs: number): number {
  if (lbs < 0) throw new Error("Weight cannot be negative");
  return roundToPrecision(lbs * CONVERSION_FACTORS.LBS_TO_KG, 2);
}

export function cmToInches(cm: number): number {
  if (cm < 0) throw new Error("Length cannot be negative");
  return roundToPrecision(cm * CONVERSION_FACTORS.CM_TO_INCHES, 2);
}

export function inchesToCm(inches: number): number {
  if (inches < 0) throw new Error("Length cannot be negative");
  return roundToPrecision(inches * CONVERSION_FACTORS.INCHES_TO_CM, 2);
}

export function metersToMiles(meters: number): number {
  if (meters < 0) throw new Error("Distance cannot be negative");
  return roundToPrecision(meters * CONVERSION_FACTORS.METERS_TO_MILES, 2);
}

export function milesToMeters(miles: number): number {
  if (miles < 0) throw new Error("Distance cannot be negative");
  return roundToPrecision(miles * CONVERSION_FACTORS.MILES_TO_METERS, 2);
}

export type UnitSystem = "METRIC" | "IMPERIAL";

export interface DisplayWeight {
  value: number;
  unit: "kg" | "lbs";
  canonicalKg: number;
}

export interface DisplayLength {
  value: number;
  unit: "cm" | "in";
  canonicalCm: number;
}

export function formatWeight(canonicalKg: number, unitSystem: UnitSystem): DisplayWeight {
  if (unitSystem === "IMPERIAL") {
    return {
      value: kgToLbs(canonicalKg),
      unit: "lbs",
      canonicalKg
    };
  }
  return {
    value: roundToPrecision(canonicalKg, 2),
    unit: "kg",
    canonicalKg
  };
}

export function formatLength(canonicalCm: number, unitSystem: UnitSystem): DisplayLength {
  if (unitSystem === "IMPERIAL") {
    return {
      value: cmToInches(canonicalCm),
      unit: "in",
      canonicalCm
    };
  }
  return {
    value: roundToPrecision(canonicalCm, 2),
    unit: "cm",
    canonicalCm
  };
}
