import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authMiddleware } from '../middlewares/auth.js';
import { FeeObligation } from '../models/FeeObligation.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentEvidence } from '../models/PaymentEvidence.js';
import { ExceptionCase } from '../models/ExceptionCase.js';
import { Batch } from '../models/Batch.js';
import { Student } from '../models/Student.js';

const router = Router();

router.get('/metrics', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const selectedMonth = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    // 1. Obligations for the selected month
    const obligations = await FeeObligation.find({
      teacherId,
      billingMonth: selectedMonth,
    });

    const totalExpected = obligations.reduce((sum, o) => sum + o.amountDue, 0);
    const verifiedCollected = obligations.reduce((sum, o) => sum + o.allocatedAmount, 0);
    const outstandingAmount = Math.max(0, totalExpected - verifiedCollected);

    const studentsWithOutstanding = obligations.filter(o => o.outstandingBalance > 0).length;
    const fullyPaidStudents = obligations.filter(o => o.status === 'paid' || o.status === 'overpaid').length;

    // 2. Payments awaiting review
    const pendingTxnsCount = await PaymentTransaction.countDocuments({
      teacherId,
      status: { $in: ['pending_review', 'claimed'] },
    });
    const pendingEvidenceCount = await PaymentEvidence.countDocuments({
      teacherId,
      status: 'pending_review',
    });
    const awaitingReviewCount = pendingTxnsCount + pendingEvidenceCount;

    // 3. Batch-wise breakdown
    const batches = await Batch.find({ teacherId, isActive: true });
    const batchBreakdown = [];

    for (const b of batches) {
      const bObs = obligations.filter(o => o.batchId.toString() === b._id.toString());
      const bExpected = bObs.reduce((sum, o) => sum + o.amountDue, 0);
      const bCollected = bObs.reduce((sum, o) => sum + o.allocatedAmount, 0);
      const bOutstanding = Math.max(0, bExpected - bCollected);

      batchBreakdown.push({
        batchId: b._id,
        batchName: b.name,
        expected: bExpected,
        collected: bCollected,
        outstanding: bOutstanding,
        studentsCount: bObs.length,
      });
    }

    // 4. Monthly Trend (last 6 months calculations from DB)
    const trendMonths: string[] = [];
    const currentDate = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      trendMonths.push(d.toISOString().slice(0, 7));
    }

    const monthlyTrend = [];
    for (const m of trendMonths) {
      const mObs = await FeeObligation.find({ teacherId, billingMonth: m });
      const exp = mObs.reduce((sum, o) => sum + o.amountDue, 0);
      const col = mObs.reduce((sum, o) => sum + o.allocatedAmount, 0);
      monthlyTrend.push({
        month: m,
        expected: exp,
        collected: col,
      });
    }

    // 5. Recent Payments
    const recentPayments = await PaymentTransaction.find({ teacherId })
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(6);

    // 6. Recent Open Exceptions
    const recentExceptions = await ExceptionCase.find({ teacherId, status: 'open' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      selectedMonth,
      summary: {
        totalExpected,
        verifiedCollected,
        outstandingAmount,
        studentsWithOutstanding,
        awaitingReviewCount,
        fullyPaidStudents,
        totalStudentsCount: obligations.length,
      },
      batchBreakdown,
      monthlyTrend,
      recentPayments,
      recentExceptions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
