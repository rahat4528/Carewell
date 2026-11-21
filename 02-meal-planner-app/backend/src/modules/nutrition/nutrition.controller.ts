import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedHouseholdRequest } from "../auth/auth.middleware";
import { calculateRecipeNutrition, FoodCompositionItem } from "./nutrition-engine";

const prisma = new PrismaClient();
const router = Router();

// GET /nutrition/recipe/:id
router.get("/recipe/:id", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const recipe = await prisma.recipe.findFirst({
      where: { id: req.params.id, householdId: req.user!.householdId },
      include: { ingredients: true }
    });

    if (!recipe) return res.status(404).json({ error: "Recipe not found." });

    // Load composition dictionary
    const allComposition = await prisma.foodComposition.findMany();
    const compMap = new Map<string, FoodCompositionItem>();
    for (const item of allComposition) {
      compMap.set(item.name.toLowerCase(), item);
    }

    // Convert ingredients to gram representations
    const ingredientsForNutrition = recipe.ingredients.map(ing => {
      let grams = ing.quantity;
      if (ing.unit === "kg") grams *= 1000;
      if (ing.unit === "oz") grams *= 28.3495;
      if (ing.unit === "lb" || ing.unit === "lbs") grams *= 453.592;

      return {
        name: ing.name,
        quantityGrams: grams
      };
    });

    const nutritionResult = calculateRecipeNutrition(ingredientsForNutrition, compMap);

    return res.json({
      recipeId: recipe.id,
      title: recipe.title,
      baseServings: recipe.baseServings,
      totalNutrition: nutritionResult,
      perServingNutrition: {
        calories: Math.round(nutritionResult.calories / recipe.baseServings),
        proteinGrams: Math.round((nutritionResult.proteinGrams / recipe.baseServings) * 10) / 10,
        carbsGrams: Math.round((nutritionResult.carbsGrams / recipe.baseServings) * 10) / 10,
        fatGrams: Math.round((nutritionResult.fatGrams / recipe.baseServings) * 10) / 10,
        fiberGrams: Math.round((nutritionResult.fiberGrams / recipe.baseServings) * 10) / 10,
        status: nutritionResult.status
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
