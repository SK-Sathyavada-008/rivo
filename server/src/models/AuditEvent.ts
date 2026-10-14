import mongoose, { Document, Schema, Types } from 'mongoose';

export type AuditAction =
  | 'STUDENT_CREATE'
  | 'STUDENT_UPDATE'
  | 'STUDENT_ARCHIVE'
  | 'BATCH_CREATE'
  | 'FAMILY_CREATE'
  | 'FAMILY_UPDATE'
  | 'OBLIGATION_GENERATE'
  | 'EVIDENCE_UPLOAD'
  | 'TRANSACTION_IMPORT'
  | 'TRANSACTION_MANUAL_CREATE'
  | 'TRANSACTION_MANUAL_VERIFY'
  | 'TRANSACTION_REVERSE'
  | 'ALLOCATION_CREATE'
  | 'ALLOCATION_REVERSE'
  | 'EXCEPTION_RESOLVE'
  | 'DEMO_DATA_RESET';

export interface IAuditEvent extends Document {
  teacherId: Types.ObjectId;
  actorId?: Types.ObjectId;
  actorName: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditEventSchema = new Schema<IAuditEvent>(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    actorName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true },
    targetId: { type: String },
    beforeState: { type: Schema.Types.Mixed },
    afterState: { type: Schema.Types.Mixed },
    reason: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditEventSchema.index({ teacherId: 1, timestamp: -1 });

export const AuditEvent = mongoose.model<IAuditEvent>('AuditEvent', AuditEventSchema);
