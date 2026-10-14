import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authMiddleware } from '../middlewares/auth.js';
import { AuditEvent } from '../models/AuditEvent.js';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { action, limit = '50' } = req.query;

    const query: any = { teacherId };
    if (action) query.action = action;

    const logs = await AuditEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string, 10));

    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
