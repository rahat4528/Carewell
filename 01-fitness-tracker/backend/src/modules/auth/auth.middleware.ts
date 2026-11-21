import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization token" });
  }

  const token = authHeader.split(" ")[1];
  const jwtSecret = process.env.JWT_SECRET || "fitness_test_jwt_secret_key_carewell_2026";

  try {
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }
}
