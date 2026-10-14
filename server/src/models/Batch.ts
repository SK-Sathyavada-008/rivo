import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBatch extends Document {
  teacherId: Types.ObjectId;
  name: string;
  schedule?: string;
  instructor?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    schedule: { type: String, trim: true },
    instructor: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BatchSchema.index({ teacherId: 1, name: 1 });

export const Batch = mongoose.model<IBatch>('Batch', BatchSchema);
