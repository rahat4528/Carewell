import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedHouseholdRequest } from "../auth/auth.middleware";

const prisma = new PrismaClient();
const router = Router();

// GET /meal-plans/weekly
router.get("/weekly", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { weekStartDate } = req.query;
    const householdId = req.user!.householdId;

    const mealPlan = await prisma.mealPlan.findFirst({
      where: {
        householdId,
        weekStartDate: typeof weekStartDate === "string" ? weekStartDate : undefined
      },
      include: {
        plannedMeals: {
          include: { recipe: { include: { ingredients: true } } },
          orderBy: { date: "asc" }
        }
      }
    });

    return res.json(mealPlan || { message: "No meal plan found for specified week", plannedMeals: [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /meal-plans/assign
router.post("/assign", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { weekStartDate, recipeId, date, mealSlot, targetServings } = req.body;
    if (!weekStartDate || !recipeId || !date || !mealSlot) {
      return res.status(400).json({ error: "weekStartDate, recipeId, date, and mealSlot are required." });
    }

    const householdId = req.user!.householdId;

    // Verify recipe belongs to household
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, householdId }
    });
    if (!recipe) return res.status(404).json({ error: "Recipe not found in household." });

    // Find or create weekly plan
    let mealPlan = await prisma.mealPlan.findFirst({
      where: { householdId, weekStartDate }
    });

    if (!mealPlan) {
      mealPlan = await prisma.mealPlan.create({
        data: {
          householdId,
          name: `Week of ${weekStartDate}`,
          weekStartDate
        }
      });
    }

    const plannedMeal = await prisma.plannedMeal.create({
      data: {
        mealPlanId: mealPlan.id,
        recipeId,
        date,
        mealSlot,
        targetServings: targetServings ? Number(targetServings) : recipe.baseServings
      },
      include: { recipe: true }
    });

    return res.status(201).json(plannedMeal);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /meal-plans/duplicate
router.post("/duplicate", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { sourceWeekStartDate, targetWeekStartDate } = req.body;
    if (!sourceWeekStartDate || !targetWeekStartDate) {
      return res.status(400).json({ error: "sourceWeekStartDate and targetWeekStartDate are required." });
    }

    const householdId = req.user!.householdId;
    const sourcePlan = await prisma.mealPlan.findFirst({
      where: { householdId, weekStartDate: sourceWeekStartDate },
      include: { plannedMeals: true }
    });

    if (!sourcePlan) return res.status(404).json({ error: "Source meal plan not found." });

    const newPlan = await prisma.mealPlan.create({
      data: {
        householdId,
        name: `Week of ${targetWeekStartDate} (Duplicated)`,
        weekStartDate: targetWeekStartDate,
        plannedMeals: {
          create: sourcePlan.plannedMeals.map((pm) => ({
            recipeId: pm.recipeId,
            date: targetWeekStartDate, // mapped to target week
            mealSlot: pm.mealSlot,
            targetServings: pm.targetServings
          }))
        }
      },
      include: { plannedMeals: true }
    });

    return res.status(201).json(newPlan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
