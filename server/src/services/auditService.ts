import { AuditEvent, AuditAction } from '../models/AuditEvent.js';
import { Types } from 'mongoose';

interface RecordAuditParams {
  teacherId: Types.ObjectId | string;
  actorId?: Types.ObjectId | string;
  actorName: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
}

export async function recordAudit(params: RecordAuditParams): Promise<void> {
  try {
    await AuditEvent.create({
      teacherId: new Types.ObjectId(params.teacherId),
      actorId: params.actorId ? new Types.ObjectId(params.actorId) : undefined,
      actorName: params.actorName,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      beforeState: params.beforeState,
      afterState: params.afterState,
      reason: params.reason,
      metadata: params.metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    // Audit logging should not crash the primary flow, but must log an error
    console.error('[AuditService] Failed to record audit event:', error);
  }
}
