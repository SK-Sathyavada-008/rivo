import React, { useState } from 'react';
import {
  Smartphone,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { apiFetch } from '../lib/api.js';
import { formatINR } from '../lib/utils.js';

export const ShareEvidencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'screenshot'>('text');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Extracted fields
  const [studentName, setStudentName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [reference, setReference] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [extractedBy, setExtractedBy] = useState<string>('manual');
  const [explanation, setExplanation] = useState<string>('');

  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill realistic sample WhatsApp messages
  const handleLoadSample = (type: 'sharma' | 'patel' | 'unknown') => {
    if (type === 'sharma') {
      setRawText('Hi Ananya Maam, paid October fees of ₹1,500 for Aarav Sharma just now. UPI Ref: 428719283741. Thank you!');
    } else if (type === 'patel') {
      setRawText('Transferred ₹3,000 for Diya and Neil Patel monthly dance classes. Transaction reference UTR 428719283742');
    } else {
      setRawText('Paid ₹1,800 for Kavya dance class fee via GPay today.');
    }
    setSuccessMessage(null);
  };

  const handleRunExtraction = async () => {
    if (!rawText.trim()) return;
    setExtracting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch<any>('/evidence/extract', {
        method: 'POST',
        body: JSON.stringify({ text: rawText }),
      });

      const ext = res.extraction;
      if (ext) {
        setStudentName(ext.student_names?.[0] || '');
        setAmount(ext.claimed_amount ? String(ext.claimed_amount) : '');
        setDate(ext.claimed_date || new Date().toISOString().split('T')[0]);
        setReference(ext.claimed_transaction_reference || '');
        setConfidence(ext.confidence || 0.85);
        setExtractedBy(ext.extracted_by || 'rule_based_fallback');
        setExplanation(ext.explanation || '');
      }
    } catch (err: any) {
      setError(err.message || 'Extraction failed');
    } finally {
      setExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Simulate OCR text extraction from watermarked screenshot
    setRawText(`Payment to Naatyavedam\n₹ 1,500.00\nCompleted 14 Oct 2026\nUPI Ref No: 428719283744\nPaid for: Keerthana`);
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('screenshot', selectedFile);
      }
      formData.append('source', selectedFile ? 'whatsapp_screenshot' : 'whatsapp_text');
      formData.append('rawText', rawText);
      formData.append('claimedStudentName', studentName);
      formData.append('claimedAmount', amount);
      formData.append('claimedDate', date);
      formData.append('claimedTransactionReference', reference);
      formData.append('extractedBy', extractedBy);
      formData.append('autoReconcile', 'true');

      const res = await apiFetch<any>('/evidence', {
        method: 'POST',
        body: formData,
      });

      setSuccessMessage(
        res.reconResult?.status === 'matched'
          ? '🎉 Matched with confirmed bank transaction! Ready for ledger allocation.'
          : 'Evidence recorded in Review Queue. (Screenshots remain provisional until verified against bank statement).'
      );

      // Reset
      setRawText('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setConfidence(null);
    } catch (err: any) {
      setError(err.message || 'Failed to submit evidence');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title & Simulator Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-[#15966A]" />
            <span>Share to Rivo — Evidence Entry</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Paste WhatsApp message text or upload screenshot from parents. AI extracts candidate fields for review.
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('rivo:open-simulator'))}
          className="bg-linear-to-r from-[#18392D] to-[#15966A] hover:opacity-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <Smartphone className="w-4 h-4 text-emerald-300" />
          <span>📱 Open Phone Simulator</span>
        </button>
      </div>

      {/* Critical Trust & Safety Callout */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-[#B7791F]">
        <ShieldAlert className="w-5 h-5 shrink-0 text-[#B7791F] mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Core Principle: Evidence is a Claim, Not a Payment.</span>
          <p className="text-[#718078] leading-relaxed">
            Rivo NEVER marks fees as paid merely because a screenshot or message says so. All extracted details are treated as untrusted candidates until matched with a verified bank transaction.
          </p>
        </div>
      </div>

      {successMessage ? (
        <div className="p-4 bg-[#DDF7E9] border border-[#9DE5BE] text-[#15966A] rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {error ? (
        <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: Input Evidence (Text / Screenshot) */}
        <Card className="space-y-4 bg-white">
          <div className="flex border-b border-[#E2EBE5]">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === 'text'
                  ? 'border-[#15966A] text-[#15966A]'
                  : 'border-transparent text-[#718078]'
              }`}
            >
              Paste Message Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('screenshot')}
              className={`flex-1 py-2 text-xs font-bold border-b-2 -mb-px transition-colors cursor-pointer ${
                activeTab === 'screenshot'
                  ? 'border-[#15966A] text-[#15966A]'
                  : 'border-transparent text-[#718078]'
              }`}
            >
              Upload Screenshot
            </button>
          </div>

          {activeTab === 'text' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#26352E]">
                  WhatsApp Message Text *
                </label>
                <div className="flex gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('sharma')}
                    className="text-[#15966A] underline cursor-pointer"
                  >
                    Sample 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('patel')}
                    className="text-[#15966A] underline cursor-pointer"
                  >
                    Sibling Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('unknown')}
                    className="text-[#B7791F] underline cursor-pointer"
                  >
                    Unknown Payer
                  </button>
                </div>
              </div>

              <textarea
                rows={5}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="Paste parent's WhatsApp message here (e.g. 'Paid ₹1,500 for Aarav Sharma UPI Ref 428719283741')..."
                className="w-full p-3 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
              />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRunExtraction}
                isLoading={extracting}
                disabled={!rawText.trim()}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 text-[#15966A]" />
                <span>Extract Fields with Gemma / Rules</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#26352E]">
                Payment Receipt Screenshot
              </label>

              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#E2EBE5] hover:border-[#15966A] rounded-2xl cursor-pointer bg-[#F7FCF9]/50 transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Screenshot preview" className="max-h-36 object-contain rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <Upload className="w-6 h-6 text-[#15966A] mb-2" />
                    <p className="text-xs text-[#26352E] font-semibold">Choose photo from phone gallery</p>
                    <p className="text-[11px] text-[#718078] mt-1">GPay, PhonePe, Paytm, or UPI confirmation</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {rawText ? (
                <div className="p-2.5 bg-stone-50 rounded-xl border border-[#E2EBE5] text-[11px] text-[#718078]">
                  <span className="font-semibold text-[#26352E] block mb-0.5">OCR Extracted Text:</span>
                  <p className="font-mono whitespace-pre-line">{rawText}</p>
                </div>
              ) : null}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRunExtraction}
                isLoading={extracting}
                disabled={!rawText.trim()}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 text-[#15966A]" />
                <span>Extract Candidate Fields</span>
              </Button>
            </div>
          )}
        </Card>

        {/* RIGHT COLUMN: Candidate Fields & Teacher Review */}
        <Card className="space-y-4 bg-white">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2EBE5]">
            <h3 className="text-sm font-bold text-[#18392D] flex items-center gap-1.5">
              <span>Candidate Fields</span>
              {confidence !== null ? (
                <Badge variant={confidence > 0.7 ? 'paid' : 'pending_review'}>
                  {(confidence * 100).toFixed(0)}% Confidence ({extractedBy.replace('_', ' ')})
                </Badge>
              ) : null}
            </h3>
            <span className="text-[11px] text-[#718078]">Editable</span>
          </div>

          {explanation ? (
            <p className="text-xs text-[#718078] bg-[#F7FCF9] p-2.5 rounded-xl border border-[#E2EBE5]">
              {explanation}
            </p>
          ) : null}

          <form onSubmit={handleSubmitEvidence} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#26352E] mb-1">Claimed Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="e.g. Diya Patel"
                className="w-full px-3 py-2 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#26352E] mb-1">Claimed Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#26352E] mb-1">Claimed Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26352E] mb-1">Claimed UPI Reference / UTR</label>
              <input
                type="text"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="e.g. 428719283741"
                className="w-full px-3 py-2 rounded-xl border border-[#E2EBE5] text-xs font-mono focus:border-[#15966A] focus:outline-hidden"
              />
            </div>

            <Button
              type="submit"
              isLoading={submitting}
              disabled={!studentName && !amount}
              className="w-full h-11 text-xs font-bold mt-3"
            >
              <span>Save Evidence Claim</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
