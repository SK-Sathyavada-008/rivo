import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFamily extends Document {
  teacherId: Types.ObjectId;
  name: string; // e.g. "Sharma Family"
  guardianName: string;
  guardianPhone?: string;
  guardianEmail?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FamilySchema = new Schema<IFamily>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    guardianName: { type: String, required: true, trim: true },
    guardianPhone: { type: String, trim: true },
    guardianEmail: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

FamilySchema.index({ teacherId: 1, name: 1 });

export const Family = mongoose.model<IFamily>('Family', FamilySchema);
