import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { apiFetch } from '../../lib/api.js';

interface AddManualTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddManualTxnModal: React.FC<AddManualTxnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [transactionReference, setTransactionReference] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerName, setPayerName] = useState('');
  const [description, setDescription] = useState('');
  const [verificationReason, setVerificationReason] = useState(
    'Directly verified in teacher bank account'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch('/transactions/manual', {
        method: 'POST',
        body: JSON.stringify({
          transactionReference: transactionReference || undefined,
          amount: parseFloat(amount),
          paymentDate: paymentDate || undefined,
          payerName: payerName || undefined,
          description: description || undefined,
          autoVerify: true,
          verificationReason,
        }),
      });

      onSuccess();
      onClose();
      setTransactionReference('');
      setAmount('');
      setPayerName('');
      setDescription('');
    } catch (err: any) {
      setError(err.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Bank Payment"
      description="Record a confirmed bank deposit or UPI credit"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#26352E] mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#26352E] mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">
            UPI Reference / UTR Number
          </label>
          <input
            type="text"
            value={transactionReference}
            onChange={e => setTransactionReference(e.target.value)}
            placeholder="e.g. 428719283741 (12 digits)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
          <span className="text-[11px] text-[#718078] mt-1 block">
            Unique reference prevents duplicate accounting.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Payer Name / Sender</label>
          <input
            type="text"
            value={payerName}
            onChange={e => setPayerName(e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">Description / Narration</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. UPI/428719283741/Dance fee Aarav"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">
            Verification Reason (Audit Trail) *
          </label>
          <input
            type="text"
            required
            value={verificationReason}
            onChange={e => setVerificationReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EBE5]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Record & Verify
          </Button>
        </div>
      </form>
    </Modal>
  );
};
