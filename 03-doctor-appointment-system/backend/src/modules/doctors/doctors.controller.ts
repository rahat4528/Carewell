import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedUserRequest, requireRole } from "../auth/auth.middleware";

const prisma = new PrismaClient();
const router = Router();

// GET /doctors (Verification gating: only verified doctors listed publicly)
router.get("/", async (req, res) => {
  try {
    const { specialty, search, clinicId } = req.query;

    const where: any = { verificationStatus: "VERIFIED" };

    if (specialty && typeof specialty === "string") {
      where.specialty = { name: specialty };
    }
    if (search && typeof search === "string") {
      where.user = { name: { contains: search } };
    }
    if (clinicId && typeof clinicId === "string") {
      where.affiliations = { some: { clinicId } };
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        specialty: true,
        affiliations: { include: { clinic: true } }
      }
    });

    return res.json(doctors);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /doctors/:id/slots (Returns available, derived time slots)
router.get("/:id/slots", async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { startDate, endDate } = req.query;

    const where: any = {
      doctorId,
      isBooked: false
    };

    if (startDate && typeof startDate === "string") {
      where.startTime = { gte: new Date(startDate) };
    }
    if (endDate && typeof endDate === "string") {
      where.startTime = { ...(where.startTime || {}), lte: new Date(endDate) };
    }

    const slots = await prisma.availabilitySlot.findMany({
      where,
      include: { clinic: true },
      orderBy: { startTime: "asc" }
    });

    return res.json(slots);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
