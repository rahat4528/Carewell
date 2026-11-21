import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedRequest } from "../auth/auth.middleware";

const prisma = new PrismaClient();
const router = Router();

// GET /exercises (Catalog + Custom exercises visible to user)
router.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, muscle, equipment } = req.query;
    const userId = req.user!.id;

    const where: any = {
      OR: [
        { isCustom: false },
        { isCustom: true, ownerId: userId }
      ]
    };

    if (search && typeof search === "string") {
      where.name = { contains: search };
    }
    if (category && typeof category === "string") {
      where.category = category;
    }
    if (muscle && typeof muscle === "string") {
      where.primaryMuscle = muscle;
    }
    if (equipment && typeof equipment === "string") {
      where.equipment = equipment;
    }

    const exercises = await prisma.exercise.findMany({
      where,
      orderBy: { name: "asc" }
    });

    return res.json(exercises);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /exercises (Create custom user exercise)
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, primaryMuscle, equipment, instructions } = req.body;
    if (!name || !category || !primaryMuscle || !equipment) {
      return res.status(400).json({ error: "Name, category, primaryMuscle, and equipment are required." });
    }

    const customEx = await prisma.exercise.create({
      data: {
        name,
        category,
        primaryMuscle,
        equipment,
        instructions: instructions || null,
        isCustom: true,
        ownerId: req.user!.id
      }
    });

    return res.status(201).json(customEx);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
