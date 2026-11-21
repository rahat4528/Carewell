import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedHouseholdRequest } from "../auth/auth.middleware";
import { evaluatePantryExpiry } from "./expiry-engine";

const prisma = new PrismaClient();
const router = Router();

// GET /pantry
router.get("/", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { filter } = req.query;
    const householdId = req.user!.householdId;

    const items = await prisma.pantryItem.findMany({
      where: { householdId },
      orderBy: { expiryDate: "asc" }
    });

    const currentDateStr = new Date().toISOString().split("T")[0];
    const evaluation = evaluatePantryExpiry(items, currentDateStr, 5);

    if (filter === "use_soon") {
      return res.json({
        useSoon: evaluation.useSoonItems,
        expired: evaluation.expiredItems
      });
    }

    return res.json({
      allItems: items,
      summary: {
        total: items.length,
        expiredCount: evaluation.expiredItems.length,
        useSoonCount: evaluation.useSoonItems.length
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /pantry
router.post("/", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const { name, quantity, unit, dimension, location, expiryDate } = req.body;
    if (!name || quantity === undefined || !expiryDate) {
      return res.status(400).json({ error: "Name, quantity, and expiryDate (YYYY-MM-DD) are required." });
    }

    const item = await prisma.pantryItem.create({
      data: {
        householdId: req.user!.householdId,
        name,
        quantity: Number(quantity),
        unit: unit || "item",
        dimension: dimension || "COUNT",
        location: location || "PANTRY",
        expiryDate
      }
    });

    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /pantry/:id
router.delete("/:id", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const item = await prisma.pantryItem.findFirst({
      where: { id: req.params.id, householdId: req.user!.householdId }
    });

    if (!item) return res.status(404).json({ error: "Pantry item not found." });

    await prisma.pantryItem.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Pantry item removed." });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
