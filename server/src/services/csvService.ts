import { parse } from 'csv-parse/sync';
import { Types } from 'mongoose';
import { PaymentTransaction, TransactionStatus } from '../models/PaymentTransaction.js';
import { ImportJob, IImportError } from '../models/ImportJob.js';
import { recordAudit } from './auditService.js';

export interface CsvRowPreview {
  row: number;
  date: string;
  reference: string;
  amount: number | null;
  payer: string;
  description: string;
  isValid: boolean;
  error?: string;
  isDuplicate?: boolean;
}

export interface CsvImportResult {
  importJobId: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  failedRows: number;
  errors: IImportError[];
}

/**
 * Standard CSV Template header and sample data
 */
export const SAMPLE_CSV_CONTENT = `Date,Reference/UTR,Amount,Payer Name,Description
2026-10-02,428719283741,1500,Priya Sharma,UPI/428719283741/Aarav Sharma Oct fee
2026-10-03,428719283742,3000,Rajesh Patel,UPI/428719283742/Diya and Neil Patel Oct fees
2026-10-04,428719283743,2000,Sunita Verma,UPI/428719283743/Ananya Verma dance fee
2026-10-05,428719283744,1500,Vikram Rao,UPI/428719283744/Rohan Rao October
2026-10-06,428719283745,1800,Meera Joshi,UPI/428719283745/Ishaan Joshi Bharatnatyam
`;

/**
 * Normalizes headers from various bank/UPI exports (PhonePe, GPay, Paytm, HDFC, ICICI, SBI)
 */
function findColumn(row: Record<string, string>, possibleNames: string[]): string {
  const keys = Object.keys(row);
  for (const name of possibleNames) {
    const foundKey = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (foundKey && row[foundKey] !== undefined) {
      return row[foundKey].trim();
    }
  }
  return '';
}

export function previewCsvContent(csvString: string): CsvRowPreview[] {
  const records = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];

  return records.map((record, index) => {
    const row = index + 2; // 1-indexed, accounting for header
    const dateStr = findColumn(record, ['date', 'txn date', 'transaction date', 'value date', 'payment date']);
    const refStr = findColumn(record, ['reference', 'utr', 'reference/utr', 'ref no', 'txn id', 'upi ref no', 'transaction id']);
    const amountStr = findColumn(record, ['amount', 'txn amount', 'credit', 'cr', 'amount (inr)', 'paid amount']);
    const payerStr = findColumn(record, ['payer name', 'payer', 'party', 'sender', 'customer name', 'beneficiary']);
    const descStr = findColumn(record, ['description', 'remarks', 'narration', 'notes', 'particulars']);

    let parsedAmount: number | null = null;
    let isValid = true;
    let error: string | undefined;

    // Clean amount (remove commas, currency symbols)
    const cleanAmount = amountStr.replace(/[^0-9.-]+/g, '');
    parsedAmount = parseFloat(cleanAmount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      isValid = false;
      error = `Invalid amount "${amountStr}". Amount must be a positive number.`;
    }

    if (!dateStr) {
      isValid = false;
      error = (error ? error + ' ' : '') + 'Missing transaction date.';
    }

    return {
      row,
      date: dateStr,
      reference: refStr,
      amount: isNaN(parsedAmount) ? null : parsedAmount,
      payer: payerStr,
      description: descStr,
      isValid,
      error,
    };
  });
}

/**
 * Imports CSV transaction records safely.
 * Detects duplicates, enforces teacher isolation, records row-level errors,
 * and creates an immutable ImportJob record.
 */
export async function importTransactionsFromCsv(
  teacherId: Types.ObjectId | string,
  fileName: string,
  csvString: string,
  autoVerify: boolean = false,
  actorName: string = 'Teacher',
  actorId?: Types.ObjectId | string
): Promise<CsvImportResult> {
  const tId = new Types.ObjectId(teacherId);
  const previews = previewCsvContent(csvString);

  let importedRows = 0;
  let skippedRows = 0;
  let failedRows = 0;
  const errors: IImportError[] = [];

  const importJob = await ImportJob.create({
    teacherId: tId,
    fileName,
    totalRows: previews.length,
    importedRows: 0,
    skippedRows: 0,
    failedRows: 0,
    rowErrors: [],
    status: 'completed',
  });

  for (const item of previews) {
    if (!item.isValid || item.amount === null) {
      failedRows++;
      errors.push({
        row: item.row,
        data: item,
        reason: item.error || 'Validation failed for row',
      });
      continue;
    }

    // Check duplicate reference if reference is provided
    if (item.reference) {
      const existing = await PaymentTransaction.findOne({
        teacherId: tId,
        transactionReference: item.reference,
      });

      if (existing) {
        skippedRows++;
        errors.push({
          row: item.row,
          data: item,
          reason: `Duplicate transaction reference "${item.reference}" already imported. Skipped to prevent double counting.`,
        });
        continue;
      }
    }

    // Parse date
    let paymentDate = new Date(item.date);
    if (isNaN(paymentDate.getTime())) {
      paymentDate = new Date();
    }

    const status: TransactionStatus = autoVerify ? 'teacher_verified' : 'pending_review';

    await PaymentTransaction.create({
      teacherId: tId,
      transactionReference: item.reference || undefined,
      amount: item.amount,
      paymentDate,
      payerName: item.payer,
      description: item.description,
      source: 'csv_import',
      status,
      verifiedAt: autoVerify ? new Date() : undefined,
      verifiedBy: autoVerify ? actorName : undefined,
      verificationReason: autoVerify ? 'Teacher verified during CSV import' : undefined,
      allocatedAmount: 0,
      unallocatedAmount: item.amount,
      importJobId: importJob._id as Types.ObjectId,
      isSiblingPayment: false,
    });

    importedRows++;
  }

  // Update import job stats
  importJob.importedRows = importedRows;
  importJob.skippedRows = skippedRows;
  importJob.failedRows = failedRows;
  importJob.rowErrors = errors;
  importJob.status = failedRows > 0 && importedRows === 0 ? 'failed' : failedRows > 0 ? 'partial' : 'completed';
  await importJob.save();

  // Audit event
  await recordAudit({
    teacherId: tId,
    actorId,
    actorName,
    action: 'TRANSACTION_IMPORT',
    targetType: 'ImportJob',
    targetId: importJob._id.toString(),
    afterState: {
      fileName,
      totalRows: previews.length,
      importedRows,
      skippedRows,
      failedRows,
    },
    reason: `Imported bank statement CSV: ${fileName}`,
  });

  return {
    importJobId: importJob._id.toString(),
    totalRows: previews.length,
    importedRows,
    skippedRows,
    failedRows,
    errors,
  };
}
