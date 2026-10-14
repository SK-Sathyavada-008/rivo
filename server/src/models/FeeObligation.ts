import mongoose, { Document, Schema, Types } from 'mongoose';

export type ObligationStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';

export interface IFeeObligation extends Document {
  teacherId: Types.ObjectId;
  studentId: Types.ObjectId;
  batchId: Types.ObjectId;
  billingMonth: string; // e.g. "2026-10"
  amountDue: number;
  allocatedAmount: number;
  outstandingBalance: number;
  status: ObligationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeeObligationSchema = new Schema<IFeeObligation>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    billingMonth: { type: String, required: true }, // Format: "YYYY-MM"
    amountDue: { type: Number, required: true, min: 0 },
    allocatedAmount: { type: Number, default: 0, min: 0 },
    outstandingBalance: { type: Number, required: true },
    status: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'overpaid'],
      default: 'unpaid',
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Idempotent: Guarantee exactly one obligation per student per billing month for a teacher
FeeObligationSchema.index(
  { teacherId: 1, studentId: 1, billingMonth: 1 },
  { unique: true }
);

FeeObligationSchema.index({ teacherId: 1, billingMonth: 1, status: 1 });

export const FeeObligation = mongoose.model<IFeeObligation>('FeeObligation', FeeObligationSchema);
