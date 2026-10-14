import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IStudent extends Document {
  teacherId: Types.ObjectId;
  name: string;
  guardianName?: string;
  guardianPhone?: string;
  batchId: Types.ObjectId;
  familyId?: Types.ObjectId;
  monthlyFee: number;
  joiningDate: Date;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    guardianName: { type: String, trim: true },
    guardianPhone: { type: String, trim: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true, index: true },
    familyId: { type: Schema.Types.ObjectId, ref: 'Family', index: true },
    monthlyFee: { type: Number, required: true, min: 0 },
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

StudentSchema.index({ teacherId: 1, name: 1 });
StudentSchema.index({ teacherId: 1, batchId: 1, isActive: 1 });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
