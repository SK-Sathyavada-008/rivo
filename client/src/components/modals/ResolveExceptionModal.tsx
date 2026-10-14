import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { ExceptionCase, Student } from '../../types/index.js';
import { apiFetch } from '../../lib/api.js';

interface ResolveExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  exception: ExceptionCase | null;
  students: Student[];
}

export const ResolveExceptionModal: React.FC<ResolveExceptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  exception,
  students,
}) => {
  const [action, setAction] = useState<'link_student' | 'manual_verify' | 'reject' | 'dismiss'>('link_student');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!exception) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a resolution explanation for audit history.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/exceptions/${exception._id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolutionAction: action,
          resolutionReason: reason,
          studentId: action === 'link_student' ? selectedStudentId : undefined,
        }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve exception');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Exception Case"
      description={`Reviewing: ${exception.reason.replace(/_/g, ' ').toUpperCase()}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : null}

        <div className="p-3.5 bg-[#F7FCF9] rounded-2xl border border-[#E2EBE5] space-y-1.5 text-xs">
          <div className="font-semibold text-[#26352E]">Case Details:</div>
          <p className="text-[#718078]">{exception.notes || exception.recommendedAction}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1.5">
            Choose Resolution Action *
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setAction('link_student')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                action === 'link_student'
                  ? 'border-[#15966A] bg-[#DDF7E9]/40 text-[#15966A] font-semibold'
                  : 'border-[#E2EBE5] hover:bg-stone-50 text-[#26352E]'
              }`}
            >
              1. Link to Student
            </button>
            <button
              type="button"
              onClick={() => setAction('manual_verify')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                action === 'manual_verify'
                  ? 'border-[#15966A] bg-[#DDF7E9]/40 text-[#15966A] font-semibold'
                  : 'border-[#E2EBE5] hover:bg-stone-50 text-[#26352E]'
              }`}
            >
              2. Verify Manually
            </button>
            <button
              type="button"
              onClick={() => setAction('reject')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                action === 'reject'
                  ? 'border-[#C24141] bg-red-50 text-[#C24141] font-semibold'
                  : 'border-[#E2EBE5] hover:bg-stone-50 text-[#26352E]'
              }`}
            >
              3. Mark Rejected
            </button>
            <button
              type="button"
              onClick={() => setAction('dismiss')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                action === 'dismiss'
                  ? 'border-stone-400 bg-stone-100 text-[#26352E] font-semibold'
                  : 'border-[#E2EBE5] hover:bg-stone-50 text-[#26352E]'
              }`}
            >
              4. Dismiss Duplicate
            </button>
          </div>
        </div>

        {action === 'link_student' ? (
          <div>
            <label className="block text-xs font-semibold text-[#26352E] mb-1">
              Select Academy Student *
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#E2EBE5] text-xs bg-white focus:border-[#15966A] focus:outline-hidden"
            >
              <option value="">— Select student —</option>
              {students.map(s => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.guardianName ? `Guardian: ${s.guardianName}` : 'No guardian listed'})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">
            Explanation / Teacher Decision Reason *
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Confirmed with parent via phone call"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-xs focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EBE5]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Save Resolution
          </Button>
        </div>
      </form>
    </Modal>
  );
};
