import mongoose, { Document, Schema, Types } from 'mongoose';

export type EvidenceSource =
  | 'whatsapp_screenshot'
  | 'whatsapp_text'
  | 'manual_upload'
  | 'android_notification_claim';

export type EvidenceStatus =
  | 'pending_review'
  | 'matched'
  | 'verified_by_teacher'
  | 'rejected'
  | 'dismissed';

export interface IPaymentEvidence extends Document {
  teacherId: Types.ObjectId;
  source: EvidenceSource;
  imageUrl?: string;
  rawText?: string;
  claimedStudentName?: string;
  claimedAmount?: number;
  claimedDate?: string;
  claimedTransactionReference?: string;
  confidenceScore: number;
  extractionDetails?: {
    student_names: string[];
    claimed_amount: number | null;
    claimed_date: string | null;
    claimed_transaction_reference: string | null;
    claimed_status: string | null;
    confidence: number;
    missing_fields: string[];
    explanation: string;
  };
  extractedBy: 'gemma_ai' | 'rule_based_fallback' | 'manual';
  status: EvidenceStatus;
  matchedTransactionId?: Types.ObjectId;
  matchedStudentId?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentEvidenceSchema = new Schema<IPaymentEvidence>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: {
      type: String,
      enum: ['whatsapp_screenshot', 'whatsapp_text', 'manual_upload', 'android_notification_claim'],
      required: true,
    },
    imageUrl: { type: String },
    rawText: { type: String },
    claimedStudentName: { type: String, trim: true },
    claimedAmount: { type: Number },
    claimedDate: { type: String },
    claimedTransactionReference: { type: String, trim: true },
    confidenceScore: { type: Number, default: 0 },
    extractionDetails: { type: Schema.Types.Mixed },
    extractedBy: {
      type: String,
      enum: ['gemma_ai', 'rule_based_fallback', 'manual'],
      default: 'rule_based_fallback',
    },
    status: {
      type: String,
      enum: ['pending_review', 'matched', 'verified_by_teacher', 'rejected', 'dismissed'],
      default: 'pending_review',
      index: true,
    },
    matchedTransactionId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction' },
    matchedStudentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

PaymentEvidenceSchema.index({ teacherId: 1, status: 1 });
PaymentEvidenceSchema.index({ teacherId: 1, claimedTransactionReference: 1 });

export const PaymentEvidence = mongoose.model<IPaymentEvidence>('PaymentEvidence', PaymentEvidenceSchema);
