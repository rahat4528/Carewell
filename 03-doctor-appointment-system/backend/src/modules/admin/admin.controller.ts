import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthenticatedUserRequest, requireRole } from "../auth/auth.middleware";

const prisma = new PrismaClient();
const router = Router();

// PATCH /admin/doctors/:id/verify (Admin-only verification gating)
router.patch("/doctors/:id/verify", authMiddleware, requireRole("ADMIN"), async (req: AuthenticatedUserRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status || !["VERIFIED", "REJECTED"].includes(status)) {
      return res.status(400).json({ error: "Status must be VERIFIED or REJECTED" });
    }

    const doctor = await prisma.doctorProfile.findUnique({ where: { id: req.params.id } });
    if (!doctor) return res.status(404).json({ error: "Doctor not found." });

    const updated = await prisma.doctorProfile.update({
      where: { id: req.params.id },
      data: { verificationStatus: status }
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
