import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { authMiddleware, AuthenticatedRequest } from "./auth.middleware";

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "fitness_test_jwt_secret_key_carewell_2026";

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, unitSystem, heightCm, weightKg, biologicalSex, birthDate } = req.body;

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
        name,
        profile: {
          create: {
            unitSystem: unitSystem === "IMPERIAL" ? "IMPERIAL" : "METRIC",
            heightCm: heightCm ? Number(heightCm) : null,
            weightKg: weightKg ? Number(weightKg) : null,
            biologicalSex: biologicalSex || null,
            birthDate: birthDate ? new Date(birthDate) : null
          }
        }
      },
      include: { profile: true }
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Registration failed." });
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
      include: { profile: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or credentials." });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Login failed." });
  }
});

router.get("/profile", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { profile: true }
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch("/profile", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { unitSystem, heightCm, weightKg, name } = req.body;
    if (name) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { name }
      });
    }

    const updatedProfile = await prisma.fitnessProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        unitSystem: unitSystem ? (unitSystem === "IMPERIAL" ? "IMPERIAL" : "METRIC") : undefined,
        heightCm: heightCm !== undefined ? Number(heightCm) : undefined,
        weightKg: weightKg !== undefined ? Number(weightKg) : undefined
      },
      create: {
        userId: req.user!.id,
        unitSystem: unitSystem === "IMPERIAL" ? "IMPERIAL" : "METRIC",
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null
      }
    });

    return res.json({ profile: updatedProfile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
