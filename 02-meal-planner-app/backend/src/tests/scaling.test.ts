import { scaleRecipeIngredients, RecipeIngredientInput } from "../modules/recipes/scaling-engine";

describe("Recipe Serving Scaling Engine", () => {
  const baseIngredients: RecipeIngredientInput[] = [
    { name: "chicken breast", quantity: 500, unit: "g", dimension: "MASS", isScalable: true },
    { name: "quinoa", quantity: 150, unit: "g", dimension: "MASS", isScalable: true },
    { name: "olive oil", quantity: 2, unit: "tbsp", dimension: "VOLUME", isScalable: true },
    { name: "sea salt", quantity: 1, unit: "pinch", dimension: "OTHER", isScalable: false, notes: "to taste" }
  ];

  test("scales scalable ingredients proportionally from base 4 to target 8 servings (2x)", () => {
    const scaled = scaleRecipeIngredients(baseIngredients, 4, 8);

    expect(scaled.find(i => i.name === "chicken breast")?.quantity).toBe(1000);
    expect(scaled.find(i => i.name === "quinoa")?.quantity).toBe(300);
    expect(scaled.find(i => i.name === "olive oil")?.quantity).toBe(4);
  });

  test("scales down accurately from base 4 to target 2 servings (0.5x)", () => {
    const scaled = scaleRecipeIngredients(baseIngredients, 4, 2);

    expect(scaled.find(i => i.name === "chicken breast")?.quantity).toBe(250);
    expect(scaled.find(i => i.name === "quinoa")?.quantity).toBe(75);
    expect(scaled.find(i => i.name === "olive oil")?.quantity).toBe(1);
  });

  test("strictly preserves non-scalable ingredients (isScalable: false) unchanged", () => {
    const scaledUp = scaleRecipeIngredients(baseIngredients, 4, 12);
    const nonScalableUp = scaledUp.find(i => i.name === "sea salt");
    expect(nonScalableUp?.quantity).toBe(1);
    expect(nonScalableUp?.scalingFactor).toBe(1.0);

    const scaledDown = scaleRecipeIngredients(baseIngredients, 4, 1);
    const nonScalableDown = scaledDown.find(i => i.name === "sea salt");
    expect(nonScalableDown?.quantity).toBe(1);
  });

  test("throws error if base or target servings are non-positive", () => {
    expect(() => scaleRecipeIngredients(baseIngredients, 0, 4)).toThrow("Base servings must be greater than zero");
    expect(() => scaleRecipeIngredients(baseIngredients, 4, 0)).toThrow("Target servings must be greater than zero");
  });
});
