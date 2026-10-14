import { ENV } from '../config/env.js';

export interface ExtractionResult {
  student_names: string[];
  claimed_amount: number | null;
  claimed_date: string | null;
  claimed_transaction_reference: string | null;
  claimed_status: string | null;
  confidence: number;
  missing_fields: string[];
  explanation: string;
  extracted_by: 'gemma_ai' | 'rule_based_fallback';
  is_untrusted_candidate: true;
}

/**
 * Deterministic rule-based extractor for Indian UPI payment receipts, SMS messages, and WhatsApp chats.
 * Runs locally without external API dependencies.
 */
export function extractFieldsWithRules(text: string, knownStudentNames: string[] = []): ExtractionResult {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Amount Extraction (supports ₹1,500, Rs. 1500, INR 3000, 1500/-)
  let claimed_amount: number | null = null;
  const amountRegexes = [
    /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+(?:\.\d{1,2})?)\s*(?:\/-|inr|rs)/i,
    /(?:paid|transferred|sent|received|amount)\s*(?:of)?\s*(?:rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\b(\d{3,6})\b/, // Raw 3 to 6 digits fallback if fees
  ];

  for (const regex of amountRegexes) {
    const match = clean.match(regex);
    if (match && match[1]) {
      const parsed = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0 && parsed <= 500000) {
        claimed_amount = parsed;
        break;
      }
    }
  }

  // 2. Transaction Reference / UPI UTR (typically 12 digits in India, or alphanumeric ref)
  let claimed_transaction_reference: string | null = null;
  const utrRegexes = [
    /(?:upi\s*ref(?:\s*no\.?|\s*id)?|utr|txn\s*(?:id|ref)?|ref\s*no\.?|reference)\s*[:#-]?\s*([a-zA-Z0-9]{8,22})/i,
    /\b([0-9]{12})\b/, // Standard 12-digit Indian UPI UTR number
    /\b([A-Z0-9]{12,18})\b/,
  ];

  for (const regex of utrRegexes) {
    const match = clean.match(regex);
    if (match && match[1]) {
      claimed_transaction_reference = match[1].trim();
      break;
    }
  }

  // 3. Date Extraction (e.g. 14 Oct 2026, 14/10/2026, 2026-10-14, today, etc.)
  let claimed_date: string | null = null;
  const dateRegexes = [
    /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{2,4})/i,
  ];

  for (const regex of dateRegexes) {
    const match = clean.match(regex);
    if (match && match[1]) {
      claimed_date = match[1].trim();
      break;
    }
  }
  if (!claimed_date) {
    // Default to today if text mentions "today" or "just paid"
    if (lower.includes('today') || lower.includes('just now') || lower.includes('done')) {
      claimed_date = new Date().toISOString().split('T')[0];
    }
  }

  // 4. Student Name Matching from known students or text analysis
  const matchedStudentNames: string[] = [];
  for (const name of knownStudentNames) {
    const nameRegex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (nameRegex.test(clean)) {
      matchedStudentNames.push(name);
    }
  }

  // If no known student match found, look for patterns like "Fees for Rahul", "Ananya fee"
  if (matchedStudentNames.length === 0) {
    const nameExtractRegexes = [
      /(?:fee(?:s)?\s*for|student(?:\s*name)?\s*[:#-]?|for)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
      /([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:fees?|monthly)/i,
    ];
    for (const regex of nameExtractRegexes) {
      const match = clean.match(regex);
      if (match && match[1] && !['the', 'this', 'october', 'month', 'dance', 'class'].includes(match[1].toLowerCase())) {
        matchedStudentNames.push(match[1].trim());
        break;
      }
    }
  }

  // 5. Claimed Status
  let claimed_status: string | null = 'pending_review';
  if (lower.includes('success') || lower.includes('completed') || lower.includes('paid')) {
    claimed_status = 'claimed_successful';
  } else if (lower.includes('failed') || lower.includes('declined')) {
    claimed_status = 'claimed_failed';
  }

  // 6. Missing Fields and Confidence Calculation
  const missing_fields: string[] = [];
  let score = 0;

  if (claimed_amount !== null) score += 0.35;
  else missing_fields.push('claimed_amount');

  if (claimed_transaction_reference !== null) score += 0.35;
  else missing_fields.push('claimed_transaction_reference');

  if (matchedStudentNames.length > 0) score += 0.2;
  else missing_fields.push('student_names');

  if (claimed_date !== null) score += 0.1;
  else missing_fields.push('claimed_date');

  const confidence = Math.min(1, Math.round(score * 100) / 100);

  return {
    student_names: matchedStudentNames,
    claimed_amount,
    claimed_date,
    claimed_transaction_reference,
    claimed_status,
    confidence,
    missing_fields,
    explanation: `Deterministic rule extraction completed with ${(confidence * 100).toFixed(0)}% confidence score.`,
    extracted_by: 'rule_based_fallback',
    is_untrusted_candidate: true,
  };
}

/**
 * Main AI Extraction Service:
 * If GEMMA_API_URL is configured, calls the Gemma endpoint.
 * Otherwise, gracefully falls back to deterministic rule-based extraction.
 */
export async function extractEvidenceData(
  textOrOcr: string,
  knownStudentNames: string[] = []
): Promise<ExtractionResult> {
  // If Gemma endpoint is configured, try it
  if (ENV.GEMMA_API_URL && ENV.GEMMA_API_KEY) {
    try {
      const prompt = `You are an AI assistant in Rivo, a fee reconciliation system.
Analyze the following payment evidence message/OCR text and extract structured fields.
Known student roster: ${JSON.stringify(knownStudentNames)}.

Evidence text:
"""
${textOrOcr}
"""

Respond ONLY with a valid JSON object matching this schema:
{
  "student_names": string[],
  "claimed_amount": number or null,
  "claimed_date": string or null (YYYY-MM-DD or readable string),
  "claimed_transaction_reference": string or null (e.g. 12-digit UTR),
  "claimed_status": string or null,
  "confidence": number (between 0.0 and 1.0),
  "missing_fields": string[],
  "explanation": string
}`;

      const response = await fetch(ENV.GEMMA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.GEMMA_API_KEY}`,
        },
        body: JSON.stringify({
          model: ENV.GEMMA_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (response.ok) {
        const json = (await response.json()) as any;
        const content = json.choices?.[0]?.message?.content || json.response || '';
        const parsed = JSON.parse(content);

        return {
          student_names: Array.isArray(parsed.student_names) ? parsed.student_names : [],
          claimed_amount: typeof parsed.claimed_amount === 'number' ? parsed.claimed_amount : null,
          claimed_date: typeof parsed.claimed_date === 'string' ? parsed.claimed_date : null,
          claimed_transaction_reference:
            typeof parsed.claimed_transaction_reference === 'string'
              ? parsed.claimed_transaction_reference
              : null,
          claimed_status: parsed.claimed_status || 'claimed_successful',
          confidence: typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.8,
          missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : [],
          explanation: parsed.explanation || 'Extracted via Gemma inference endpoint.',
          extracted_by: 'gemma_ai',
          is_untrusted_candidate: true,
        };
      }
    } catch (err) {
      console.warn('[AIService] Gemma endpoint error, falling back to rule-based extractor:', err);
    }
  }

  // Graceful rule-based fallback
  return extractFieldsWithRules(textOrOcr, knownStudentNames);
}
