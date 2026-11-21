import {
  calculateRecipeNutrition,
  FoodCompositionItem
} from "../modules/nutrition/nutrition-engine";

describe("Nutrition Estimation & Incomplete Data Protocol", () => {
  const mockComposition = new Map<string, FoodCompositionItem>([
    [
      "chicken breast",
      { name: "chicken breast", caloriesPer100g: 165, proteinPer100g: 31.0, carbsPer100g: 0.0, fatPer100g: 3.6, fiberPer100g: 0.0 }
    ],
    [
      "quinoa",
      { name: "quinoa", caloriesPer100g: 120, proteinPer100g: 4.4, carbsPer100g: 21.3, fatPer100g: 1.9, fiberPer100g: 2.8 }
    ],
    [
      "olive oil",
      { name: "olive oil", caloriesPer100g: 884, proteinPer100g: 0.0, carbsPer100g: 0.0, fatPer100g: 100.0, fiberPer100g: 0.0 }
    ]
  ]);

  test("calculates estimated macros accurately when all ingredients are present in composition table", () => {
    // 200g chicken (330 kcal, 62g P, 0g C, 7.2g F) + 100g quinoa (120 kcal, 4.4g P, 21.3g C, 1.9g F)
    const ingredients = [
      { name: "chicken breast", quantityGrams: 200 },
      { name: "quinoa", quantityGrams: 100 }
    ];

    const result = calculateRecipeNutrition(ingredients, mockComposition);

    expect(result.status).toBe("COMPLETE");
    expect(result.missingIngredients).toHaveLength(0);
    expect(result.calories).toBe(450); // 330 + 120
    expect(result.proteinGrams).toBe(66.4); // 62 + 4.4
    expect(result.carbsGrams).toBe(21.3);
    expect(result.disclaimer).toContain("Estimated values based on open food composition dataset");
  });

  test("flags recipe as INCOMPLETE and itemizes missing ingredients when composition is missing", () => {
    const ingredientsWithUnknown = [
      { name: "chicken breast", quantityGrams: 200 },
      { name: "exotic jungle herb sauce", quantityGrams: 50 }, // Missing from table
      { name: "artisan truffle glaze", quantityGrams: 20 }      // Missing from table
    ];

    const result = calculateRecipeNutrition(ingredientsWithUnknown, mockComposition);

    expect(result.status).toBe("INCOMPLETE");
    expect(result.missingIngredients).toEqual(["exotic jungle herb sauce", "artisan truffle glaze"]);
    // Calculates partial total for known chicken
    expect(result.calories).toBe(330);
    expect(result.disclaimer).toContain("Partial estimate");
    expect(result.disclaimer).toContain("exotic jungle herb sauce");
  });
});
