import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedHospitalRequest } from './auth.middleware';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'carewell-hospital-jwt-secret-key-at-least-32-chars-long';

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, department, licenseNumber } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Staff account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'DOCTOR',
        department: department || null,
        licenseNumber: licenseNumber || null
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        licenseNumber: user.licenseNumber
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        licenseNumber: user.licenseNumber
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        licenseNumber: user.licenseNumber
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthenticatedHospitalRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
