import mongoose, { Document, Schema, Types } from 'mongoose';

export type ExceptionReason =
  | 'unknown_student'
  | 'ambiguous_family_match'
  | 'amount_mismatch'
  | 'duplicate_reference'
  | 'evidence_without_transaction'
  | 'partial_payment'
  | 'overpayment'
  | 'unallocated_amount'
  | 'conflicting_dates'
  | 'failed_verification'
  | 'reversed_transaction'
  | 'ai_uncertainty';

export type ExceptionStatus = 'open' | 'resolved' | 'dismissed';

export interface IExceptionCase extends Document {
  teacherId: Types.ObjectId;
  reason: ExceptionReason;
  status: ExceptionStatus;
  evidenceId?: Types.ObjectId;
  transactionId?: Types.ObjectId;
  studentId?: Types.ObjectId;
  claimedAmount?: number;
  claimedDate?: string;
  evidenceSource?: string;
  notes?: string;
  recommendedAction: string;
  resolutionAction?: string;
  resolutionReason?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExceptionCaseSchema = new Schema<IExceptionCase>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: {
      type: String,
      enum: [
        'unknown_student',
        'ambiguous_family_match',
        'amount_mismatch',
        'duplicate_reference',
        'evidence_without_transaction',
        'partial_payment',
        'overpayment',
        'unallocated_amount',
        'conflicting_dates',
        'failed_verification',
        'reversed_transaction',
        'ai_uncertainty',
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['open', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    evidenceId: { type: Schema.Types.ObjectId, ref: 'PaymentEvidence' },
    transactionId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    claimedAmount: { type: Number },
    claimedDate: { type: String },
    evidenceSource: { type: String },
    notes: { type: String, trim: true },
    recommendedAction: { type: String, required: true },
    resolutionAction: { type: String },
    resolutionReason: { type: String },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

ExceptionCaseSchema.index({ teacherId: 1, status: 1 });

export const ExceptionCase = mongoose.model<IExceptionCase>('ExceptionCase', ExceptionCaseSchema);
