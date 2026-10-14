import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.js';
import { allocateTransaction } from '../services/reconciliationService.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { FeeObligation } from '../models/FeeObligation.js';

const router = Router();

const AllocationItemSchema = z.object({
  studentId: z.string(),
  obligationId: z.string(),
  billingMonth: z.string(),
  amount: z.number().positive('Allocated amount must be positive'),
});

const AllocateSchema = z.object({
  transactionId: z.string(),
  items: z.array(AllocationItemSchema).min(1, 'At least one allocation item is required'),
  notes: z.string().optional(),
});

// POST Allocate transaction (supports single, sibling, and multi-month)
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const data = AllocateSchema.parse(req.body);

    const result = await allocateTransaction({
      teacherId,
      transactionId: data.transactionId,
      items: data.items,
      actorName: req.user?.name || 'Teacher',
      actorId: req.user?.id,
      notes: data.notes,
    });

    res.status(201).json({
      message: 'Transaction successfully allocated to fee obligations',
      transaction: result.transaction,
      allocations: result.allocations,
    });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(400).json({ error: error.message });
  }
});

// GET Allocations for a transaction
router.get('/transaction/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const allocations = await PaymentAllocation.find({
      teacherId,
      transactionId: req.params.id,
    })
      .populate('studentId', 'name')
      .populate('obligationId', 'billingMonth amountDue allocatedAmount status');

    res.json({ allocations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
