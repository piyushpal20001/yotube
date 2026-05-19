import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Default admin user ID - used when token is from external system (e.g., Adora 7X frontend)
const DEFAULT_ADMIN_USER_ID = process.env.DEFAULT_USER_ID || 'admin-google-ads-user';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    // No token - set default admin user and continue
    (req as any).user = { userId: DEFAULT_ADMIN_USER_ID };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    next();
  } catch (error) {
    // Token from external system (Adora 7X) - use default admin user
    (req as any).user = { userId: DEFAULT_ADMIN_USER_ID };
    next();
  }
};
