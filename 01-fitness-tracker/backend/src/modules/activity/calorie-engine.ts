/**
 * Carewell Fitness Tracker - Calorie Expenditure Estimation Engine
 * 
 * Principle:
 * - Calorie expenditure is calculated using validated Metabolic Equivalent of Task (MET) multipliers.
 * - Formula: Energy (kcal) = MET * BodyWeight (kg) * (DurationMinutes / 60)
 * - ALL outputs are explicitly tagged as 'nature: ESTIMATED' to guarantee no diagnostic claims.
 */

export interface MetEntry {
  activityKey: string;
  name: string;
  metValue: number;
  category: "CARDIO" | "STRENGTH" | "FLEXIBILITY" | "OTHER";
}

export const MET_TABLE: Record<string, MetEntry> = {
  WALKING_MODERATE: {
    activityKey: "WALKING_MODERATE",
    name: "Walking (moderate, ~4.8 km/h)",
    metValue: 3.5,
    category: "CARDIO"
  },
  WALKING_BRISK: {
    activityKey: "WALKING_BRISK",
    name: "Walking (brisk, ~6.0 km/h)",
    metValue: 4.5,
    category: "CARDIO"
  },
  RUNNING_JOGGING: {
    activityKey: "RUNNING_JOGGING",
    name: "Running (jogging, ~8.0 km/h)",
    metValue: 8.0,
    category: "CARDIO"
  },
  RUNNING_FAST: {
    activityKey: "RUNNING_FAST",
    name: "Running (fast, ~11.0 km/h)",
    metValue: 11.5,
    category: "CARDIO"
  },
  CYCLING_MODERATE: {
    activityKey: "CYCLING_MODERATE",
    name: "Cycling (moderate effort, 16-19 km/h)",
    metValue: 6.8,
    category: "CARDIO"
  },
  STRENGTH_GENERAL: {
    activityKey: "STRENGTH_GENERAL",
    name: "Resistance Training (vigorous effort)",
    metValue: 6.0,
    category: "STRENGTH"
  },
  HIIT_TRAINING: {
    activityKey: "HIIT_TRAINING",
    name: "High-Intensity Interval Training (HIIT)",
    metValue: 9.0,
    category: "CARDIO"
  },
  YOGA_STRETCHING: {
    activityKey: "YOGA_STRETCHING",
    name: "Yoga & Dynamic Stretching",
    metValue: 2.5,
    category: "FLEXIBILITY"
  },
  SWIMMING_LAPS: {
    activityKey: "SWIMMING_LAPS",
    name: "Swimming (freestyle laps, moderate)",
    metValue: 7.0,
    category: "CARDIO"
  }
};

export interface CalorieEstimationResult {
  estimatedCalories: number;
  metValue: number;
  bodyWeightKg: number;
  durationMinutes: number;
  formula: string;
  nature: "ESTIMATED";
  disclaimer: string;
}

/**
 * Calculates estimated energy expenditure using documented MET formula:
 * Calories = MET * Weight(kg) * (DurationMinutes / 60)
 */
export function calculateEstimatedCalories(
  metValue: number,
  bodyWeightKg: number,
  durationMinutes: number
): CalorieEstimationResult {
  if (metValue <= 0) throw new Error("MET value must be greater than zero");
  if (bodyWeightKg <= 0) throw new Error("Body weight must be greater than zero");
  if (durationMinutes < 0) throw new Error("Duration cannot be negative");

  const durationHours = durationMinutes / 60.0;
  const rawCalories = metValue * bodyWeightKg * durationHours;
  const estimatedCalories = Math.round(rawCalories * 10) / 10;

  return {
    estimatedCalories,
    metValue,
    bodyWeightKg,
    durationMinutes,
    formula: "MET * weight_kg * (duration_minutes / 60)",
    nature: "ESTIMATED",
    disclaimer: "Calculated algorithmic estimate based on Compendium of Physical Activities MET table; not a direct metabolic measurement."
  };
}

/**
 * Convenience helper resolving activity key to MET value
 */
export function estimateCaloriesForActivity(
  activityKey: string,
  bodyWeightKg: number,
  durationMinutes: number
): CalorieEstimationResult {
  const entry = MET_TABLE[activityKey] || MET_TABLE.STRENGTH_GENERAL;
  return calculateEstimatedCalories(entry.metValue, bodyWeightKg, durationMinutes);
}
