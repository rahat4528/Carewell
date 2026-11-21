import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { authMiddleware, AuthenticatedUserRequest } from "./auth.middleware";

const prisma = new PrismaClient();
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "appointments_jwt_secret_carewell_2026_dev";

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, specialtyId, licenseNumber, consultationFee, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered." });

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === "DOCTOR" ? "DOCTOR" : role === "ADMIN" ? "ADMIN" : "PATIENT";

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: userRole
      }
    });

    let profileId: string | undefined;

    if (userRole === "PATIENT") {
      const patient = await prisma.patientProfile.create({
        data: { userId: user.id, phone: phone || null }
      });
      profileId = patient.id;
    } else if (userRole === "DOCTOR") {
      // Find default specialty if not provided
      let sId = specialtyId;
      if (!sId) {
        const firstSpecialty = await prisma.specialty.findFirst();
        sId = firstSpecialty?.id;
      }

      const doctor = await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          specialtyId: sId!,
          licenseNumber: licenseNumber || "PENDING-LIC-000",
          consultationFee: consultationFee ? Number(consultationFee) : 150.0,
          verificationStatus: "PENDING_VERIFICATION"
        }
      });
      profileId = doctor.id;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, profileId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, profileId }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await prisma.user.findUnique({
      where: { email },
      include: { patient: true, doctor: true }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or credentials." });
    }

    const profileId = user.patient?.id || user.doctor?.id;

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, profileId },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, profileId }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/profile", authMiddleware, async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { patient: true, doctor: { include: { specialty: true } } }
    });

    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json(user);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
