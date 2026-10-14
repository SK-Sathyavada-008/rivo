import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { PaymentTransaction, Student, FeeObligation } from '../../types/index.js';
import { apiFetch } from '../../lib/api.js';
import { formatINR } from '../../lib/utils.js';
import { Plus, Trash2, Users } from 'lucide-react';

interface AllocateSiblingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: PaymentTransaction | null;
  students: Student[];
}

interface AllocationRow {
  studentId: string;
  obligationId: string;
  billingMonth: string;
  amount: number;
}

export const AllocateSiblingModal: React.FC<AllocateSiblingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
  students,
}) => {
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [studentObligations, setStudentObligations] = useState<Record<string, FeeObligation[]>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with 1 or 2 rows
  useEffect(() => {
    if (transaction && isOpen) {
      setRows([
        {
          studentId: students[0]?._id || '',
          obligationId: '',
          billingMonth: new Date().toISOString().slice(0, 7),
          amount: Math.min(transaction.unallocatedAmount, 1500),
        },
      ]);
      setNotes(
        transaction.payerName
          ? `Allocated payment from ${transaction.payerName}`
          : 'Payment allocation'
      );
    }
  }, [transaction, isOpen]);

  // Fetch obligations for a student when selected
  const fetchObligationsForStudent = async (studentId: string) => {
    if (!studentId || studentObligations[studentId]) return;
    try {
      const res = await apiFetch<{ obligations: FeeObligation[] }>(`/students/${studentId}`);
      setStudentObligations(prev => ({
        ...prev,
        [studentId]: res.obligations || [],
      }));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    rows.forEach(r => {
      if (r.studentId) fetchObligationsForStudent(r.studentId);
    });
  }, [rows]);

  if (!transaction) return null;

  const totalAllocating = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const remaining = transaction.unallocatedAmount - totalAllocating;

  const handleAddRow = () => {
    const nextStudent = students.find(s => !rows.some(r => r.studentId === s._id)) || students[0];
    setRows(prev => [
      ...prev,
      {
        studentId: nextStudent?._id || '',
        obligationId: '',
        billingMonth: new Date().toISOString().slice(0, 7),
        amount: Math.max(0, remaining),
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof AllocationRow, value: any) => {
    setRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If student changed, auto-select their first open obligation if available
      if (field === 'studentId') {
        const studentObs = studentObligations[value] || [];
        const openOb = studentObs.find(o => o.status !== 'paid') || studentObs[0];
        if (openOb) {
          updated[index].obligationId = openOb._id;
          updated[index].billingMonth = openOb.billingMonth;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rows.length === 0) {
      setError('At least one student allocation is required.');
      return;
    }

    if (totalAllocating > transaction.unallocatedAmount + 0.01) {
      setError(
        `Total allocated (${formatINR(totalAllocating)}) exceeds unallocated payment amount (${formatINR(transaction.unallocatedAmount)}).`
      );
      return;
    }

    // Ensure all obligations are filled
    for (const r of rows) {
      if (!r.obligationId) {
        // Fallback: look up in studentObligations
        const obs = studentObligations[r.studentId] || [];
        const found = obs.find(o => o.billingMonth === r.billingMonth) || obs[0];
        if (found) {
          r.obligationId = found._id;
        } else {
          setError('Please ensure an obligation / billing month is chosen for each student.');
          return;
        }
      }
    }

    setLoading(true);
    try {
      await apiFetch('/allocations', {
        method: 'POST',
        body: JSON.stringify({
          transactionId: transaction._id,
          items: rows.map(r => ({
            studentId: r.studentId,
            obligationId: r.obligationId,
            billingMonth: r.billingMonth,
            amount: Number(r.amount),
          })),
          notes,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Allocate Payment to Students"
      description="Distribute verified payment across single or multiple siblings"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : null}

        {/* Transaction Summary Header */}
        <div className="p-3.5 bg-[#F7FCF9] rounded-2xl border border-[#E2EBE5] flex items-center justify-between text-xs">
          <div>
            <div className="text-[#718078]">Total Transaction Amount</div>
            <div className="font-bold text-base text-[#18392D]">{formatINR(transaction.amount)}</div>
          </div>
          <div>
            <div className="text-[#718078]">Available to Allocate</div>
            <div className="font-bold text-base text-[#15966A]">
              {formatINR(transaction.unallocatedAmount)}
            </div>
          </div>
          <div>
            <div className="text-[#718078]">Remaining Balance</div>
            <div
              className={`font-bold text-base ${
                remaining < 0 ? 'text-[#C24141]' : 'text-[#718078]'
              }`}
            >
              {formatINR(remaining)}
            </div>
          </div>
        </div>

        {/* Sibling Allocation Rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#718078] uppercase tracking-wider">
              Student Allocations
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
              <Plus className="w-3.5 h-3.5" />
              Add Sibling / Month
            </Button>
          </div>

          {rows.map((row, idx) => {
            const obs = studentObligations[row.studentId] || [];
            return (
              <div
                key={idx}
                className="p-3.5 bg-white rounded-2xl border border-[#E2EBE5] shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#15966A] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Allocation #{idx + 1}
                  </span>
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-[#C24141] hover:text-red-700 p-1 text-xs cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Select Student */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#718078] mb-1">
                      Student
                    </label>
                    <select
                      value={row.studentId}
                      onChange={e => handleRowChange(idx, 'studentId', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E2EBE5] text-xs bg-white focus:border-[#15966A] focus:outline-hidden"
                    >
                      {students.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({formatINR(s.monthlyFee)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Billing Month Obligation */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#718078] mb-1">
                      Billing Month Obligation
                    </label>
                    <select
                      value={row.obligationId}
                      onChange={e => {
                        const ob = obs.find(o => o._id === e.target.value);
                        handleRowChange(idx, 'obligationId', e.target.value);
                        if (ob) handleRowChange(idx, 'billingMonth', ob.billingMonth);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E2EBE5] text-xs bg-white focus:border-[#15966A] focus:outline-hidden"
                    >
                      <option value="">— Select Month —</option>
                      {obs.map(o => (
                        <option key={o._id} value={o._id}>
                          {o.billingMonth} — Due: {formatINR(o.outstandingBalance)} ({o.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Allocated Amount */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#718078] mb-1">
                      Amount to Allocate (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={row.amount}
                      onChange={e => handleRowChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Audit Notes</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Combined sibling fee payment for October"
            className="w-full px-3.5 py-2 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EBE5]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading} disabled={remaining < 0 || rows.length === 0}>
            Confirm Allocation ({formatINR(totalAllocating)})
          </Button>
        </div>
      </form>
    </Modal>
  );
};
