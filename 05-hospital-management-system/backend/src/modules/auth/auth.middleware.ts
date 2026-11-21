import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'carewell-hospital-jwt-secret-key-at-least-32-chars-long';

export interface AuthenticatedStaff {
  id: string;
  email: string;
  name: string;
  role: 'DOCTOR' | 'NURSE' | 'PATHOLOGIST' | 'LAB_TECH' | 'ADMIN';
  department?: string | null;
  licenseNumber?: string | null;
}

export interface AuthenticatedHospitalRequest extends Request {
  user?: AuthenticatedStaff;
}

export function authMiddleware(req: AuthenticatedHospitalRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedStaff;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedHospitalRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `FORBIDDEN: Requires role in [${roles.join(', ')}]. Current role is ${req.user.role}.`
      });
    }
    next();
  };
}
