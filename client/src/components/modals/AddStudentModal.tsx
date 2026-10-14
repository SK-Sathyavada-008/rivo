import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Batch, Family } from '../../types/index.js';
import { apiFetch } from '../../lib/api.js';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batches: Batch[];
  families: Family[];
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batches,
  families,
}) => {
  const [name, setName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [batchId, setBatchId] = useState(batches[0]?._id || '');
  const [familyId, setFamilyId] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('1500');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          name,
          guardianName: guardianName || undefined,
          guardianPhone: guardianPhone || undefined,
          batchId: batchId || batches[0]?._id,
          familyId: familyId || undefined,
          monthlyFee: parseFloat(monthlyFee) || 0,
          notes: notes || undefined,
        }),
      });

      onSuccess();
      onClose();
      // Reset form
      setName('');
      setGuardianName('');
      setGuardianPhone('');
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Student" description="Create a student record and link to a batch">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Student Full Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Diya Patel"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#26352E] mb-1">Guardian Name</label>
            <input
              type="text"
              value={guardianName}
              onChange={e => setGuardianName(e.target.value)}
              placeholder="e.g. Rajesh Patel"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#26352E] mb-1">Guardian Phone (WhatsApp)</label>
            <input
              type="tel"
              value={guardianPhone}
              onChange={e => setGuardianPhone(e.target.value)}
              placeholder="e.g. 9820045678"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#26352E] mb-1">Batch / Class *</label>
            <select
              value={batchId || batches[0]?._id}
              onChange={e => setBatchId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden bg-white"
            >
              {batches.map(b => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#26352E] mb-1">Monthly Fee (₹) *</label>
            <input
              type="number"
              required
              min="0"
              value={monthlyFee}
              onChange={e => setMonthlyFee(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">
            Explicit Family Link (Optional for Siblings)
          </label>
          <select
            value={familyId}
            onChange={e => setFamilyId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden bg-white"
          >
            <option value="">— No family link (Individual) —</option>
            {families.map(f => (
              <option key={f._id} value={f._id}>
                {f.name} ({f.guardianName})
              </option>
            ))}
          </select>
          <span className="text-[11px] text-[#718078] mt-1 block">
            Rivo never assumes siblings automatically. Family links must be explicitly selected.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Special instructions, schedule preference, etc."
            className="w-full px-3.5 py-2 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EBE5]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Save Student
          </Button>
        </div>
      </form>
    </Modal>
  );
};
