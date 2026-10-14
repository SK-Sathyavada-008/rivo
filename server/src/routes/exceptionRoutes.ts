import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authMiddleware } from '../middlewares/auth.js';
import { ExceptionCase } from '../models/ExceptionCase.js';
import { PaymentEvidence } from '../models/PaymentEvidence.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

// GET all exceptions
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { status = 'open' } = req.query;

    const query: any = { teacherId };
    if (status !== 'all') {
      query.status = status;
    }

    const exceptions = await ExceptionCase.find(query)
      .populate('studentId', 'name monthlyFee')
      .populate('evidenceId', 'source rawText imageUrl claimedAmount claimedDate claimedTransactionReference')
      .populate('transactionId', 'transactionReference amount paymentDate payerName status')
      .sort({ createdAt: -1 });

    res.json({ exceptions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Resolve exception case
router.post('/:id/resolve', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const teacherId = new Types.ObjectId(req.user?.id);
    const { resolutionAction, resolutionReason, studentId, transactionId } = req.body;

    if (!resolutionAction || !resolutionReason) {
      res.status(400).json({ error: 'resolutionAction and resolutionReason are required.' });
      return;
    }

    const exception = await ExceptionCase.findOne({ _id: req.params.id, teacherId });
    if (!exception) {
      res.status(404).json({ error: 'Exception case not found' });
      return;
    }

    const beforeStatus = exception.status;
    exception.status = resolutionAction === 'dismiss' ? 'dismissed' : 'resolved';
    exception.resolutionAction = resolutionAction;
    exception.resolutionReason = resolutionReason;
    exception.resolvedBy = req.user?.name || 'Teacher';
    exception.resolvedAt = new Date();

    if (studentId) exception.studentId = new Types.ObjectId(studentId);
    if (transactionId) exception.transactionId = new Types.ObjectId(transactionId);

    await exception.save();

    // If evidence associated, update status accordingly
    if (exception.evidenceId && resolutionAction === 'reject') {
      await PaymentEvidence.findByIdAndUpdate(exception.evidenceId, { status: 'rejected' });
    }

    await recordAudit({
      teacherId,
      actorId: req.user?.id,
      actorName: req.user?.name || 'Teacher',
      action: 'EXCEPTION_RESOLVE',
      targetType: 'ExceptionCase',
      targetId: exception._id.toString(),
      beforeState: { status: beforeStatus, reason: exception.reason },
      afterState: {
        status: exception.status,
        resolutionAction,
        resolutionReason,
        resolvedBy: exception.resolvedBy,
      },
      reason: resolutionReason,
    });

    res.json({
      message: `Exception case ${exception.status} successfully.`,
      exception,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
