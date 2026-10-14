import { Types } from 'mongoose';
import { FeeObligation, IFeeObligation, ObligationStatus } from '../models/FeeObligation.js';
import { Student } from '../models/Student.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import { recordAudit } from './auditService.js';

export interface GenerateObligationsResult {
  billingMonth: string;
  totalActiveStudents: number;
  createdCount: number;
  existingCount: number;
  totalAmountDue: number;
}

export async function generateMonthlyObligations(
  teacherId: Types.ObjectId | string,
  billingMonth: string,
  actorName: string,
  actorId?: Types.ObjectId | string
): Promise<GenerateObligationsResult> {
  const tId = new Types.ObjectId(teacherId);

  // 1. Fetch all active students for this teacher
  const students = await Student.find({ teacherId: tId, isActive: true });

  let createdCount = 0;
  let existingCount = 0;
  let totalAmountDue = 0;

  for (const student of students) {
    // Check if obligation already exists for this student and month
    const existing = await FeeObligation.findOne({
      teacherId: tId,
      studentId: student._id,
      billingMonth,
    });

    if (existing) {
      existingCount++;
      totalAmountDue += existing.amountDue;
      continue;
    }

    // Determine amount due from student monthly fee
    const amountDue = student.monthlyFee;
    totalAmountDue += amountDue;

    // Create obligation idempotently
    await FeeObligation.create({
      teacherId: tId,
      studentId: student._id,
      batchId: student.batchId,
      billingMonth,
      amountDue,
      allocatedAmount: 0,
      outstandingBalance: amountDue,
      status: 'unpaid',
      notes: `Generated on ${new Date().toISOString().split('T')[0]}`,
    });

    createdCount++;
  }

  // Audit event
  await recordAudit({
    teacherId: tId,
    actorId,
    actorName,
    action: 'OBLIGATION_GENERATE',
    targetType: 'FeeObligation',
    targetId: billingMonth,
    afterState: { billingMonth, createdCount, existingCount, totalAmountDue },
    reason: `Generated monthly fee obligations for ${billingMonth}`,
  });

  return {
    billingMonth,
    totalActiveStudents: students.length,
    createdCount,
    existingCount,
    totalAmountDue,
  };
}

/**
 * Recalculates an obligation's allocatedAmount and status based on all existing PaymentAllocations.
 */
export async function recalculateObligationBalance(
  obligationId: Types.ObjectId | string
): Promise<IFeeObligation | null> {
  const obligation = await FeeObligation.findById(obligationId);
  if (!obligation) return null;

  // Sum all allocations for this obligation
  const allocations = await PaymentAllocation.find({ obligationId: obligation._id });
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);

  const balance = obligation.amountDue - totalAllocated;
  let status: ObligationStatus = 'unpaid';

  if (totalAllocated >= obligation.amountDue) {
    status = totalAllocated > obligation.amountDue ? 'overpaid' : 'paid';
  } else if (totalAllocated > 0) {
    status = 'partially_paid';
  } else {
    status = 'unpaid';
  }

  obligation.allocatedAmount = totalAllocated;
  obligation.outstandingBalance = Math.max(0, balance);
  obligation.status = status;
  await obligation.save();

  return obligation;
}
