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
  const batch1 = await Batch.create({
    teacherId: tId,
    name: 'Bharatnatyam - Beginners (Batch A)',
    schedule: 'Mon, Wed, Fri (4:30 PM - 5:30 PM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  const batch2 = await Batch.create({
    teacherId: tId,
    name: 'Bharatnatyam - Intermediate (Batch B)',
    schedule: 'Tue, Thu, Sat (5:00 PM - 6:30 PM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  const batch3 = await Batch.create({
    teacherId: tId,
    name: 'Contemporary & Folk Dance (Weekend)',
    schedule: 'Sat & Sun (9:00 AM - 10:30 AM)',
    instructor: 'Kavita Menon',
    isActive: true,
  });

  const batch4 = await Batch.create({
    teacherId: tId,
    name: 'Kids Creative Movement (Under 8)',
    schedule: 'Saturday (11:00 AM - 12:00 PM)',
    instructor: 'Ananya Natarajan',
    isActive: true,
  });

  // 3. Create Families (Explicit sibling relationships)
  const familyPatel = await Family.create({
    teacherId: tId,
    name: 'Patel Family',
    guardianName: 'Rajesh Patel',
    guardianPhone: '+91 98200 45678',
    guardianEmail: 'rajesh.patel@gmail.com',
    notes: 'Father of Diya and Neil. Prefers paying via GPay in a single combined UPI transaction.',
  });

  const familyIyer = await Family.create({
    teacherId: tId,
    name: 'Iyer Family',
    guardianName: 'Subramanian Iyer',
    guardianPhone: '+91 98401 23456',
    guardianEmail: 's.iyer@yahoo.com',
    notes: 'Father of Aditi and Meenakshi. Both learning classical dance.',
  });

  // 4. Create Students (14 students across 4 batches)
  const studentsData = [
    // Patel siblings
    { name: 'Diya Patel', guardianName: 'Rajesh Patel', guardianPhone: '+91 98200 45678', batchId: batch1._id, familyId: familyPatel._id, monthlyFee: 1500 },
    { name: 'Neil Patel', guardianName: 'Rajesh Patel', guardianPhone: '+91 98200 45678', batchId: batch4._id, familyId: familyPatel._id, monthlyFee: 1500 },
    // Iyer siblings
    { name: 'Aditi Iyer', guardianName: 'Subramanian Iyer', guardianPhone: '+91 98401 23456', batchId: batch2._id, familyId: familyIyer._id, monthlyFee: 2000 },
    { name: 'Meenakshi Iyer', guardianName: 'Subramanian Iyer', guardianPhone: '+91 98401 23456', batchId: batch1._id, familyId: familyIyer._id, monthlyFee: 1500 },
    // Individual students
    { name: 'Aarav Sharma', guardianName: 'Priya Sharma', guardianPhone: '+91 98111 22334', batchId: batch1._id, monthlyFee: 1500 },
    { name: 'Ananya Verma', guardianName: 'Sunita Verma', guardianPhone: '+91 98333 44556', batchId: batch2._id, monthlyFee: 2000 },
    { name: 'Rohan Rao', guardianName: 'Vikram Rao', guardianPhone: '+91 98444 55667', batchId: batch1._id, monthlyFee: 1500 },
    { name: 'Ishaan Joshi', guardianName: 'Meera Joshi', guardianPhone: '+91 98555 66778', batchId: batch2._id, monthlyFee: 2000 },
    { name: 'Tanvi Kulkarni', guardianName: 'Amit Kulkarni', guardianPhone: '+91 98666 77889', batchId: batch3._id, monthlyFee: 1800 },
    { name: 'Siddharth Nair', guardianName: 'Deepa Nair', guardianPhone: '+91 98777 88990', batchId: batch3._id, monthlyFee: 1800 },
    { name: 'Rhea Deshmukh', guardianName: 'Sanjay Deshmukh', guardianPhone: '+91 98888 99001', batchId: batch4._id, monthlyFee: 1200 },
    { name: 'Arjun Reddy', guardianName: 'Radhika Reddy', guardianPhone: '+91 98999 11223', batchId: batch1._id, monthlyFee: 1500 },
    { name: 'Pooja Hegde', guardianName: 'Ganesh Hegde', guardianPhone: '+91 97111 33445', batchId: batch2._id, monthlyFee: 2000 },
    { name: 'Vivaan Kapoor', guardianName: 'Neha Kapoor', guardianPhone: '+91 97222 44556', batchId: batch4._id, monthlyFee: 1200 },
  ];

  const students = await Student.create(
    studentsData.map(s => ({
      ...s,
      teacherId: tId,
      joiningDate: new Date('2026-06-01'),
      isActive: true,
      notes: 'Demo student record',
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

  // Case A: Single Student Paid in Full (Aarav Sharma - ₹1,500)
  const aarav = sMap.get('Aarav Sharma')!;
  const aaravOb = obMap.get(aarav._id.toString())!;
  const txnAarav = await PaymentTransaction.create({
    teacherId: tId,
    transactionReference: '428719283741',
    amount: 1500,
    paymentDate: new Date('2026-10-02T10:15:00Z'),
    payerName: 'Priya Sharma',
    description: 'UPI/428719283741/Aarav Sharma Oct fee',
    source: 'csv_import',
    status: 'teacher_verified',
    verifiedAt: new Date('2026-10-02T11:00:00Z'),
    verifiedBy: 'Ananya Natarajan',
    verificationReason: 'Verified against bank credit SMS and WhatsApp receipt',
    allocatedAmount: 1500,
    unallocatedAmount: 0,
    isSiblingPayment: false,
  });

  await PaymentAllocation.create({
    teacherId: tId,
    transactionId: txnAarav._id,
    studentId: aarav._id,
    obligationId: aaravOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1500,
    notes: 'Full payment allocated',
  });
  aaravOb.allocatedAmount = 1500;
  aaravOb.outstandingBalance = 0;
  aaravOb.status = 'paid';
  await aaravOb.save();

  // Case B: Sibling Payment (Rajesh Patel paid ₹3,000 for Diya [₹1,500] and Neil [₹1,500])
  const diya = sMap.get('Diya Patel')!;
  const neil = sMap.get('Neil Patel')!;
  const diyaOb = obMap.get(diya._id.toString())!;
  const neilOb = obMap.get(neil._id.toString())!;

  const txnPatel = await PaymentTransaction.create({
    teacherId: tId,
    transactionReference: '428719283742',
    amount: 3000,
    paymentDate: new Date('2026-10-03T14:30:00Z'),
    payerName: 'Rajesh Patel',
    description: 'UPI/428719283742/Diya and Neil Patel Oct fees',
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
    transactionId: txnPatel._id,
    studentId: diya._id,
    obligationId: diyaOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1500,
    notes: 'Sibling allocation: Diya Patel (Batch A)',
  });
  diyaOb.allocatedAmount = 1500;
  diyaOb.outstandingBalance = 0;
  diyaOb.status = 'paid';
  await diyaOb.save();

  await PaymentAllocation.create({
    teacherId: tId,
    transactionId: txnPatel._id,
    studentId: neil._id,
    obligationId: neilOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1500,
    notes: 'Sibling allocation: Neil Patel (Kids Creative)',
  });
  neilOb.allocatedAmount = 1500;
  neilOb.outstandingBalance = 0;
  neilOb.status = 'paid';
  await neilOb.save();

  // Case C: Partial Payment (Ananya Verma fee is ₹2,000, paid ₹1,000)
  const ananyaV = sMap.get('Ananya Verma')!;
  const ananyaOb = obMap.get(ananyaV._id.toString())!;
  const txnPartial = await PaymentTransaction.create({
    teacherId: tId,
    transactionReference: '428719283743',
    amount: 1000,
    paymentDate: new Date('2026-10-04T09:00:00Z'),
    payerName: 'Sunita Verma',
    description: 'UPI/428719283743/Ananya part fee',
    source: 'csv_import',
    status: 'teacher_verified',
    verifiedAt: new Date('2026-10-04T10:00:00Z'),
    verifiedBy: 'Ananya Natarajan',
    verificationReason: 'Part payment agreed with parent',
    allocatedAmount: 1000,
    unallocatedAmount: 0,
    isSiblingPayment: false,
  });

  await PaymentAllocation.create({
    teacherId: tId,
    transactionId: txnPartial._id,
    studentId: ananyaV._id,
    obligationId: ananyaOb._id,
    billingMonth: currentMonth,
    allocatedAmount: 1000,
    notes: 'Partial payment 1 of 2',
  });
  ananyaOb.allocatedAmount = 1000;
  ananyaOb.outstandingBalance = 1000;
  ananyaOb.status = 'partially_paid';
  await ananyaOb.save();

  // Case D: Unallocated Confirmed Payment (Unknown payer or awaiting allocation - ₹2,500)
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
    notes: 'Payer name not in academy roster. Waiting for parent to claim.',
  });

  // 7. Payment Evidence Items (Simulated WhatsApp claims)
  const evidence1 = await PaymentEvidence.create({
    teacherId: tId,
    source: 'whatsapp_screenshot',
    rawText: 'Hi Maam, paid October fees ₹1,500 for Rohan Rao. UPI Ref: 428719283744',
    claimedStudentName: 'Rohan Rao',
    claimedAmount: 1500,
    claimedDate: '2026-10-05',
    claimedTransactionReference: '428719283744',
    confidenceScore: 0.95,
    extractionDetails: {
      student_names: ['Rohan Rao'],
      claimed_amount: 1500,
      claimed_date: '2026-10-05',
      claimed_transaction_reference: '428719283744',
      claimed_status: 'claimed_successful',
      confidence: 0.95,
      missing_fields: [],
      explanation: 'Extracted student name, amount ₹1,500, and 12-digit UTR ref from WhatsApp message.',
    },
    extractedBy: 'rule_based_fallback',
    status: 'pending_review',
  });

  const evidence2 = await PaymentEvidence.create({
    teacherId: tId,
    source: 'whatsapp_text',
    rawText: 'Sent ₹2,000 for Ishaan Bharatanatyam class via PhonePe today.',
    claimedStudentName: 'Ishaan Joshi',
    claimedAmount: 2000,
    claimedDate: '2026-10-06',
    confidenceScore: 0.7,
    extractionDetails: {
      student_names: ['Ishaan Joshi'],
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

  // 8. Exceptions (At least 3 realistic cases)

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
    notes: 'Parent submitted screenshot claiming ₹2,000 for Aditi Iyer, but actual fee obligation is ₹2,000 and bank credited ₹1,500.',
    recommendedAction: 'Check bank statement for actual credit amount or contact guardian Subramanian Iyer.',
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
    notes: 'Payment screenshot received for Rohan Rao with UTR 428719283744, but this reference has not appeared in bank statement export.',
    recommendedAction: 'Import latest bank CSV statement or request bank payment confirmation SMS from parent.',
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
