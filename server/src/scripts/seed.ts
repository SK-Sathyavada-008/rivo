import { Types } from 'mongoose';
import { Batch } from '../models/Batch.js';
import { Family } from '../models/Family.js';
import { Student } from '../models/Student.js';
import { FeeObligation } from '../models/FeeObligation.js';
import { PaymentEvidence } from '../models/PaymentEvidence.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import { ExceptionCase } from '../models/ExceptionCase.js';
import { AuditEvent } from '../models/AuditEvent.js';
import { recordAudit } from '../services/auditService.js';

export async function seedDemoDataForTeacher(teacherId: Types.ObjectId | string): Promise<void> {
  const tId = new Types.ObjectId(teacherId);

  // 1. Clean existing records for this teacher
  await Promise.all([
    Batch.deleteMany({ teacherId: tId }),
    Family.deleteMany({ teacherId: tId }),
    Student.deleteMany({ teacherId: tId }),
    FeeObligation.deleteMany({ teacherId: tId }),
    PaymentEvidence.deleteMany({ teacherId: tId }),
    PaymentTransaction.deleteMany({ teacherId: tId }),
    PaymentAllocation.deleteMany({ teacherId: tId }),
    ExceptionCase.deleteMany({ teacherId: tId }),
    AuditEvent.deleteMany({ teacherId: tId }),
  ]);

  console.log(`[Seed] Cleaned old records for teacher ${tId}`);

  // 2. Create Batches
  const batchSuperSeniors = await Batch.create({
    teacherId: tId,
    name: 'Super Seniors',
    schedule: 'Mon, Wed, Fri (6:00 PM - 7:30 PM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  const batchSeniors = await Batch.create({
    teacherId: tId,
    name: 'Seniors',
    schedule: 'Tue, Thu, Sat (5:30 PM - 7:00 PM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  const batchJuniors = await Batch.create({
    teacherId: tId,
    name: 'Juniors',
    schedule: 'Mon, Wed, Fri (4:30 PM - 5:30 PM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  const batchSubJuniors = await Batch.create({
    teacherId: tId,
    name: 'Sub Juniors',
    schedule: 'Saturday & Sunday (10:00 AM - 11:00 AM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  const batchEIPL = await Batch.create({
    teacherId: tId,
    name: 'EIPL',
    schedule: 'Mon & Thu (7:00 PM - 8:30 PM)',
    instructor: 'Kavita Menon',
    isActive: true,
  });

  const batchEIPLAdults = await Batch.create({
    teacherId: tId,
    name: 'EIPL Adults',
    schedule: 'Sat & Sun (8:00 AM - 9:30 AM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  // 3. Create Families (Explicit sibling relationships)
  const familyRao = await Family.create({
    teacherId: tId,
    name: 'Rao Family',
    guardianName: 'Srinivas Rao',
    guardianPhone: '+91 98455 55667',
    guardianEmail: 'srinivas.rao@gmail.com',
    notes: 'Father of Laalasa and Lahari. Pays via UPI in a single combined payment.',
  });

  // 4. Create Students (Keerthana, Roopa, Alekhya, Priyanka, Laalasa, Lahari, Amritha)
  const studentsData = [
    {
      name: 'Keerthana',
      guardianName: 'K. Narayanan',
      guardianPhone: '+91 98451 11223',
      batchId: batchSuperSeniors._id,
      monthlyFee: 1500,
    },
    {
      name: 'Roopa',
      guardianName: 'S. Venkat',
      guardianPhone: '+91 98452 22334',
      batchId: batchSeniors._id,
      monthlyFee: 2000,
    },
    {
      name: 'Alekhya',
      guardianName: 'M. Prasad',
      guardianPhone: '+91 98453 33445',
      batchId: batchJuniors._id,
      monthlyFee: 1500,
    },
    {
      name: 'Priyanka',
      guardianName: 'R. Sharma',
      guardianPhone: '+91 98454 44556',
      batchId: batchSubJuniors._id,
      monthlyFee: 1500,
    },
    {
      name: 'Laalasa',
      guardianName: 'Srinivas Rao',
      guardianPhone: '+91 98455 55667',
      batchId: batchJuniors._id,
      familyId: familyRao._id,
      monthlyFee: 1500,
    },
    {
      name: 'Lahari',
      guardianName: 'Srinivas Rao',
      guardianPhone: '+91 98455 55667',
      batchId: batchSubJuniors._id,
      familyId: familyRao._id,
      monthlyFee: 1500,
    },
    {
      name: 'Amritha',
      guardianName: 'Amritha (Self)',
      guardianPhone: '+91 98456 66778',
      batchId: batchEIPLAdults._id,
      monthlyFee: 2000,
    },
  ];

  const students = await Student.create(
    studentsData.map(s => ({
      ...s,
      teacherId: tId,
      joiningDate: new Date('2026-06-01'),
      isActive: true,
      notes: 'Sample student record',
    }))
  );

  // Map students by name for easy lookup
  const sMap = new Map(students.map(s => [s.name, s]));

  // 5. Create Monthly Fee Obligations for Current Month ("2026-10")
  const currentMonth = '2026-10';
  const obligations = [];
  for (const s of students) {
    const ob = await FeeObligation.create({
      teacherId: tId,
      studentId: s._id,
      batchId: s.batchId,
      billingMonth: currentMonth,
      amountDue: s.monthlyFee,
      allocatedAmount: 0,
      outstandingBalance: s.monthlyFee,
      status: 'unpaid',
      notes: `October 2026 fee for ${s.name}`,
    });
    obligations.push(ob);
  }
  const obMap = new Map(obligations.map(o => [o.studentId.toString(), o]));

  // 6. Create Confirmed/Verified Transactions & Allocations

  // Case A: Single Student Paid in Full (Keerthana - ₹1,500)
  const keerthana = sMap.get('Keerthana')!;
  const keerthanaOb = obMap.get(keerthana._id.toString())!;
  const txnKeerthana = await PaymentTransaction.create({
    teacherId: tId,
    transactionReference: '428719283741',
    amount: 1500,
    paymentDate: new Date('2026-10-02T10:15:00Z'),
    payerName: 'K. Narayanan',
    description: 'UPI/428719283741/Keerthana Oct fee',
    source: 'csv_import',
    status: 'teacher_verified',
    verifiedAt: new Date('2026-10-02T11:00:00Z'),
    verifiedBy: 'Ananya Natarajan',
    verificationReason: 'Verified against bank credit and WhatsApp receipt',
    allocatedAmount: 1500,
    unallocatedAmount: 0,
    isSiblingPayment: false,
  });

  await PaymentAllocation.create({
    teacherId: tId,
    transactionId: txnKeerthana._id,
    studentId: keerthana._id,
    obligationId: keerthanaOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1500,
    notes: 'Full payment allocated for Keerthana',
  });
  keerthanaOb.allocatedAmount = 1500;
  keerthanaOb.outstandingBalance = 0;
  keerthanaOb.status = 'paid';
  await keerthanaOb.save();

  // Case B: Sibling Payment (Srinivas Rao paid ₹3,000 for Laalasa [₹1,500] and Lahari [₹1,500])
  const laalasa = sMap.get('Laalasa')!;
  const lahari = sMap.get('Lahari')!;
  const laalasaOb = obMap.get(laalasa._id.toString())!;
  const lahariOb = obMap.get(lahari._id.toString())!;

  const txnRao = await PaymentTransaction.create({
    teacherId: tId,
    transactionReference: '428719283742',
    amount: 3000,
    paymentDate: new Date('2026-10-03T14:30:00Z'),
    payerName: 'Srinivas Rao',
    description: 'UPI/428719283742/Laalasa and Lahari Oct fees',
    source: 'csv_import',
    status: 'teacher_verified',
    verifiedAt: new Date('2026-10-03T15:00:00Z'),
    verifiedBy: 'Ananya Natarajan',
    verificationReason: 'Family payment verified for 2 siblings',
    allocatedAmount: 3000,
    unallocatedAmount: 0,
    isSiblingPayment: true,
  });

  await PaymentAllocation.create({
    teacherId: tId,
    transactionId: txnRao._id,
    studentId: laalasa._id,
    obligationId: laalasaOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1500,
    notes: 'Sibling allocation: Laalasa (Juniors)',
  });
  laalasaOb.allocatedAmount = 1500;
  laalasaOb.outstandingBalance = 0;
  laalasaOb.status = 'paid';
  await laalasaOb.save();

  await PaymentAllocation.create({
    teacherId: tId,
    transactionId: txnRao._id,
    studentId: lahari._id,
    obligationId: lahariOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1500,
    notes: 'Sibling allocation: Lahari (Sub Juniors)',
  });
  lahariOb.allocatedAmount = 1500;
  lahariOb.outstandingBalance = 0;
  lahariOb.status = 'paid';
  await lahariOb.save();

  // Case C: Partial Payment (Roopa fee is ₹2,000, paid ₹1,000)
  const roopa = sMap.get('Roopa')!;
  const roopaOb = obMap.get(roopa._id.toString())!;
  const txnPartial = await PaymentTransaction.create({
    teacherId: tId,
    transactionReference: '428719283743',
    amount: 1000,
    paymentDate: new Date('2026-10-04T09:00:00Z'),
    payerName: 'S. Venkat',
    description: 'UPI/428719283743/Roopa part fee',
    source: 'csv_import',
    status: 'teacher_verified',
    verifiedAt: new Date('2026-10-04T10:00:00Z'),
    verifiedBy: 'Ananya Natarajan',
    verificationReason: 'Part payment agreed with guardian',
    allocatedAmount: 1000,
    unallocatedAmount: 0,
    isSiblingPayment: false,
  });

  await PaymentAllocation.create({
    teacherId: tId,
    transactionId: txnPartial._id,
    studentId: roopa._id,
    obligationId: roopaOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1000,
    notes: 'Partial payment 1 of 2',
  });
  roopaOb.allocatedAmount = 1000;
  roopaOb.outstandingBalance = 1000;
  roopaOb.status = 'partially_paid';
  await roopaOb.save();

  // Case D: Unallocated Confirmed Payment (Unknown sender - ₹2,500)
  const txnUnallocated = await PaymentTransaction.create({
    teacherId: tId,
    transactionReference: '428719283799',
    amount: 2500,
    paymentDate: new Date('2026-10-07T16:20:00Z'),
    payerName: 'Unknown Sender (HDFC Bank)',
    description: 'UPI/428719283799/Dance class fee',
    source: 'csv_import',
    status: 'teacher_verified',
    verifiedAt: new Date('2026-10-07T17:00:00Z'),
    verifiedBy: 'Ananya Natarajan',
    verificationReason: 'Money credited to academy account, student identity pending verification',
    allocatedAmount: 0,
    unallocatedAmount: 2500,
    isSiblingPayment: false,
    notes: 'Payer name not in academy roster. Waiting for student/parent to claim.',
  });

  // 7. Payment Evidence Items (Simulated WhatsApp claims)
  const evidence1 = await PaymentEvidence.create({
    teacherId: tId,
    source: 'whatsapp_screenshot',
    rawText: 'Hi Maam, paid October fees ₹1,500 for Alekhya. UPI Ref: 428719283744',
    claimedStudentName: 'Alekhya',
    claimedAmount: 1500,
    claimedDate: '2026-10-05',
    claimedTransactionReference: '428719283744',
    confidenceScore: 0.95,
    extractionDetails: {
      student_names: ['Alekhya'],
      claimed_amount: 1500,
      claimed_date: '2026-10-05',
      claimed_transaction_reference: '428719283744',
      claimed_status: 'claimed_successful',
      confidence: 0.95,
      missing_fields: [],
      explanation: 'Extracted student name Alekhya, amount ₹1,500, and 12-digit UTR ref from WhatsApp message.',
    },
    extractedBy: 'rule_based_fallback',
    status: 'pending_review',
  });

  const evidence2 = await PaymentEvidence.create({
    teacherId: tId,
    source: 'whatsapp_text',
    rawText: 'Sent ₹2,000 for Amritha EIPL Adults class via PhonePe today.',
    claimedStudentName: 'Amritha',
    claimedAmount: 2000,
    claimedDate: '2026-10-06',
    confidenceScore: 0.7,
    extractionDetails: {
      student_names: ['Amritha'],
      claimed_amount: 2000,
      claimed_date: '2026-10-06',
      claimed_transaction_reference: null,
      claimed_status: 'claimed_successful',
      confidence: 0.7,
      missing_fields: ['claimed_transaction_reference'],
      explanation: 'Extracted student name and amount. Missing UPI UTR reference.',
    },
    extractedBy: 'rule_based_fallback',
    status: 'pending_review',
  });

  // 8. Exceptions
  // Exception 1: Unknown Student
  await ExceptionCase.create({
    teacherId: tId,
    reason: 'unknown_student',
    status: 'open',
    claimedAmount: 1800,
    claimedDate: '2026-10-06',
    evidenceSource: 'whatsapp_text',
    notes: 'Parent message: "Paid ₹1,800 for Kavya dance class". No student named "Kavya" in academy roster.',
    recommendedAction: 'Verify if Kavya is a new admission or if guardian used a nickname.',
  });

  // Exception 2: Amount Mismatch
  await ExceptionCase.create({
    teacherId: tId,
    reason: 'amount_mismatch',
    status: 'open',
    claimedAmount: 2000,
    claimedDate: '2026-10-05',
    evidenceSource: 'whatsapp_screenshot',
    notes: 'Guardian submitted screenshot claiming ₹2,000 for Priyanka, but fee obligation is ₹1,500 and bank credited ₹1,500.',
    recommendedAction: 'Check bank statement for actual credit amount or contact guardian R. Sharma.',
  });

  // Exception 3: Evidence without Verified Transaction
  await ExceptionCase.create({
    teacherId: tId,
    reason: 'evidence_without_transaction',
    status: 'open',
    evidenceId: evidence1._id,
    claimedAmount: 1500,
    claimedDate: '2026-10-05',
    evidenceSource: 'whatsapp_screenshot',
    notes: 'Payment screenshot received for Alekhya with UTR 428719283744, but this reference has not appeared in bank statement export.',
    recommendedAction: 'Import latest bank CSV statement or request bank payment confirmation SMS from guardian.',
  });

  // Exception 4: Unallocated Amount
  await ExceptionCase.create({
    teacherId: tId,
    reason: 'unallocated_amount',
    status: 'open',
    transactionId: txnUnallocated._id,
    claimedAmount: 2500,
    evidenceSource: 'csv_import',
    notes: '₹2,500 credited from Unknown Sender (HDFC Bank) with no matching student identified.',
    recommendedAction: 'Post a notification in WhatsApp announcement group asking who transferred ₹2,500 on 07 Oct.',
  });

  // 9. Initial Audit Record
  await recordAudit({
    teacherId: tId,
    actorName: 'System (Demo Seeder)',
    action: 'DEMO_DATA_RESET',
    targetType: 'System',
    reason: 'Initialized complete demo academy dataset with students, obligations, sibling payments, and exceptions.',
  });

  console.log(`[Seed] Demo data successfully seeded for teacher ${tId}`);
}
