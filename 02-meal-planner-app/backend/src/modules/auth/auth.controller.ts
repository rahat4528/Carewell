import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { authMiddleware, AuthenticatedHouseholdRequest } from "./auth.middleware";

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "meal_planner_jwt_secret_carewell_2026_dev";

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, householdName } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name
      }
    });

    const household = await prisma.household.create({
      data: {
        name: householdName || `${name}'s Kitchen`,
        members: {
          create: {
            userId: user.id,
            role: "OWNER"
          }
        }
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, householdId: household.id, householdRole: "OWNER" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      household: { id: household.id, name: household.name, role: "OWNER" }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { household: true } } }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or credentials." });
    }

    const membership = user.memberships[0];
    const householdId = membership?.householdId || "";
    const householdRole = membership?.role || "MEMBER";

    const token = jwt.sign(
      { id: user.id, email: user.email, householdId, householdRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      household: membership?.household ? { id: membership.household.id, name: membership.household.name, role: householdRole } : null
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/households/current", authMiddleware, async (req: AuthenticatedHouseholdRequest, res: Response) => {
  try {
    const household = await prisma.household.findUnique({
      where: { id: req.user!.householdId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        exclusions: true
      }
    });

    if (!household) return res.status(404).json({ error: "Household not found." });
    return res.json(household);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
