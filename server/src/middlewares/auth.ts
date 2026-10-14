import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { Types } from 'mongoose';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  academyName: string;
  isDemo?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
}
