import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { ENV } from '../config/env.js';
import { connectDB } from '../config/db.js';

// Models
import { User } from '../models/User.js';
import { Batch } from '../models/Batch.js';
import { Family } from '../models/Family.js';
import { Student } from '../models/Student.js';
import { FeeObligation } from '../models/FeeObligation.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentAllocation } from '../models/PaymentAllocation.js';
import { PaymentEvidence } from '../models/PaymentEvidence.js';
import { ExceptionCase } from '../models/ExceptionCase.js';
import { AuditEvent } from '../models/AuditEvent.js';

// Services
import { generateMonthlyObligations, recalculateObligationBalance } from '../services/ledgerService.js';
import { allocateTransaction, reverseTransaction, reconcileEvidence } from '../services/reconciliationService.js';
import { importTransactionsFromCsv, previewCsvContent } from '../services/csvService.js';
import { extractEvidenceData } from '../services/aiService.js';

describe('Rivo Fee Reconciliation Business Rules Suite', () => {
  let teacherAId: Types.ObjectId;
  let teacherBId: Types.ObjectId;
  let batchA: any;
  let student1: any; // ₹1,500
  let student2: any; // ₹1,500 (sibling)
  let student3: any; // ₹2,000
  let familyPatel: any;

  beforeAll(async () => {
    await connectDB();

    // Create test teachers
    teacherAId = new Types.ObjectId();
    teacherBId = new Types.ObjectId();

    await User.create([
      {
        _id: teacherAId,
        email: `test.teacher.a.${Date.now()}@rivo.app`,
        passwordHash: 'dummyhash',
        name: 'Teacher A',
        academyName: 'Academy A',
        isDemo: false,
      },
      {
        _id: teacherBId,
        email: `test.teacher.b.${Date.now()}@rivo.app`,
        passwordHash: 'dummyhash',
        name: 'Teacher B',
        academyName: 'Academy B',
        isDemo: false,
      },
    ]);

    batchA = await Batch.create({
      teacherId: teacherAId,
      name: 'Batch Test',
      isActive: true,
    });

    familyPatel = await Family.create({
      teacherId: teacherAId,
      name: 'Patel Family',
      guardianName: 'Rajesh Patel',
    });

    student1 = await Student.create({
      teacherId: teacherAId,
      name: 'Diya Patel',
      batchId: batchA._id,
      familyId: familyPatel._id,
      monthlyFee: 1500,
      isActive: true,
    });

    student2 = await Student.create({
      teacherId: teacherAId,
      name: 'Neil Patel',
      batchId: batchA._id,
      familyId: familyPatel._id,
      monthlyFee: 1500,
      isActive: true,
    });

    student3 = await Student.create({
      teacherId: teacherAId,
      name: 'Aarav Sharma',
      batchId: batchA._id,
      monthlyFee: 2000,
      isActive: true,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await Promise.all([
      User.deleteMany({ _id: { $in: [teacherAId, teacherBId] } }),
      Batch.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      Family.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      Student.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      FeeObligation.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      PaymentTransaction.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      PaymentAllocation.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      PaymentEvidence.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      ExceptionCase.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
      AuditEvent.deleteMany({ teacherId: { $in: [teacherAId, teacherBId] } }),
    ]);
    await mongoose.disconnect();
  });

  // TEST 13: Monthly obligation generation is idempotent
  it('13. Monthly obligation generation is idempotent (running twice produces no duplicates)', async () => {
    const month = '2026-11';
    const firstRun = await generateMonthlyObligations(teacherAId, month, 'System');
    expect(firstRun.createdCount).toBe(3); // 3 students

    const secondRun = await generateMonthlyObligations(teacherAId, month, 'System');
    expect(secondRun.createdCount).toBe(0);
    expect(secondRun.existingCount).toBe(3);

    const totalObs = await FeeObligation.countDocuments({ teacherId: teacherAId, billingMonth: month });
    expect(totalObs).toBe(3);
  });

  // TEST 1: One student pays the full monthly fee
  it('1. One student pays the full monthly fee', async () => {
    const month = '2026-11';
    const ob = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student3._id, billingMonth: month });
    expect(ob).toBeDefined();

    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `TXN-FULL-${Date.now()}`,
      amount: 2000,
      status: 'teacher_verified',
      verifiedBy: 'Teacher A',
      source: 'manual_entry',
    });

    const result = await allocateTransaction({
      teacherId: teacherAId,
      transactionId: txn._id,
      items: [{ studentId: student3._id.toString(), obligationId: ob!._id.toString(), billingMonth: month, amount: 2000 }],
      actorName: 'Teacher A',
    });

    expect(result.transaction.allocatedAmount).toBe(2000);
    expect(result.transaction.unallocatedAmount).toBe(0);

    const updatedOb = await FeeObligation.findById(ob!._id);
    expect(updatedOb?.status).toBe('paid');
    expect(updatedOb?.allocatedAmount).toBe(2000);
    expect(updatedOb?.outstandingBalance).toBe(0);
  });

  // TEST 2: One student makes a partial payment
  it('2. One student makes a partial payment', async () => {
    const month = '2026-11';
    const ob = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student1._id, billingMonth: month });

    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `TXN-PART-${Date.now()}`,
      amount: 1000, // Fee is 1500
      status: 'teacher_verified',
      verifiedBy: 'Teacher A',
      source: 'manual_entry',
    });

    await allocateTransaction({
      teacherId: teacherAId,
      transactionId: txn._id,
      items: [{ studentId: student1._id.toString(), obligationId: ob!._id.toString(), billingMonth: month, amount: 1000 }],
      actorName: 'Teacher A',
    });

    const updatedOb = await FeeObligation.findById(ob!._id);
    expect(updatedOb?.status).toBe('partially_paid');
    expect(updatedOb?.allocatedAmount).toBe(1000);
    expect(updatedOb?.outstandingBalance).toBe(500);
  });

  // TEST 3: A parent pays ₹3,000 for two siblings with ₹1,500 fees each
  it('3. Sibling payment: Parent pays ₹3,000 for two siblings with ₹1,500 fees each', async () => {
    const month = '2026-12';
    await generateMonthlyObligations(teacherAId, month, 'System');

    const ob1 = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student1._id, billingMonth: month });
    const ob2 = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student2._id, billingMonth: month });

    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `TXN-SIB-${Date.now()}`,
      amount: 3000,
      status: 'teacher_verified',
      verifiedBy: 'Teacher A',
      source: 'csv_import',
    });

    const result = await allocateTransaction({
      teacherId: teacherAId,
      transactionId: txn._id,
      items: [
        { studentId: student1._id.toString(), obligationId: ob1!._id.toString(), billingMonth: month, amount: 1500 },
        { studentId: student2._id.toString(), obligationId: ob2!._id.toString(), billingMonth: month, amount: 1500 },
      ],
      actorName: 'Teacher A',
      notes: 'Sibling allocation for Diya and Neil Patel',
    });

    expect(result.transaction.isSiblingPayment).toBe(true);
    expect(result.transaction.allocatedAmount).toBe(3000);
    expect(result.transaction.unallocatedAmount).toBe(0);

    const updated1 = await FeeObligation.findById(ob1!._id);
    const updated2 = await FeeObligation.findById(ob2!._id);
    expect(updated1?.status).toBe('paid');
    expect(updated2?.status).toBe('paid');
  });

  // TEST 4: A payment covers multiple billing months
  it('4. A payment covers multiple billing months (advance payment)', async () => {
    const m1 = '2027-01';
    const m2 = '2027-02';
    await generateMonthlyObligations(teacherAId, m1, 'System');
    await generateMonthlyObligations(teacherAId, m2, 'System');

    const obM1 = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student3._id, billingMonth: m1 });
    const obM2 = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student3._id, billingMonth: m2 });

    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `TXN-MULTI-${Date.now()}`,
      amount: 4000, // covers 2 months at 2000 each
      status: 'teacher_verified',
      verifiedBy: 'Teacher A',
      source: 'manual_entry',
    });

    await allocateTransaction({
      teacherId: teacherAId,
      transactionId: txn._id,
      items: [
        { studentId: student3._id.toString(), obligationId: obM1!._id.toString(), billingMonth: m1, amount: 2000 },
        { studentId: student3._id.toString(), obligationId: obM2!._id.toString(), billingMonth: m2, amount: 2000 },
      ],
      actorName: 'Teacher A',
    });

    const up1 = await FeeObligation.findById(obM1!._id);
    const up2 = await FeeObligation.findById(obM2!._id);
    expect(up1?.status).toBe('paid');
    expect(up2?.status).toBe('paid');
  });

  // TEST 5: An unknown payer is sent to the exception queue
  it('5. An unknown payer is sent to the exception queue', async () => {
    const evidence = await PaymentEvidence.create({
      teacherId: teacherAId,
      source: 'whatsapp_text',
      rawText: 'Paid ₹1,800 for Anonymous Nonexistent Student',
      claimedStudentName: 'Unknown Random Person',
      claimedAmount: 1800,
      status: 'pending_review',
    });

    const recon = await reconcileEvidence(evidence._id, teacherAId);
    expect(recon.status).toBe('exception');
    expect(recon.reason).toBe('unknown_student');

    const exception = await ExceptionCase.findOne({ teacherId: teacherAId, evidenceId: evidence._id });
    expect(exception).toBeDefined();
    expect(exception?.reason).toBe('unknown_student');
    expect(exception?.status).toBe('open');
  });

  // TEST 6: A screenshot alone does not mark an obligation as paid
  it('6. A screenshot alone does not mark an obligation as paid', async () => {
    const month = '2027-03';
    await generateMonthlyObligations(teacherAId, month, 'System');
    const ob = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student3._id, billingMonth: month });

    // Upload evidence screenshot
    const evidence = await PaymentEvidence.create({
      teacherId: teacherAId,
      source: 'whatsapp_screenshot',
      rawText: 'Payment Successful ₹2,000 to Nrityanjali Dance',
      claimedStudentName: 'Aarav Sharma',
      claimedAmount: 2000,
      status: 'pending_review',
    });

    // Obligation must remain UNPAID! A screenshot is merely a claim
    const obAfterEvidence = await FeeObligation.findById(ob!._id);
    expect(obAfterEvidence?.status).toBe('unpaid');
    expect(obAfterEvidence?.allocatedAmount).toBe(0);
    expect(evidence.status).toBe('pending_review');
  });

  // TEST 7: Duplicate transaction references do not double-count a payment
  it('7. Duplicate transaction references do not double-count a payment', async () => {
    const utr = `DUP-UTR-${Date.now()}`;

    await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: utr,
      amount: 1500,
      status: 'teacher_verified',
      source: 'manual_entry',
    });

    // Attempting to create duplicate transaction reference must fail or be prevented
    let duplicateRejected = false;
    try {
      await PaymentTransaction.create({
        teacherId: teacherAId,
        transactionReference: utr,
        amount: 1500,
        status: 'teacher_verified',
        source: 'manual_entry',
      });
    } catch (e) {
      duplicateRejected = true;
    }

    expect(duplicateRejected).toBe(true);
  });

  // TEST 8: Re-importing the same CSV does not create duplicate transactions
  it('8. Re-importing the same CSV does not create duplicate transactions', async () => {
    const utr = `CSV-TEST-${Date.now()}`;
    const csvData = `Date,Reference/UTR,Amount,Payer Name,Description\n2026-10-10,${utr},1500,Test Parent,UPI/${utr}/Dance fee`;

    const run1 = await importTransactionsFromCsv(teacherAId, 'test1.csv', csvData);
    expect(run1.importedRows).toBe(1);
    expect(run1.skippedRows).toBe(0);

    // Re-import identical CSV
    const run2 = await importTransactionsFromCsv(teacherAId, 'test1_reimport.csv', csvData);
    expect(run2.importedRows).toBe(0);
    expect(run2.skippedRows).toBe(1); // Detected as duplicate and safely skipped!
  });

  // TEST 9: A payment is not allocated twice
  it('9. A payment cannot be allocated beyond its transaction amount', async () => {
    const month = '2027-04';
    await generateMonthlyObligations(teacherAId, month, 'System');
    const ob = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student1._id, billingMonth: month });

    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `TXN-ONCE-${Date.now()}`,
      amount: 1500,
      status: 'teacher_verified',
      source: 'manual_entry',
    });

    // Allocate full amount first time
    await allocateTransaction({
      teacherId: teacherAId,
      transactionId: txn._id,
      items: [{ studentId: student1._id.toString(), obligationId: ob!._id.toString(), billingMonth: month, amount: 1500 }],
      actorName: 'Teacher A',
    });

    // Attempt to allocate again
    let errorThrown = false;
    try {
      await allocateTransaction({
        teacherId: teacherAId,
        transactionId: txn._id,
        items: [{ studentId: student1._id.toString(), obligationId: ob!._id.toString(), billingMonth: month, amount: 1500 }],
        actorName: 'Teacher A',
      });
    } catch (e: any) {
      errorThrown = true;
      expect(e.message).toContain('exceeds transaction amount');
    }

    expect(errorThrown).toBe(true);
  });

  // TEST 10: An amount mismatch is flagged
  it('10. An amount mismatch is flagged in the exception queue', async () => {
    const utr = `UTR-MISMATCH-${Date.now()}`;
    // Bank confirmed transaction has ₹1,000
    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: utr,
      amount: 1000,
      status: 'teacher_verified',
      source: 'csv_import',
    });

    // Parent claims ₹2,000 for the same UTR
    const evidence = await PaymentEvidence.create({
      teacherId: teacherAId,
      source: 'whatsapp_screenshot',
      rawText: `Paid ₹2,000 Ref: ${utr}`,
      claimedAmount: 2000,
      claimedTransactionReference: utr,
      status: 'pending_review',
    });

    const recon = await reconcileEvidence(evidence._id, teacherAId);
    expect(recon.status).toBe('exception');
    expect(recon.reason).toBe('amount_mismatch');

    const exception = await ExceptionCase.findOne({ teacherId: teacherAId, reason: 'amount_mismatch', evidenceId: evidence._id });
    expect(exception).toBeDefined();
  });

  // TEST 11: A failed payment does not count as collected
  it('11. A failed payment does not count as collected', async () => {
    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `FAILED-TXN-${Date.now()}`,
      amount: 1500,
      status: 'rejected',
      source: 'manual_entry',
    });

    let allocationRejected = false;
    try {
      await allocateTransaction({
        teacherId: teacherAId,
        transactionId: txn._id,
        items: [{ studentId: student1._id.toString(), obligationId: new Types.ObjectId().toString(), billingMonth: '2027-05', amount: 1500 }],
        actorName: 'Teacher A',
      });
    } catch (e: any) {
      allocationRejected = true;
      expect(e.message).toContain('Cannot allocate unverified transaction');
    }

    expect(allocationRejected).toBe(true);
  });

  // TEST 12: A reversed payment updates the ledger correctly and creates an audit event
  it('12. A reversed payment unwinds allocations, updates ledger, and creates an audit event', async () => {
    const month = '2027-06';
    await generateMonthlyObligations(teacherAId, month, 'System');
    const ob = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student3._id, billingMonth: month });

    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `REV-TXN-${Date.now()}`,
      amount: 2000,
      status: 'teacher_verified',
      source: 'manual_entry',
    });

    await allocateTransaction({
      teacherId: teacherAId,
      transactionId: txn._id,
      items: [{ studentId: student3._id.toString(), obligationId: ob!._id.toString(), billingMonth: month, amount: 2000 }],
      actorName: 'Teacher A',
    });

    const beforeRev = await FeeObligation.findById(ob!._id);
    expect(beforeRev?.status).toBe('paid');

    // Execute reversal
    await reverseTransaction(teacherAId, txn._id, 'Bank chargeback / reversal', 'Teacher A');

    const afterRev = await FeeObligation.findById(ob!._id);
    expect(afterRev?.status).toBe('unpaid');
    expect(afterRev?.allocatedAmount).toBe(0);
    expect(afterRev?.outstandingBalance).toBe(2000);

    const audit = await AuditEvent.findOne({
      teacherId: teacherAId,
      action: 'TRANSACTION_REVERSE',
      targetId: txn._id.toString(),
    });
    expect(audit).toBeDefined();
    expect(audit?.reason).toBe('Bank chargeback / reversal');
  });

  // TEST 14: An allocation failure does not partially update related records
  it('14. An allocation failure does not partially update related records', async () => {
    const month = '2027-07';
    await generateMonthlyObligations(teacherAId, month, 'System');
    const ob1 = await FeeObligation.findOne({ teacherId: teacherAId, studentId: student1._id, billingMonth: month });

    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `FAIL-TXN-${Date.now()}`,
      amount: 1500,
      status: 'teacher_verified',
      source: 'manual_entry',
    });

    // Propose items with invalid second obligation ID
    let failed = false;
    try {
      await allocateTransaction({
        teacherId: teacherAId,
        transactionId: txn._id,
        items: [
          { studentId: student1._id.toString(), obligationId: ob1!._id.toString(), billingMonth: month, amount: 1500 },
          { studentId: student2._id.toString(), obligationId: new Types.ObjectId().toString(), billingMonth: month, amount: 1500 },
        ],
        actorName: 'Teacher A',
      });
    } catch (e) {
      failed = true;
    }

    expect(failed).toBe(true);

    // Verify first obligation was NOT touched!
    const unchangedOb1 = await FeeObligation.findById(ob1!._id);
    expect(unchangedOb1?.allocatedAmount).toBe(0);
    expect(unchangedOb1?.status).toBe('unpaid');
  });

  // TEST 15: Tenant isolation: One teacher cannot access another teacher's data
  it('15. Tenant isolation: Teacher B cannot allocate or reverse Teacher A transactions', async () => {
    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `ISO-TXN-${Date.now()}`,
      amount: 1500,
      status: 'teacher_verified',
      source: 'manual_entry',
    });

    let teacherBAccessDenied = false;
    try {
      await reverseTransaction(teacherBId, txn._id, 'Attempt by unauthorized teacher', 'Teacher B');
    } catch (e: any) {
      teacherBAccessDenied = true;
      expect(e.message).toContain('Transaction not found');
    }

    expect(teacherBAccessDenied).toBe(true);
  });

  // TEST 16: AI failure does not break evidence submission
  it('16. AI failure gracefully falls back to deterministic rule-based extractor without breaking submission', async () => {
    const rawText = 'Received ₹1,500 via GooglePay on 14/10/2026 for Diya Patel UPI Ref 987654321012';
    // Runs extraction even if Gemma API is unconfigured
    const extraction = await extractEvidenceData(rawText, ['Diya Patel']);

    expect(extraction).toBeDefined();
    expect(extraction.claimed_amount).toBe(1500);
    expect(extraction.claimed_transaction_reference).toBe('987654321012');
    expect(extraction.student_names).toContain('Diya Patel');
    expect(extraction.is_untrusted_candidate).toBe(true);
  });

  // TEST 17: A manual verification records the actor and reason
  it('17. A manual verification records the actor and reason in transaction and audit history', async () => {
    const txn = await PaymentTransaction.create({
      teacherId: teacherAId,
      transactionReference: `MAN-VER-${Date.now()}`,
      amount: 1500,
      status: 'pending_review',
      source: 'manual_entry',
    });

    // Simulate teacher manual verification
    txn.status = 'teacher_verified';
    txn.verifiedAt = new Date();
    txn.verifiedBy = 'Veda';
    txn.verificationReason = 'Cross-checked with ICICI Netbanking passbook entry';
    await txn.save();

    const saved = await PaymentTransaction.findById(txn._id);
    expect(saved?.status).toBe('teacher_verified');
    expect(saved?.verifiedBy).toBe('Veda');
    expect(saved?.verificationReason).toBe('Cross-checked with ICICI Netbanking passbook entry');
  });

  // TEST 18: A CSV containing invalid rows produces clear row-level errors
  it('18. A CSV containing invalid rows produces clear row-level errors without halting valid rows', async () => {
    const invalidCsv = `Date,Reference/UTR,Amount,Payer Name,Description
2026-10-14,VAL-101,1500,Valid Payer,Valid row
2026-10-14,INV-102,INVALID_AMOUNT,Bad Payer,Broken row
,INV-103,2000,Missing Date,No date row
2026-10-14,VAL-104,1800,Another Valid,Second valid row`;

    const result = await importTransactionsFromCsv(teacherAId, 'mixed.csv', invalidCsv);

    expect(result.importedRows).toBe(2);
    expect(result.failedRows).toBe(2);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].row).toBe(3); // row 3 has bad amount
    expect(result.errors[0].reason).toContain('Amount must be a positive number');
    expect(result.errors[1].row).toBe(4); // row 4 has missing date
    expect(result.errors[1].reason).toContain('Missing transaction date');
  });
});
