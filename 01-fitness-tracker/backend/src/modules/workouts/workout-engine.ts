/**
 * Carewell Fitness Tracker - Workout & Progressive Overload Engine
 * 
 * Includes:
 * - Epley 1RM estimation formula: 1RM = weight * (1 + reps / 30)
 * - Volume load calculation: sum(weight * reps)
 * - Personal Record (PR) milestone detection and dynamic recomputation
 */

export interface SetRecord {
  id?: string;
  weightKg: number;
  reps: number;
  completed: boolean;
  createdAt?: Date;
}

export interface PersonalRecordSummary {
  heaviestWeightKg: number;
  maxRepsAtWeight: { weightKg: number; reps: number };
  peakEstimated1RmKg: number;
  maxVolumeLoadKg: number;
}

/**
 * Calculates Estimated One-Repetition Maximum (1RM) using the validated Epley formula.
 * Epley formula: 1RM = weight * (1 + reps / 30.0)
 * Edge cases:
 * - If reps === 1, 1RM equals the weight lifted.
 * - If reps <= 0 or weight <= 0, returns 0.
 */
export function calculateEstimated1Rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 100) / 100;
  
  const estimated = weightKg * (1 + reps / 30.0);
  return Math.round(estimated * 100) / 100;
}

/**
 * Calculates volume load for an executed set: weight * reps
 */
export function calculateSetVolume(weightKg: number, reps: number, completed: boolean = true): number {
  if (!completed || weightKg <= 0 || reps <= 0) return 0;
  return Math.round(weightKg * reps * 100) / 100;
}

/**
 * Calculates total volume load for a collection of completed sets
 */
export function calculateSessionVolume(sets: SetRecord[]): number {
  const total = sets
    .filter(s => s.completed)
    .reduce((acc, s) => acc + (s.weightKg * s.reps), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Evaluates and recomputes all Personal Records from the surviving set history.
 * Ensures that if a PR set is updated or deleted, the PRs accurately reflect
 * true historical maximums.
 */
export function recomputePersonalRecords(sets: SetRecord[]): PersonalRecordSummary {
  const completedSets = sets.filter(s => s.completed && s.weightKg > 0 && s.reps > 0);

  if (completedSets.length === 0) {
    return {
      heaviestWeightKg: 0,
      maxRepsAtWeight: { weightKg: 0, reps: 0 },
      peakEstimated1RmKg: 0,
      maxVolumeLoadKg: 0
    };
  }

  let heaviestWeightKg = 0;
  let maxRepsRecord = { weightKg: 0, reps: 0 };
  let peakEstimated1RmKg = 0;
  let maxVolumeLoadKg = 0;

  for (const set of completedSets) {
    // 1. Heaviest weight
    if (set.weightKg > heaviestWeightKg) {
      heaviestWeightKg = set.weightKg;
    }

    // 2. Max reps (or max reps at heaviest load)
    if (set.reps > maxRepsRecord.reps) {
      maxRepsRecord = { weightKg: set.weightKg, reps: set.reps };
    }

    // 3. Peak 1RM
    const current1Rm = calculateEstimated1Rm(set.weightKg, set.reps);
    if (current1Rm > peakEstimated1RmKg) {
      peakEstimated1RmKg = current1Rm;
    }

    // 4. Set volume
    const setVolume = calculateSetVolume(set.weightKg, set.reps, true);
    if (setVolume > maxVolumeLoadKg) {
      maxVolumeLoadKg = setVolume;
    }
  }

  return {
    heaviestWeightKg: Math.round(heaviestWeightKg * 100) / 100,
    maxRepsAtWeight: maxRepsRecord,
    peakEstimated1RmKg: Math.round(peakEstimated1RmKg * 100) / 100,
    maxVolumeLoadKg: Math.round(maxVolumeLoadKg * 100) / 100
  };
}

/**
 * Determines whether a new set qualifies as a new personal record
 */
export function checkNewPersonalRecord(existingSummary: PersonalRecordSummary, newSet: SetRecord): {
  isNewHeaviest: boolean;
  isNew1Rm: boolean;
  isNewVolume: boolean;
  new1Rm: number;
} {
  if (!newSet.completed || newSet.weightKg <= 0 || newSet.reps <= 0) {
    return { isNewHeaviest: false, isNew1Rm: false, isNewVolume: false, new1Rm: 0 };
  }

  const new1Rm = calculateEstimated1Rm(newSet.weightKg, newSet.reps);
  const newSetVolume = calculateSetVolume(newSet.weightKg, newSet.reps, true);

  return {
    isNewHeaviest: newSet.weightKg > existingSummary.heaviestWeightKg,
    isNew1Rm: new1Rm > existingSummary.peakEstimated1RmKg,
    isNewVolume: newSetVolume > existingSummary.maxVolumeLoadKg,
    new1Rm
  };
}
