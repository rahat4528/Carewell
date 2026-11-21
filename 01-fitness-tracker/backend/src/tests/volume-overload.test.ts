import { calculateSetVolume, calculateSessionVolume } from "../modules/workouts/workout-engine";

describe("Volume Load & Progressive Overload Engine", () => {
  test("calculates set volume load: weight * reps", () => {
    expect(calculateSetVolume(100, 5, true)).toBe(500);
    expect(calculateSetVolume(72.5, 8, true)).toBe(580);
    expect(calculateSetVolume(0, 10, true)).toBe(0);
    expect(calculateSetVolume(100, 0, true)).toBe(0);
  });

  test("returns zero volume if set is marked incomplete", () => {
    expect(calculateSetVolume(100, 5, false)).toBe(0);
  });

  test("calculates total session volume summing only completed sets", () => {
    const sessionSets = [
      { weightKg: 60, reps: 10, completed: true },  // 600 kg
      { weightKg: 80, reps: 8, completed: true },   // 640 kg
      { weightKg: 100, reps: 5, completed: true },  // 500 kg
      { weightKg: 105, reps: 3, completed: false }  // uncompleted (0 kg)
    ];

    const totalVolume = calculateSessionVolume(sessionSets);
    expect(totalVolume).toBe(1740);
  });
});
