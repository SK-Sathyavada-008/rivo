import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPaymentAllocation extends Document {
  teacherId: Types.ObjectId;
  transactionId: Types.ObjectId;
  studentId: Types.ObjectId;
  obligationId: Types.ObjectId;
  billingMonth: string;
  allocatedAmount: number;
  allocationDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentAllocationSchema = new Schema<IPaymentAllocation>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'PaymentTransaction', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    obligationId: { type: Schema.Types.ObjectId, ref: 'FeeObligation', required: true, index: true },
    billingMonth: { type: String, required: true },
    allocatedAmount: { type: Number, required: true, min: 0.01 },
    allocationDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

PaymentAllocationSchema.index({ teacherId: 1, studentId: 1, billingMonth: 1 });
PaymentAllocationSchema.index({ teacherId: 1, transactionId: 1 });

export const PaymentAllocation = mongoose.model<IPaymentAllocation>(
  'PaymentAllocation',
  PaymentAllocationSchema
);
