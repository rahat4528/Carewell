import {
  recomputePersonalRecords,
  checkNewPersonalRecord,
  SetRecord
} from "../modules/workouts/workout-engine";

describe("Personal Record (PR) Detection & Dynamic Recalculation Engine", () => {
  const initialHistory: SetRecord[] = [
    { weightKg: 80, reps: 10, completed: true }, // 1RM = 106.67, Vol = 800
    { weightKg: 90, reps: 6, completed: true },  // 1RM = 108.00, Vol = 540
    { weightKg: 100, reps: 3, completed: true }, // 1RM = 110.00, Vol = 300
    { weightKg: 60, reps: 15, completed: true }  // 1RM = 90.00,  Vol = 900
  ];

  test("accurately identifies all personal record dimensions from history", () => {
    const prs = recomputePersonalRecords(initialHistory);

    expect(prs.heaviestWeightKg).toBe(100);
    expect(prs.peakEstimated1RmKg).toBe(110);
    expect(prs.maxRepsAtWeight.reps).toBe(15);
    expect(prs.maxVolumeLoadKg).toBe(900);
  });

  test("correctly evaluates if a new incoming set achieves a new PR", () => {
    const currentPRs = recomputePersonalRecords(initialHistory);

    // Heavier weight: 105 kg x 1 rep
    const newHeaviest = checkNewPersonalRecord(currentPRs, {
      weightKg: 105,
      reps: 1,
      completed: true
    });
    expect(newHeaviest.isNewHeaviest).toBe(true);
    expect(newHeaviest.isNew1Rm).toBe(false); // 105 < 110

    // Higher 1RM: 100 kg x 5 reps -> 1RM = 116.67
    const new1Rm = checkNewPersonalRecord(currentPRs, {
      weightKg: 100,
      reps: 5,
      completed: true
    });
    expect(new1Rm.isNew1Rm).toBe(true);
    expect(new1Rm.new1Rm).toBe(116.67);
  });

  test("recalculates PRs accurately when a set is updated or deleted", () => {
    // Suppose the 100kg set (which held heaviest weight & peak 1RM) is deleted
    const updatedHistoryAfterDeletion = initialHistory.filter(s => s.weightKg !== 100);
    const recalculatedPRs = recomputePersonalRecords(updatedHistoryAfterDeletion);

    // Heaviest weight drops from 100 to 90
    expect(recalculatedPRs.heaviestWeightKg).toBe(90);
    // Peak 1RM drops from 110 to 108
    expect(recalculatedPRs.peakEstimated1RmKg).toBe(108);
    // Max volume remains 900
    expect(recalculatedPRs.maxVolumeLoadKg).toBe(900);
  });

  test("returns zeroed PR summary if set history is completely empty", () => {
    const emptyPRs = recomputePersonalRecords([]);
    expect(emptyPRs.heaviestWeightKg).toBe(0);
    expect(emptyPRs.peakEstimated1RmKg).toBe(0);
    expect(emptyPRs.maxVolumeLoadKg).toBe(0);
  });

  test("ignores incomplete (failed/uncompleted) sets during PR calculation", () => {
    const historyWithIncomplete: SetRecord[] = [
      { weightKg: 80, reps: 8, completed: true },
      { weightKg: 150, reps: 1, completed: false } // failed attempt
    ];

    const prs = recomputePersonalRecords(historyWithIncomplete);
    expect(prs.heaviestWeightKg).toBe(80);
  });
});
