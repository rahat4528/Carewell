/**
 * Carewell Meal Planner App - Serving Scaling Engine
 * 
 * Rules:
 * - Scalable ingredients scale exactly by targetServings / baseServings.
 * - Non-scalable ingredients (e.g. 'salt to taste', 'cooking spray') remain invariant.
 * - Arithmetic uses exact rounding to 2 decimal places to avoid float drift.
 */

export interface RecipeIngredientInput {
  name: string;
  quantity: number;
  unit: string;
  dimension: "MASS" | "VOLUME" | "COUNT" | "OTHER";
  isScalable: boolean;
  notes?: string;
  aisle?: string;
}

export interface ScaledIngredientOutput extends RecipeIngredientInput {
  originalQuantity: number;
  scalingFactor: number;
}

export function scaleRecipeIngredients(
  ingredients: RecipeIngredientInput[],
  baseServings: number,
  targetServings: number
): ScaledIngredientOutput[] {
  if (baseServings <= 0) throw new Error("Base servings must be greater than zero");
  if (targetServings <= 0) throw new Error("Target servings must be greater than zero");

  const factor = targetServings / baseServings;

  return ingredients.map((ing) => {
    if (!ing.isScalable) {
      return {
        ...ing,
        originalQuantity: ing.quantity,
        scalingFactor: 1.0
      };
    }

    const scaledQuantity = Math.round(ing.quantity * factor * 100) / 100;

    return {
      ...ing,
      quantity: scaledQuantity,
      originalQuantity: ing.quantity,
      scalingFactor: factor
    };
  });
}
