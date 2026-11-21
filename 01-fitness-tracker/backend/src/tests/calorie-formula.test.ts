import {
  calculateEstimatedCalories,
  estimateCaloriesForActivity,
  MET_TABLE
} from "../modules/activity/calorie-engine";

describe("Calorie Expenditure Estimation Engine (MET Formulation)", () => {
  test("calculates estimated calories accurately according to standard formula", () => {
    // Calories = MET * Weight(kg) * (DurationMinutes / 60)
    // 70 kg person jogging (MET = 8.0) for 30 minutes: 8.0 * 70 * (30/60) = 280 kcal
    const result = calculateEstimatedCalories(8.0, 70, 30);
    expect(result.estimatedCalories).toBe(280.0);
    expect(result.formula).toBe("MET * weight_kg * (duration_minutes / 60)");
    expect(result.nature).toBe("ESTIMATED");
  });

  test("calculates strength training expenditure correctly", () => {
    // 80 kg person vigorous lifting (MET = 6.0) for 60 minutes: 6.0 * 80 * 1.0 = 480 kcal
    const result = calculateEstimatedCalories(MET_TABLE.STRENGTH_GENERAL.metValue, 80, 60);
    expect(result.estimatedCalories).toBe(480.0);
  });

  test("convenience resolver maps activities and defaults to strength for unknown key", () => {
    const walkingResult = estimateCaloriesForActivity("WALKING_MODERATE", 75, 60);
    // 3.5 * 75 * 1.0 = 262.5
    expect(walkingResult.estimatedCalories).toBe(262.5);

    const unknownResult = estimateCaloriesForActivity("UNKNOWN_RANDOM_SPORT", 75, 60);
    // Defaults to STRENGTH_GENERAL (MET 6.0): 6.0 * 75 * 1.0 = 450
    expect(unknownResult.estimatedCalories).toBe(450.0);
  });

  test("always includes explicit non-diagnostic disclaimer in results", () => {
    const result = calculateEstimatedCalories(5.0, 70, 45);
    expect(result.disclaimer).toContain("Calculated algorithmic estimate");
    expect(result.disclaimer).toContain("not a direct metabolic measurement");
  });

  test("rejects invalid non-positive inputs with descriptive errors", () => {
    expect(() => calculateEstimatedCalories(0, 70, 30)).toThrow("MET value must be greater than zero");
    expect(() => calculateEstimatedCalories(5, 0, 30)).toThrow("Body weight must be greater than zero");
    expect(() => calculateEstimatedCalories(5, 70, -10)).toThrow("Duration cannot be negative");
  });
});
