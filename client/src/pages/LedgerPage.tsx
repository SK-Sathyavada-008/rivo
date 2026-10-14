import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { apiFetch } from '../lib/api.js';
import { FeeObligation, Batch } from '../types/index.js';
import { formatINR, formatMonth, formatDate, getCurrentMonth } from '../lib/utils.js';

export const LedgerPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [obligations, setObligations] = useState<FeeObligation[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [summary, setSummary] = useState<any>({ totalExpected: 0, totalCollected: 0, totalOutstanding: 0 });
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  const fetchLedger = async (month: string) => {
    setLoading(true);
    try {
      const [ledgerRes, batchRes] = await Promise.all([
        apiFetch<any>(`/ledger?month=${month}`),
        apiFetch<{ batches: Batch[] }>('/batches'),
      ]);
      setObligations(ledgerRes.obligations || []);
      setSummary(ledgerRes.summary || { totalExpected: 0, totalCollected: 0, totalOutstanding: 0 });
      setBatches(batchRes.batches || []);
    } catch (e) {
      console.error('Failed to load ledger:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(selectedMonth);
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleGenerateObligations = async () => {
    setGenerating(true);
    setGenMessage(null);
    try {
      const res = await apiFetch<any>('/ledger/generate', {
        method: 'POST',
        body: JSON.stringify({ billingMonth: selectedMonth }),
      });
      setGenMessage(res.message);
      fetchLedger(selectedMonth);
    } catch (err: any) {
      alert('Generation error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const filteredObligations = obligations.filter(ob => {
    const matchesSearch =
      ob.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      (ob.studentId?.guardianName && ob.studentId.guardianName.toLowerCase().includes(search.toLowerCase()));

    const bId = typeof ob.batchId === 'object' ? ob.batchId?._id : ob.batchId;
    const matchesBatch = selectedBatchId === 'all' || bId === selectedBatchId;

    return matchesSearch && matchesBatch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Idempotent Generation Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight">
            Monthly Fee Ledger
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Idempotent obligation tracking per student and billing month
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E2EBE5] shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-[#718078] hover:text-[#26352E] rounded-xl cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2 text-xs font-bold text-[#18392D]">
              {formatMonth(selectedMonth)}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-[#718078] hover:text-[#26352E] rounded-xl cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={handleGenerateObligations}
            isLoading={generating}
            title="Generates fee obligations for all active students (Idempotent: safe to run multiple times)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate Obligations</span>
          </Button>
        </div>
      </div>

      {genMessage ? (
        <div className="p-3 bg-[#DDF7E9] border border-[#9DE5BE] text-[#15966A] text-xs font-semibold rounded-2xl flex items-center justify-between">
          <span>{genMessage}</span>
          <button onClick={() => setGenMessage(null)} className="text-xs underline cursor-pointer">Dismiss</button>
        </div>
      ) : null}

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-white">
          <div className="text-xs text-[#718078]">Total Fees Due for {formatMonth(selectedMonth)}</div>
          <div className="text-xl font-bold text-[#18392D] mt-1">{formatINR(summary.totalExpected)}</div>
        </Card>
        <Card className="p-4 bg-[#DDF7E9]/40 border-[#9DE5BE]">
          <div className="text-xs text-[#15966A] font-semibold">Verified Fees Collected</div>
          <div className="text-xl font-extrabold text-[#15966A] mt-1">{formatINR(summary.totalCollected)}</div>
        </Card>
        <Card className="p-4 bg-white">
          <div className="text-xs text-[#718078]">Outstanding Fees</div>
          <div className="text-xl font-bold text-[#C24141] mt-1">{formatINR(summary.totalOutstanding)}</div>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-[#E2EBE5]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search student or parent..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#718078]" />
          <select
            value={selectedBatchId}
            onChange={e => setSelectedBatchId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-[#E2EBE5] text-xs bg-white text-[#26352E] focus:border-[#15966A] focus:outline-hidden"
          >
            <option value="all">All Batches</option>
            {batches.map(b => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Obligations Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#E2EBE5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#F7FCF9] text-[#718078] border-b border-[#E2EBE5]">
              <tr>
                <th className="py-3 px-4 font-bold">Student</th>
                <th className="py-3 px-4 font-bold">Batch</th>
                <th className="py-3 px-4 font-bold">Amount Due</th>
                <th className="py-3 px-4 font-bold">Verified Paid</th>
                <th className="py-3 px-4 font-bold">Outstanding</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Allocations Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBE5]">
              {filteredObligations.map(ob => (
                <tr key={ob._id} className="hover:bg-[#F7FCF9]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-sm text-[#26352E]">{ob.studentId?.name}</div>
                    {ob.studentId?.guardianName ? (
                      <div className="text-[11px] text-[#718078]">
                        Guardian: {ob.studentId.guardianName}
                      </div>
                    ) : null}
                  </td>

                  <td className="py-3 px-4 text-[#718078] font-medium">
                    {ob.batchId?.name || '—'}
                  </td>

                  <td className="py-3 px-4 font-bold text-[#18392D]">
                    {formatINR(ob.amountDue)}
                  </td>

                  <td className="py-3 px-4 font-bold text-[#15966A]">
                    {formatINR(ob.allocatedAmount)}
                  </td>

                  <td className="py-3 px-4 font-bold">
                    <span className={ob.outstandingBalance > 0 ? 'text-[#C24141]' : 'text-[#718078]'}>
                      {formatINR(ob.outstandingBalance)}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <Badge variant={ob.status}>
                      {ob.status === 'paid' && <CheckCircle2 className="w-3 h-3 text-[#15966A]" />}
                      {ob.status === 'partially_paid' && <Clock className="w-3 h-3 text-[#B7791F]" />}
                      {ob.status === 'unpaid' && <AlertCircle className="w-3 h-3 text-[#718078]" />}
                      <span className="capitalize">{ob.status.replace(/_/g, ' ')}</span>
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    {ob.allocations && ob.allocations.length > 0 ? (
                      <div className="space-y-1">
                        {ob.allocations.map((alloc: any) => (
                          <div key={alloc._id} className="text-[10px] text-[#718078]">
                            <span className="font-semibold text-[#15966A]">+{formatINR(alloc.allocatedAmount)}</span>
                            {alloc.transactionId?.transactionReference ? (
                              <span className="font-mono ml-1">
                                (Ref: {alloc.transactionId.transactionReference})
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#718078] italic">No verified payments</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredObligations.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#718078]">
            No obligations found for this month. Click "Generate Obligations" to create fees for active students.
          </div>
        ) : null}
      </div>
    </div>
  );
};
