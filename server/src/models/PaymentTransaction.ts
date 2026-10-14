import mongoose, { Document, Schema, Types } from 'mongoose';

export type TransactionStatus =
  | 'claimed'
  | 'pending_review'
  | 'teacher_verified'
  | 'provider_verified'
  | 'rejected'
  | 'reversed';

export type TransactionSource =
  | 'csv_import'
  | 'manual_entry'
  | 'provider_webhook';

export interface IPaymentTransaction extends Document {
  teacherId: Types.ObjectId;
  transactionReference?: string; // UTR / UPI Ref ID
  amount: number;
  paymentDate: Date;
  payerName?: string;
  payerPhone?: string;
  payerUpiId?: string;
  description?: string;
  source: TransactionSource;
  status: TransactionStatus;
  verifiedAt?: Date;
  verifiedBy?: string; // Teacher name / id or "bank_provider"
  verificationReason?: string;
  allocatedAmount: number;
  unallocatedAmount: number;
  importJobId?: Types.ObjectId;
  isSiblingPayment: boolean;
  notes?: string;
  reversalReason?: string;
  reversedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionReference: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, required: true, default: Date.now },
    payerName: { type: String, trim: true },
    payerPhone: { type: String, trim: true },
    payerUpiId: { type: String, trim: true },
    description: { type: String, trim: true },
    source: {
      type: String,
      enum: ['csv_import', 'manual_entry', 'provider_webhook'],
      default: 'manual_entry',
    },
    status: {
      type: String,
      enum: ['claimed', 'pending_review', 'teacher_verified', 'provider_verified', 'rejected', 'reversed'],
      default: 'pending_review',
      index: true,
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, trim: true },
    verificationReason: { type: String, trim: true },
    allocatedAmount: { type: Number, default: 0, min: 0 },
    unallocatedAmount: { type: Number, default: 0 },
    importJobId: { type: Schema.Types.ObjectId, ref: 'ImportJob' },
    isSiblingPayment: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    reversalReason: { type: String, trim: true },
    reversedAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to maintain unallocatedAmount and enforce transactionReference uniqueness
PaymentTransactionSchema.pre('save', async function (next) {
  this.unallocatedAmount = Math.max(0, this.amount - (this.allocatedAmount || 0));

  if (this.transactionReference && (this.isNew || this.isModified('transactionReference'))) {
    const existing = await (this.constructor as any).findOne({
      teacherId: this.teacherId,
      transactionReference: this.transactionReference,
      _id: { $ne: this._id },
    });
    if (existing) {
      const err = new Error(`Duplicate transaction reference "${this.transactionReference}" already exists.`);
      (err as any).code = 11000;
      return next(err);
    }
  }

  next();
});

PaymentTransactionSchema.index({ teacherId: 1, paymentDate: -1 });
PaymentTransactionSchema.index({ teacherId: 1, status: 1 });
PaymentTransactionSchema.index(
  { teacherId: 1, transactionReference: 1 },
  {
    unique: true,
    sparse: true,
    // Only enforce unique if transactionReference is non-empty string
    partialFilterExpression: { transactionReference: { $type: 'string', $gt: '' } },
  }
);

export const PaymentTransaction = mongoose.model<IPaymentTransaction>(
  'PaymentTransaction',
  PaymentTransactionSchema
);
