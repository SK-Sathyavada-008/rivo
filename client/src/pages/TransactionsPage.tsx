import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Upload,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { CsvImportModal } from '../components/modals/CsvImportModal.js';
import { AddManualTxnModal } from '../components/modals/AddManualTxnModal.js';
import { VerifyTxnModal } from '../components/modals/VerifyTxnModal.js';
import { AllocateSiblingModal } from '../components/modals/AllocateSiblingModal.js';
import { apiFetch } from '../lib/api.js';
import { PaymentTransaction, Student } from '../types/index.js';
import { formatINR, formatDate } from '../lib/utils.js';

export const TransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [verifyingTxn, setVerifyingTxn] = useState<PaymentTransaction | null>(null);
  const [allocatingTxn, setAllocatingTxn] = useState<PaymentTransaction | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txnRes, stuRes] = await Promise.all([
        apiFetch<{ transactions: PaymentTransaction[] }>('/transactions'),
        apiFetch<{ students: Student[] }>('/students'),
      ]);
      setTransactions(txnRes.transactions || []);
      setStudents(stuRes.students || []);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReverse = async (txn: PaymentTransaction) => {
    const reason = prompt(`Enter reason for reversing transaction of ${formatINR(txn.amount)}:`);
    if (!reason) return;

    try {
      await apiFetch(`/transactions/${txn._id}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      alert('Transaction reversed and all linked fee allocations unwound.');
      fetchData();
    } catch (err: any) {
      alert('Reversal failed: ' + err.message);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch =
      (t.transactionReference && t.transactionReference.toLowerCase().includes(search.toLowerCase())) ||
      (t.payerName && t.payerName.toLowerCase().includes(search.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight">
            Bank Payment Transactions
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Imported bank statement credits, manual entries, and verified allocations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(true)}>
            <Plus className="w-4 h-4 text-[#15966A]" />
            <span>Record Manual</span>
          </Button>
          <Button size="sm" onClick={() => setIsCsvModalOpen(true)}>
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-[#E2EBE5]">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#718078] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by UTR ref or payer..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'teacher_verified', 'pending_review', 'reversed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-[#15966A] text-white shadow-xs'
                  : 'bg-stone-50 text-[#718078] hover:bg-stone-100'
              }`}
            >
              {status === 'all' ? 'All Transactions' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-[#E2EBE5] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#F7FCF9] text-[#718078] border-b border-[#E2EBE5]">
              <tr>
                <th className="py-3 px-4 font-bold">Date & UTR Ref</th>
                <th className="py-3 px-4 font-bold">Payer / Description</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold">Allocated / Remaining</th>
                <th className="py-3 px-4 font-bold">Verification Status</th>
                <th className="py-3 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2EBE5]">
              {filteredTransactions.map(txn => {
                const isVerified =
                  txn.status === 'teacher_verified' || txn.status === 'provider_verified';
                const hasUnallocated = txn.unallocatedAmount > 0;

                return (
                  <tr key={txn._id} className="hover:bg-[#F7FCF9]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#26352E]">{formatDate(txn.paymentDate)}</div>
                      <div className="font-mono text-[11px] text-[#718078] mt-0.5">
                        {txn.transactionReference ? `UTR: ${txn.transactionReference}` : 'No UTR'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18392D]">{txn.payerName || 'Direct Credit'}</div>
                      <div className="text-[11px] text-[#718078] truncate max-w-xs">
                        {txn.description || '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-sm text-[#18392D]">
                      {formatINR(txn.amount)}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs">
                        <span className="font-semibold text-[#15966A]">{formatINR(txn.allocatedAmount)}</span>
                        <span className="text-[#718078]"> allocated</span>
                      </div>
                      {hasUnallocated ? (
                        <div className="text-[11px] text-amber-700 font-medium">
                          {formatINR(txn.unallocatedAmount)} unallocated
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant={txn.status}>
                        {txn.status.replace(/_/g, ' ')}
                      </Badge>
                      {txn.verifiedBy ? (
                        <div className="text-[10px] text-[#718078] mt-0.5">
                          By: {txn.verifiedBy}
                        </div>
                      ) : null}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {!isVerified && txn.status !== 'reversed' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setVerifyingTxn(txn)}
                          className="text-xs h-7 px-2.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </Button>
                      ) : null}

                      {isVerified && hasUnallocated && txn.status !== 'reversed' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setAllocatingTxn(txn)}
                          className="text-xs h-7 px-2.5"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Allocate Sibling</span>
                        </Button>
                      ) : null}

                      {txn.status !== 'reversed' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReverse(txn)}
                          className="text-xs h-7 px-2 text-[#C24141] hover:bg-red-50"
                          title="Reverse this transaction and deallocate records"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#C24141] font-semibold italic">Reversed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#718078]">
            No transactions found. Click "Import CSV" or "Record Manual" to add payments.
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={fetchData}
      />
      <AddManualTxnModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={fetchData}
      />
      <VerifyTxnModal
        isOpen={!!verifyingTxn}
        onClose={() => setVerifyingTxn(null)}
        onSuccess={fetchData}
        transaction={verifyingTxn}
      />
      <AllocateSiblingModal
        isOpen={!!allocatingTxn}
        onClose={() => setAllocatingTxn(null)}
        onSuccess={fetchData}
        transaction={allocatingTxn}
        students={students}
      />
    </div>
  );
};
