/**
 * Carewell Meal Planner App - Nutrition Estimation & Incomplete Data Engine
 * 
 * Rules:
 * - Macro values are computed estimations based on open food composition records.
 * - Missing ingredients are NOT silently treated as zero; they explicitly trigger
 *   an 'INCOMPLETE' status and list the missing ingredients.
 * - Disclaimers are attached to every calculated result.
 */

export interface FoodCompositionItem {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}

export interface RecipeIngredientForNutrition {
  name: string;
  quantityGrams: number;
}

export interface NutritionEstimateResult {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  status: "COMPLETE" | "INCOMPLETE";
  missingIngredients: string[];
  disclaimer: string;
}

export function calculateRecipeNutrition(
  ingredients: RecipeIngredientForNutrition[],
  compositionTable: Map<string, FoodCompositionItem>
): NutritionEstimateResult {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  const missing: string[] = [];

  for (const ing of ingredients) {
    const norm = ing.name.trim().toLowerCase();
    const comp = compositionTable.get(norm);

    if (!comp) {
      missing.push(ing.name);
    } else {
      const factor = ing.quantityGrams / 100.0;
      totalCalories += comp.caloriesPer100g * factor;
      totalProtein += comp.proteinPer100g * factor;
      totalCarbs += comp.carbsPer100g * factor;
      totalFat += comp.fatPer100g * factor;
      totalFiber += comp.fiberPer100g * factor;
    }
  }

  const isComplete = missing.length === 0;

  return {
    calories: Math.round(totalCalories),
    proteinGrams: Math.round(totalProtein * 10) / 10,
    carbsGrams: Math.round(totalCarbs * 10) / 10,
    fatGrams: Math.round(totalFat * 10) / 10,
    fiberGrams: Math.round(totalFiber * 10) / 10,
    status: isComplete ? "COMPLETE" : "INCOMPLETE",
    missingIngredients: missing,
    disclaimer: isComplete
      ? "Estimated values based on open food composition dataset; not certified laboratory analysis."
      : `Partial estimate. Composition data unavailable for: ${missing.join(", ")}.`
  };
}
