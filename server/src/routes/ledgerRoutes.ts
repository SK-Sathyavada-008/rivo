import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.js';
import { FeeObligation } from '../models/FeeObligation.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import { generateMonthlyObligations, recalculateObligationBalance } from '../services/ledgerService.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// GET Monthly Fee Ledger
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    const { batchId, status, search } = req.query;

    const query: any = {
      teacherId,
      billingMonth: month,
    };

    if (batchId) {
      query.batchId = new Types.ObjectId(batchId as string);
    }
    if (status) {
      query.status = status;
    }

    let obligations = await FeeObligation.find(query)
      .populate({
        path: 'studentId',
        select: 'name guardianName guardianPhone monthlyFee isActive familyId',
        populate: { path: 'familyId', select: 'name' },
      })
      .populate('batchId', 'name')
      .sort({ status: 1, 'studentId.name': 1 });

    if (search) {
      const term = (search as string).toLowerCase();
      obligations = obligations.filter((o: any) =>
        o.studentId?.name?.toLowerCase().includes(term) ||
        o.studentId?.guardianName?.toLowerCase().includes(term)
      );
    }

    // Attach allocation records for each obligation
    const enriched = [];
    for (const ob of obligations) {
      const allocations = await PaymentAllocation.find({ obligationId: ob._id })
        .populate('transactionId', 'transactionReference paymentDate payerName status')
        .sort({ allocationDate: -1 });

      enriched.push({
        ...ob.toObject(),
        allocations,
      });
    }

    // Summary calculations
    const totalExpected = obligations.reduce((sum, o) => sum + o.amountDue, 0);
    const totalCollected = obligations.reduce((sum, o) => sum + o.allocatedAmount, 0);
    const totalOutstanding = Math.max(0, totalExpected - totalCollected);

    res.json({
      billingMonth: month,
      summary: {
        totalExpected,
        totalCollected,
        totalOutstanding,
        totalCount: obligations.length,
      },
      obligations: enriched,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Idempotent Monthly Obligation Generation
const GenerateSchema = z.object({
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

router.post('/generate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { billingMonth } = GenerateSchema.parse(req.body);

    const result = await generateMonthlyObligations(
      teacherId,
      billingMonth,
      req.user?.name || 'Teacher',
      req.user?.id
    );

    res.json({
      message: `Fee obligations processed for ${billingMonth}. Created: ${result.createdCount}, Existing: ${result.existingCount}`,
      result,
    });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
