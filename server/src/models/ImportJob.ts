import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IImportError {
  row: number;
  data: Record<string, any>;
  reason: string;
}

export interface IImportJob extends Document {
  teacherId: Types.ObjectId;
  fileName: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  rowErrors: IImportError[];
  status: 'completed' | 'failed' | 'partial';
  createdAt: Date;
}

const ImportJobSchema = new Schema<IImportJob>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, required: true },
    totalRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    skippedRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    rowErrors: [
      {
        row: { type: Number },
        data: { type: Schema.Types.Mixed },
        reason: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['completed', 'failed', 'partial'],
      default: 'completed',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ImportJob = mongoose.model<IImportJob>('ImportJob', ImportJobSchema);
