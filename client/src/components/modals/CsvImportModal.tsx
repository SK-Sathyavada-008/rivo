import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Download, Upload, CheckCircle2, AlertTriangle, AlertCircle, FileText } from 'lucide-react';
import { apiFetch } from '../../lib/api.js';
import { formatINR } from '../../lib/utils.js';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [previews, setPreviews] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [autoVerify, setAutoVerify] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadSample = async () => {
    try {
      const csvText = await apiFetch<string>('/transactions/sample-csv');
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rivo_sample_bank_statement.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download template: ' + err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async event => {
      const text = event.target?.result as string;
      setCsvContent(text);

      try {
        const previewRes = await apiFetch<any>('/transactions/preview-csv', {
          method: 'POST',
          body: JSON.stringify({ csvContent: text }),
        });
        setPreviews(previewRes.rows || []);
        setSummary(previewRes.summary || null);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV preview');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteDemo = async () => {
    try {
      const sample = await apiFetch<string>('/transactions/sample-csv');
      setCsvContent(sample);
      setFileName('demo_bank_statement.csv');

      const previewRes = await apiFetch<any>('/transactions/preview-csv', {
        method: 'POST',
        body: JSON.stringify({ csvContent: sample }),
      });
      setPreviews(previewRes.rows || []);
      setSummary(previewRes.summary || null);
    } catch (err: any) {
      setError('Failed to load sample: ' + err.message);
    }
  };

  const handleImport = async () => {
    if (!csvContent) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch<any>('/transactions/import-csv', {
        method: 'POST',
        body: JSON.stringify({
          csvContent,
          fileName: fileName || 'bank_statement.csv',
          autoVerify,
        }),
      });

      setImportResult(res.result);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Bank Statement CSV"
      description="Upload transaction exports from PhonePe, GPay, Paytm, or Netbanking"
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Step 1: Download Template or Paste Sample */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-[#F7FCF9] rounded-2xl border border-[#E2EBE5]">
          <div className="flex items-center gap-2 text-xs text-[#26352E] font-medium">
            <FileText className="w-4 h-4 text-[#15966A]" />
            <span>Need the supported CSV format?</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadSample}>
              <Download className="w-3.5 h-3.5" />
              Download Template
            </Button>
            <Button variant="secondary" size="sm" onClick={handlePasteDemo}>
              Load Demo CSV
            </Button>
          </div>
        </div>

        {/* Step 2: Upload CSV */}
        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1.5">
            Select Statement CSV File
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#E2EBE5] hover:border-[#15966A] rounded-2xl cursor-pointer bg-[#F7FCF9]/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 text-[#15966A] mb-2" />
                <p className="text-xs text-[#26352E]">
                  <span className="font-semibold">Click to upload CSV</span> or drag & drop
                </p>
                <p className="text-[11px] text-[#718078] mt-0.5">{fileName || 'Supports CSV exports with Date, Amount, Reference/UTR'}</p>
              </div>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {error ? (
          <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : null}

        {/* Step 3: Live Preview Table */}
        {previews.length > 0 && !importResult ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#718078]">
                CSV Preview ({summary?.total} Rows Found)
              </h4>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-[#15966A] flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {summary?.valid} Valid
                </span>
                {summary?.invalid > 0 ? (
                  <span className="text-[#C24141] flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> {summary?.invalid} Errors
                  </span>
                ) : null}
              </div>
            </div>

            <div className="border border-[#E2EBE5] rounded-xl overflow-x-auto max-h-52 text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F7FCF9] text-[#718078] border-b border-[#E2EBE5] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Row</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">UTR / Reference</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Payer / Description</th>
                    <th className="py-2 px-3">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EBE5]">
                  {previews.slice(0, 8).map(row => (
                    <tr key={row.row} className={row.isValid ? 'bg-white' : 'bg-red-50/50'}>
                      <td className="py-2 px-3 font-mono">{row.row}</td>
                      <td className="py-2 px-3">{row.date}</td>
                      <td className="py-2 px-3 font-mono">{row.reference || '—'}</td>
                      <td className="py-2 px-3 font-semibold">
                        {row.amount !== null ? formatINR(row.amount) : 'Invalid'}
                      </td>
                      <td className="py-2 px-3 truncate max-w-[150px]">
                        {row.payer || row.description || '—'}
                      </td>
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="text-[#15966A] font-medium">OK</span>
                        ) : (
                          <span className="text-[#C24141] font-medium" title={row.error}>
                            {row.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoVerify"
                checked={autoVerify}
                onChange={e => setAutoVerify(e.target.checked)}
                className="w-4 h-4 text-[#15966A] rounded-sm border-[#E2EBE5] focus:ring-[#15966A]"
              />
              <label htmlFor="autoVerify" className="text-xs text-[#26352E] cursor-pointer">
                Mark as <span className="font-semibold text-[#15966A]">teacher_verified</span> upon import (since this statement is directly from my bank)
              </label>
            </div>
          </div>
        ) : null}

        {/* Step 4: Import Results Summary */}
        {importResult ? (
          <div className="p-4 bg-[#DDF7E9]/40 border border-[#9DE5BE] rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-[#18392D]">
              <CheckCircle2 className="w-5 h-5 text-[#15966A]" />
              <span>Statement Import Completed!</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-[#E2EBE5]">
                <div className="font-bold text-base text-[#15966A]">{importResult.importedRows}</div>
                <div className="text-[#718078]">Imported</div>
              </div>
              <div className="p-2 bg-white rounded-xl border border-[#E2EBE5]">
                <div className="font-bold text-base text-[#B7791F]">{importResult.skippedRows}</div>
                <div className="text-[#718078]">Duplicates Skipped</div>
              </div>
              <div className="p-2 bg-white rounded-xl border border-[#E2EBE5]">
                <div className="font-bold text-base text-[#C24141]">{importResult.failedRows}</div>
                <div className="text-[#718078]">Failed Rows</div>
              </div>
            </div>

            {importResult.errors?.length > 0 ? (
              <div className="text-xs text-[#718078] max-h-24 overflow-y-auto space-y-1 bg-white p-2.5 rounded-xl border border-[#E2EBE5]">
                <div className="font-semibold text-[#26352E] mb-1">Row Logs:</div>
                {importResult.errors.map((err: any, i: number) => (
                  <div key={i} className="text-[11px]">
                    Row {err.row}: {err.reason}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EBE5]">
          <Button variant="outline" onClick={onClose}>
            {importResult ? 'Done' : 'Cancel'}
          </Button>
          {!importResult ? (
            <Button
              onClick={handleImport}
              isLoading={loading}
              disabled={previews.length === 0 || summary?.valid === 0}
            >
              Confirm Import ({summary?.valid || 0} Transactions)
            </Button>
          ) : (
            <Button onClick={onClose}>Close</Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
