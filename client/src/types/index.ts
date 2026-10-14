export interface User {
  id: string;
  email: string;
  name: string;
  academyName: string;
  upiId?: string;
  phone?: string;
  isDemo?: boolean;
}

export interface Batch {
  _id: string;
  name: string;
  schedule?: string;
  instructor?: string;
  isActive: boolean;
  studentCount?: number;
}

export interface Family {
  _id: string;
  name: string;
  guardianName: string;
  guardianPhone?: string;
  guardianEmail?: string;
  notes?: string;
  students?: { _id: string; name: string; monthlyFee: number; batchId: string }[];
}

export interface Student {
  _id: string;
  name: string;
  guardianName?: string;
  guardianPhone?: string;
  batchId: { _id: string; name: string; schedule?: string } | string;
  familyId?: { _id: string; name: string; guardianName?: string; guardianPhone?: string } | string;
  monthlyFee: number;
  joiningDate: string;
  isActive: boolean;
  notes?: string;
}

export type ObligationStatus = 'unpaid' | 'partially_paid' | 'paid' | 'overpaid';

export interface FeeObligation {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    guardianName?: string;
    guardianPhone?: string;
    familyId?: { _id: string; name: string };
  };
  batchId: { _id: string; name: string };
  billingMonth: string;
  amountDue: number;
  allocatedAmount: number;
  outstandingBalance: number;
  status: ObligationStatus;
  allocations?: PaymentAllocation[];
}

export type TransactionStatus =
  | 'claimed'
  | 'pending_review'
  | 'teacher_verified'
  | 'provider_verified'
  | 'rejected'
  | 'reversed';

export interface PaymentTransaction {
  _id: string;
  transactionReference?: string;
  amount: number;
  paymentDate: string;
  payerName?: string;
  payerPhone?: string;
  description?: string;
  source: 'csv_import' | 'manual_entry' | 'provider_webhook';
  status: TransactionStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationReason?: string;
  allocatedAmount: number;
  unallocatedAmount: number;
  isSiblingPayment: boolean;
  notes?: string;
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  _id: string;
  transactionId: string | PaymentTransaction;
  studentId: string | { _id: string; name: string };
  obligationId: string | { _id: string; billingMonth: string };
  billingMonth: string;
  allocatedAmount: number;
  allocationDate: string;
  notes?: string;
}

export interface PaymentEvidence {
  _id: string;
  source: 'whatsapp_screenshot' | 'whatsapp_text' | 'manual_upload' | 'android_notification_claim';
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
    confidence: number;
    missing_fields: string[];
    explanation: string;
  };
  extractedBy: 'gemma_ai' | 'rule_based_fallback' | 'manual';
  status: 'pending_review' | 'matched' | 'verified_by_teacher' | 'rejected' | 'dismissed';
  matchedTransactionId?: any;
  matchedStudentId?: any;
  createdAt: string;
}

export interface ExceptionCase {
  _id: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  evidenceId?: PaymentEvidence;
  transactionId?: PaymentTransaction;
  studentId?: Student;
  claimedAmount?: number;
  claimedDate?: string;
  evidenceSource?: string;
  notes?: string;
  recommendedAction: string;
  resolutionAction?: string;
  resolutionReason?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditEvent {
  _id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId?: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  timestamp: string;
}
