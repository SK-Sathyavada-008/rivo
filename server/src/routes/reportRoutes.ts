import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authMiddleware } from '../middlewares/auth.js';
import { FeeObligation } from '../models/FeeObligation.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import { Batch } from '../models/Batch.js';
import { Student } from '../models/Student.js';
import { ExceptionCase } from '../models/ExceptionCase.js';

const router = Router();

// GET Monthly collections report
router.get('/collections', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const obligations = await FeeObligation.find({ teacherId, billingMonth: month })
      .populate('studentId', 'name monthlyFee')
      .populate('batchId', 'name')
      .sort({ 'studentId.name': 1 });

    const totalExpected = obligations.reduce((sum, o) => sum + o.amountDue, 0);
    const totalCollected = obligations.reduce((sum, o) => sum + o.allocatedAmount, 0);
    const totalOutstanding = Math.max(0, totalExpected - totalCollected);

    res.json({
      month,
      totalExpected,
      totalCollected,
      totalOutstanding,
      count: obligations.length,
      obligations,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Outstanding fees report
router.get('/outstanding', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);

    const obligations = await FeeObligation.find({
      teacherId,
      outstandingBalance: { $gt: 0 },
    })
      .populate({
        path: 'studentId',
        select: 'name guardianName guardianPhone batchId',
        populate: { path: 'batchId', select: 'name' },
      })
      .sort({ billingMonth: -1, outstandingBalance: -1 });

    const totalOutstanding = obligations.reduce((sum, o) => sum + o.outstandingBalance, 0);

    res.json({
      totalOutstanding,
      count: obligations.length,
      obligations,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET CSV Export
router.get('/export-csv', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const type = (req.query.type as string) || 'outstanding';
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    let csv = '';
    let filename = `rivo_${type}_export.csv`;

    if (type === 'collections') {
      filename = `rivo_collections_${month}.csv`;
      const obligations = await FeeObligation.find({ teacherId, billingMonth: month })
        .populate('studentId', 'name guardianName')
        .populate('batchId', 'name');

      csv = 'Student Name,Guardian Name,Batch,Month,Amount Due,Collected,Balance,Status\n';
      for (const o of obligations as any[]) {
        csv += `"${o.studentId?.name || ''}","${o.studentId?.guardianName || ''}","${o.batchId?.name || ''}","${o.billingMonth}",${o.amountDue},${o.allocatedAmount},${o.outstandingBalance},"${o.status}"\n`;
      }
    } else if (type === 'outstanding') {
      filename = `rivo_outstanding_fees.csv`;
      const obligations = await FeeObligation.find({ teacherId, outstandingBalance: { $gt: 0 } })
        .populate('studentId', 'name guardianName guardianPhone')
        .populate('batchId', 'name');

      csv = 'Student Name,Guardian Name,Guardian Phone,Batch,Billing Month,Amount Due,Paid,Outstanding\n';
      for (const o of obligations as any[]) {
        csv += `"${o.studentId?.name || ''}","${o.studentId?.guardianName || ''}","${o.studentId?.guardianPhone || ''}","${o.batchId?.name || ''}","${o.billingMonth}",${o.amountDue},${o.allocatedAmount},${o.outstandingBalance}\n`;
      }
    } else if (type === 'transactions') {
      filename = `rivo_transactions.csv`;
      const txns = await PaymentTransaction.find({ teacherId }).sort({ paymentDate: -1 });

      csv = 'Date,Reference/UTR,Amount,Allocated,Unallocated,Payer,Status,Source,Verified By\n';
      for (const t of txns) {
        const d = t.paymentDate ? t.paymentDate.toISOString().split('T')[0] : '';
        csv += `"${d}","${t.transactionReference || ''}",${t.amount},${t.allocatedAmount},${t.unallocatedAmount},"${t.payerName || ''}","${t.status}","${t.source}","${t.verifiedBy || ''}"\n`;
      }
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
