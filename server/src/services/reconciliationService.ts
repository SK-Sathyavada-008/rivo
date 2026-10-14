import { Types } from 'mongoose';
import { PaymentTransaction, IPaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import { FeeObligation } from '../models/FeeObligation.js';
import { Student } from '../models/Student.js';
import { Family } from '../models/Family.js';
import { PaymentEvidence } from '../models/PaymentEvidence.js';
import { ExceptionCase } from '../models/ExceptionCase.js';
import { recalculateObligationBalance } from './ledgerService.js';
import { recordAudit } from './auditService.js';

export interface AllocationPlanItem {
  studentId: string;
  obligationId: string;
  billingMonth: string;
  amount: number;
}

export interface AllocatePaymentParams {
  teacherId: Types.ObjectId | string;
  transactionId: Types.ObjectId | string;
  items: AllocationPlanItem[];
  actorName: string;
  actorId?: Types.ObjectId | string;
  notes?: string;
}

/**
 * Allocates a verified transaction across one or more students/fee obligations.
 * Ensures total allocated amount does not exceed transaction amount.
 * Transaction must be in a verified state (teacher_verified or provider_verified).
 */
export async function allocateTransaction(params: AllocatePaymentParams) {
  const tId = new Types.ObjectId(params.teacherId);
  const txnId = new Types.ObjectId(params.transactionId);

  const transaction = await PaymentTransaction.findOne({ _id: txnId, teacherId: tId });
  if (!transaction) {
    throw new Error('Transaction not found or not owned by teacher');
  }

  // Check verification state
  if (transaction.status !== 'teacher_verified' && transaction.status !== 'provider_verified') {
    throw new Error(
      `Cannot allocate unverified transaction. Current status: ${transaction.status}. Please verify first.`
    );
  }

  // Calculate existing allocations for this transaction
  const existingAllocations = await PaymentAllocation.find({ transactionId: txnId });
  const currentAllocated = existingAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

  // Sum proposed allocations
  const newAllocationSum = params.items.reduce((sum, item) => sum + item.amount, 0);
  if (newAllocationSum <= 0) {
    throw new Error('Total allocation amount must be greater than zero');
  }

  if (currentAllocated + newAllocationSum > transaction.amount + 0.001) {
    throw new Error(
      `Total allocation (₹${currentAllocated + newAllocationSum}) exceeds transaction amount (₹${transaction.amount})`
    );
  }

  // Validate each item belongs to the teacher and obligations exist
  for (const item of params.items) {
    const obligation = await FeeObligation.findOne({
      _id: new Types.ObjectId(item.obligationId),
      teacherId: tId,
      studentId: new Types.ObjectId(item.studentId),
    });
    if (!obligation) {
      throw new Error(`Obligation ${item.obligationId} not found for student ${item.studentId}`);
    }
  }

  // Execute allocations
  const createdAllocations = [];
  for (const item of params.items) {
    const allocation = await PaymentAllocation.create({
      teacherId: tId,
      transactionId: txnId,
      studentId: new Types.ObjectId(item.studentId),
      obligationId: new Types.ObjectId(item.obligationId),
      billingMonth: item.billingMonth,
      allocatedAmount: item.amount,
      notes: params.notes,
    });
    createdAllocations.push(allocation);

    // Recalculate obligation balance
    await recalculateObligationBalance(item.obligationId);
  }

  // Update transaction allocated & unallocated amounts
  transaction.allocatedAmount = currentAllocated + newAllocationSum;
  transaction.unallocatedAmount = Math.max(0, transaction.amount - transaction.allocatedAmount);
  if (params.items.length > 1) {
    transaction.isSiblingPayment = true;
  }
  await transaction.save();

  // Audit
  await recordAudit({
    teacherId: tId,
    actorId: params.actorId,
    actorName: params.actorName,
    action: 'ALLOCATION_CREATE',
    targetType: 'PaymentAllocation',
    targetId: transaction._id.toString(),
    afterState: {
      transactionId: transaction._id,
      amount: transaction.amount,
      allocatedSum: transaction.allocatedAmount,
      items: params.items,
    },
    reason: params.notes || 'Allocated transaction across fee obligations',
  });

  return {
    transaction,
    allocations: createdAllocations,
  };
}

/**
 * Reverses a transaction:
 * Deallocates all linked payment allocations, recalculates fee obligations,
 * updates transaction status to 'reversed', and logs an audit event.
 */
export async function reverseTransaction(
  teacherId: Types.ObjectId | string,
  transactionId: Types.ObjectId | string,
  reason: string,
  actorName: string,
  actorId?: Types.ObjectId | string
) {
  const tId = new Types.ObjectId(teacherId);
  const txnId = new Types.ObjectId(transactionId);

  const transaction = await PaymentTransaction.findOne({ _id: txnId, teacherId: tId });
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'reversed') {
    throw new Error('Transaction is already reversed');
  }

  const beforeStatus = transaction.status;

  // Find all allocations for this transaction
  const allocations = await PaymentAllocation.find({ transactionId: txnId });

  // Delete allocations and recalculate each obligation
  for (const alloc of allocations) {
    const obligationId = alloc.obligationId;
    await PaymentAllocation.findByIdAndDelete(alloc._id);
    await recalculateObligationBalance(obligationId);
  }

  // Update transaction status
  transaction.status = 'reversed';
  transaction.allocatedAmount = 0;
  transaction.unallocatedAmount = transaction.amount;
  transaction.reversalReason = reason;
  transaction.reversedAt = new Date();
  await transaction.save();

  // Audit
  await recordAudit({
    teacherId: tId,
    actorId,
    actorName,
    action: 'TRANSACTION_REVERSE',
    targetType: 'PaymentTransaction',
    targetId: txnId.toString(),
    beforeState: { status: beforeStatus, amount: transaction.amount },
    afterState: { status: 'reversed', reason, reversedAt: transaction.reversedAt },
    reason,
  });

  return transaction;
}

/**
 * Automated reconciliation attempt for an evidence item.
 * Evaluates match candidate signals and proposes a match or registers an exception case.
 */
export async function reconcileEvidence(
  evidenceId: Types.ObjectId | string,
  teacherId: Types.ObjectId | string
) {
  const tId = new Types.ObjectId(teacherId);
  const evidence = await PaymentEvidence.findOne({ _id: evidenceId, teacherId: tId });
  if (!evidence) throw new Error('Evidence not found');

  let matchFound = false;

  // Signal 1: Exact transaction reference match against confirmed transactions
  if (evidence.claimedTransactionReference) {
    const matchingTxn = await PaymentTransaction.findOne({
      teacherId: tId,
      transactionReference: evidence.claimedTransactionReference,
    });

    if (matchingTxn) {
      // Check amount match
      if (evidence.claimedAmount && Math.abs(matchingTxn.amount - evidence.claimedAmount) > 0.01) {
        // Amount mismatch exception!
        await ExceptionCase.create({
          teacherId: tId,
          reason: 'amount_mismatch',
          status: 'open',
          evidenceId: evidence._id,
          transactionId: matchingTxn._id,
          claimedAmount: evidence.claimedAmount,
          recommendedAction: `Claimed ₹${evidence.claimedAmount} does not match bank transaction ₹${matchingTxn.amount}. Review receipt.`,
        });
        evidence.status = 'pending_review';
        await evidence.save();
        return { status: 'exception', reason: 'amount_mismatch' };
      }

      // Exact match!
      evidence.matchedTransactionId = matchingTxn._id as Types.ObjectId;
      evidence.status = 'matched';
      await evidence.save();
      matchFound = true;
      return { status: 'matched', transactionId: matchingTxn._id };
    }
  }

  // Signal 2: Match by student name
  if (evidence.claimedStudentName) {
    const student = await Student.findOne({
      teacherId: tId,
      name: new RegExp(`^${evidence.claimedStudentName.trim()}$`, 'i'),
    });

    if (student) {
      evidence.matchedStudentId = student._id as Types.ObjectId;
      await evidence.save();
    } else {
      // Unknown student -> exception
      await ExceptionCase.create({
        teacherId: tId,
        reason: 'unknown_student',
        status: 'open',
        evidenceId: evidence._id,
        claimedAmount: evidence.claimedAmount,
        evidenceSource: evidence.source,
        notes: `Student name "${evidence.claimedStudentName}" not found in academy records.`,
        recommendedAction: 'Link to an existing student or add new student to academy roster.',
      });
      return { status: 'exception', reason: 'unknown_student' };
    }
  }

  // If no transaction match was found
  if (!matchFound) {
    await ExceptionCase.create({
      teacherId: tId,
      reason: 'evidence_without_transaction',
      status: 'open',
      evidenceId: evidence._id,
      claimedAmount: evidence.claimedAmount,
      claimedDate: evidence.claimedDate,
      evidenceSource: evidence.source,
      notes: `Payment screenshot/claim received for ₹${evidence.claimedAmount || 0}, but no matching bank transaction found yet.`,
      recommendedAction: 'Wait for bank statement import or manually verify transaction with payment proof.',
    });
    return { status: 'exception', reason: 'evidence_without_transaction' };
  }

  return { status: 'processed' };
}
