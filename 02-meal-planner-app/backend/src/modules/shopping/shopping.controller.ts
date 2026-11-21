import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedHouseholdRequest } from "../auth/auth.middleware";
import { consolidateShoppingList, RawShoppingItem, PantryStockItem } from "./shopping-engine";
import { scaleRecipeIngredients } from "../recipes/scaling-engine";

const prisma = new PrismaClient();
const router = Router();

// POST /shopping-list/generate (Smart consolidation with pantry deduction)
router.post("/generate", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { weekStartDate, subtractPantry } = req.body;
    const householdId = req.user!.householdId;

    const mealPlan = await prisma.mealPlan.findFirst({
      where: { householdId, weekStartDate },
      include: {
        plannedMeals: {
          include: { recipe: { include: { ingredients: true } } }
        }
      }
    });

    if (!mealPlan || mealPlan.plannedMeals.length === 0) {
      return res.status(404).json({ error: "No planned meals found for date range." });
    }

    // 1. Gather all scaled ingredients from planned meals
    const rawItems: RawShoppingItem[] = [];
    for (const pm of mealPlan.plannedMeals) {
      const scaled = scaleRecipeIngredients(
        pm.recipe.ingredients as any,
        pm.recipe.baseServings,
        pm.targetServings
      );
      for (const ing of scaled) {
        rawItems.push({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          dimension: ing.dimension as any,
          aisle: ing.aisle
        });
      }
    }

    // 2. Fetch pantry stock if requested
    let pantryStock: PantryStockItem[] = [];
    if (subtractPantry !== false) {
      const pantryRecords = await prisma.pantryItem.findMany({ where: { householdId } });
      pantryStock = pantryRecords.map(p => ({
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        dimension: p.dimension as any
      }));
    }

    // 3. Consolidate list
    const consolidated = consolidateShoppingList(rawItems, pantryStock);

    // 4. Save to database
    const shoppingList = await prisma.shoppingList.create({
      data: {
        householdId,
        name: `Grocery List (${weekStartDate})`,
        weekStartDate,
        items: {
          create: consolidated.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            dimension: item.dimension,
            aisle: item.aisle,
            checked: false,
            pantryDeducted: item.pantryDeducted,
            notes: item.notes || null
          }))
        }
      },
      include: { items: true }
    });

    return res.status(201).json(shoppingList);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /shopping-list/items/:id/check
router.patch("/items/:id/check", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { checked } = req.body;
    const item = await prisma.shoppingListItem.findUnique({
      where: { id: req.params.id },
      include: { shoppingList: true }
    });

    if (!item || item.shoppingList.householdId !== req.user!.householdId) {
      return res.status(404).json({ error: "Item not found in household shopping list." });
    }

    const updated = await prisma.shoppingListItem.update({
      where: { id: req.params.id },
      data: { checked: Boolean(checked) }
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /shopping-list/export
router.get("/export", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { format, listId } = req.query;
    const householdId = req.user!.householdId;

    const list = await prisma.shoppingList.findFirst({
      where: { id: typeof listId === "string" ? listId : undefined, householdId },
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });

    if (!list) return res.status(404).json({ error: "Shopping list not found." });

    if (format === "csv") {
      let csv = "Aisle,Ingredient,Quantity,Unit,Checked,Notes\n";
      for (const item of list.items) {
        csv += `"${item.aisle}","${item.name}",${item.quantity},"${item.unit}",${item.checked},"${item.notes || ''}"\n`;
      }
      res.setHeader("Content-Disposition", "attachment; filename=shopping-list.csv");
      res.setHeader("Content-Type", "text/csv");
      return res.send(csv);
    }

    // Default plain text
    let txt = `🛒 Shopping List: ${list.name}\n\n`;
    const aisleGroups: Record<string, typeof list.items> = {};
    for (const item of list.items) {
      aisleGroups[item.aisle] = aisleGroups[item.aisle] || [];
      aisleGroups[item.aisle].push(item);
    }

    for (const [aisle, items] of Object.entries(aisleGroups)) {
      txt += `[${aisle}]\n`;
      for (const i of items) {
        txt += ` [${i.checked ? 'X' : ' '}] ${i.quantity} ${i.unit} ${i.name} ${i.notes ? `(${i.notes})` : ''}\n`;
      }
      txt += '\n';
    }

    res.setHeader("Content-Disposition", "attachment; filename=shopping-list.txt");
    res.setHeader("Content-Type", "text/plain");
    return res.send(txt);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
