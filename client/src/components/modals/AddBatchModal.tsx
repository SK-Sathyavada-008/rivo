import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { apiFetch } from '../../lib/api.js';

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [instructor, setInstructor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch('/batches', {
        method: 'POST',
        body: JSON.stringify({
          name,
          schedule: schedule || undefined,
          instructor: instructor || undefined,
          isActive: true,
        }),
      });

      onSuccess();
      onClose();
      setName('');
      setSchedule('');
      setInstructor('');
    } catch (err: any) {
      setError(err.message || 'Failed to add batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Batch" description="Create a batch or class schedule">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Batch Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Kathak - Advanced (Batch C)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Schedule / Timings</label>
          <input
            type="text"
            value={schedule}
            onChange={e => setSchedule(e.target.value)}
            placeholder="e.g. Tue, Thu 5:00 PM - 6:30 PM"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Instructor Name</label>
          <input
            type="text"
            value={instructor}
            onChange={e => setInstructor(e.target.value)}
            placeholder="e.g. Veda"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EBE5]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Create Batch
          </Button>
        </div>
      </form>
    </Modal>
  );
};
