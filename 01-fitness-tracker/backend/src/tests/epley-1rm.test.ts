import { calculateEstimated1Rm } from "../modules/workouts/workout-engine";

describe("Epley Estimated 1-Rep Max (1RM) Formula Engine", () => {
  test("returns the exact weight when repetitions equals 1", () => {
    expect(calculateEstimated1Rm(100, 1)).toBe(100);
    expect(calculateEstimated1Rm(142.5, 1)).toBe(142.5);
    expect(calculateEstimated1Rm(60, 1)).toBe(60);
  });

  test("calculates estimated 1RM accurately for reps > 1 using Epley formula: w * (1 + r / 30)", () => {
    // 100kg for 10 reps: 100 * (1 + 10/30) = 100 * (1.3333...) = 133.33 kg
    expect(calculateEstimated1Rm(100, 10)).toBe(133.33);

    // 80kg for 5 reps: 80 * (1 + 5/30) = 80 * 1.1666... = 93.33 kg
    expect(calculateEstimated1Rm(80, 5)).toBe(93.33);

    // 120kg for 3 reps: 120 * (1 + 3/30) = 120 * 1.1 = 132.0 kg
    expect(calculateEstimated1Rm(120, 3)).toBe(132.0);

    // 60kg for 15 reps: 60 * (1 + 15/30) = 60 * 1.5 = 90.0 kg
    expect(calculateEstimated1Rm(60, 15)).toBe(90.0);
  });

  test("handles zero or non-positive weight gracefully", () => {
    expect(calculateEstimated1Rm(0, 10)).toBe(0);
    expect(calculateEstimated1Rm(-50, 10)).toBe(0);
  });

  test("handles zero or non-positive repetitions gracefully", () => {
    expect(calculateEstimated1Rm(100, 0)).toBe(0);
    expect(calculateEstimated1Rm(100, -5)).toBe(0);
  });
});
