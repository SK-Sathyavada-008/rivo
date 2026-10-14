import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import {
  importTransactionsFromCsv,
  previewCsvContent,
  SAMPLE_CSV_CONTENT,
} from '../services/csvService.js';
import { reverseTransaction } from '../services/reconciliationService.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// GET transactions list
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { status, source, search, limit = '50', page = '1' } = req.query;

    const query: any = { teacherId };

    if (status) query.status = status;
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { transactionReference: { $regex: search as string, $options: 'i' } },
        { payerName: { $regex: search as string, $options: 'i' } },
        { description: { $regex: search as string, $options: 'i' } },
      ];
    }

    const pageSize = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);

    const [transactions, totalCount] = await Promise.all([
      PaymentTransaction.find(query)
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      PaymentTransaction.countDocuments(query),
    ]);

    // Attach allocations if any
    const enriched = [];
    for (const t of transactions) {
      const allocations = await PaymentAllocation.find({ transactionId: t._id })
        .populate('studentId', 'name')
        .populate('obligationId', 'billingMonth');

      enriched.push({
        ...t.toObject(),
        allocations,
      });
    }

    res.json({
      transactions: enriched,
      pagination: {
        total: totalCount,
        page: pageNum,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Sample CSV template download
router.get('/sample-csv', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="rivo_sample_bank_statement.csv"');
  res.send(SAMPLE_CSV_CONTENT);
});

// POST Preview CSV before import
router.post('/preview-csv', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      res.status(400).json({ error: 'Valid CSV content string is required.' });
      return;
    }

    const rows = previewCsvContent(csvContent);
    const validCount = rows.filter(r => r.isValid).length;
    const invalidCount = rows.filter(r => !r.isValid).length;

    res.json({
      rows,
      summary: {
        total: rows.length,
        valid: validCount,
        invalid: invalidCount,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: `CSV preview failed: ${error.message}` });
  }
});

// POST Import CSV
router.post('/import-csv', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { csvContent, fileName = 'bank_statement.csv', autoVerify = false } = req.body;

    if (!csvContent || typeof csvContent !== 'string') {
      res.status(400).json({ error: 'CSV content string is required.' });
      return;
    }

    const result = await importTransactionsFromCsv(
      teacherId,
      fileName,
      csvContent,
      autoVerify === true || autoVerify === 'true',
      req.user?.name || 'Teacher',
      req.user?.id
    );

    res.status(201).json({
      message: `Import completed. ${result.importedRows} imported, ${result.skippedRows} skipped (duplicates), ${result.failedRows} failed.`,
      result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Record manual transaction
const ManualTxnSchema = z.object({
  transactionReference: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().optional(),
  payerName: z.string().optional(),
  payerPhone: z.string().optional(),
  payerUpiId: z.string().optional(),
  description: z.string().optional(),
  autoVerify: z.boolean().default(true),
  verificationReason: z.string().optional(),
  notes: z.string().optional(),
});

router.post('/manual', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const data = ManualTxnSchema.parse(req.body);

    // If transaction reference provided, check duplicate
    if (data.transactionReference) {
      const existing = await PaymentTransaction.findOne({
        teacherId,
        transactionReference: data.transactionReference,
      });
      if (existing) {
        res.status(409).json({
          error: `Transaction with reference "${data.transactionReference}" already exists.`,
        });
        return;
      }
    }

    const status = data.autoVerify ? 'teacher_verified' : 'pending_review';

    const transaction = await PaymentTransaction.create({
      teacherId,
      transactionReference: data.transactionReference || undefined,
      amount: data.amount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      payerName: data.payerName,
      payerPhone: data.payerPhone,
      payerUpiId: data.payerUpiId,
      description: data.description,
      source: 'manual_entry',
      status,
      verifiedAt: data.autoVerify ? new Date() : undefined,
      verifiedBy: data.autoVerify ? (req.user?.name || 'Teacher') : undefined,
      verificationReason: data.verificationReason || 'Manually entered and confirmed by teacher',
      allocatedAmount: 0,
      unallocatedAmount: data.amount,
      notes: data.notes,
    });

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'TRANSACTION_MANUAL_CREATE',
      targetType: 'PaymentTransaction',
      targetId: transaction._id.toString(),
      afterState: transaction.toObject(),
      reason: `Manually recorded payment transaction for ₹${transaction.amount}`,
    });

    res.status(201).json({
      message: 'Payment transaction recorded successfully',
      transaction,
    });
  } catch (error: any) {
    if (error.errors) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// POST Explicit Teacher Manual Verification
router.post('/:id/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      res.status(400).json({ error: 'A verification reason is required for manual audit trail.' });
      return;
    }

    const transaction = await PaymentTransaction.findOne({ _id: req.params.id, teacherId });
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const beforeStatus = transaction.status;
    transaction.status = 'teacher_verified';
    transaction.verifiedAt = new Date();
    transaction.verifiedBy = req.user?.name || 'Teacher';
    transaction.verificationReason = reason;
    await transaction.save();

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'TRANSACTION_MANUAL_VERIFY',
      targetType: 'PaymentTransaction',
      targetId: transaction._id.toString(),
      beforeState: { status: beforeStatus },
      afterState: { status: 'teacher_verified', reason, verifiedBy: transaction.verifiedBy },
      reason,
    });

    res.json({
      message: 'Transaction verified successfully as teacher_verified',
      transaction,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Reverse Transaction
router.post('/:id/reverse', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: 'Reversal reason is required for audit records.' });
      return;
    }

    const transaction = await reverseTransaction(
      teacherId,
      String(req.params.id),
      reason,
      req.user?.name || 'Teacher',
      req.user?.id
    );

    res.json({
      message: 'Transaction reversed and allocations unwound successfully.',
      transaction,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
