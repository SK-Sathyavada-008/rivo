import React, { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { PaymentTransaction } from '../../types/index.js';
import { apiFetch } from '../../lib/api.js';
import { formatINR, formatDate } from '../../lib/utils.js';
import { ShieldCheck } from 'lucide-react';

interface VerifyTxnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction: PaymentTransaction | null;
}

export const VerifyTxnModal: React.FC<VerifyTxnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
}) => {
  const [reason, setReason] = useState('Cross-checked with bank credit SMS and UPI passbook');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!transaction) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a verification reason for the audit trail.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiFetch(`/transactions/${transaction._id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Transaction Manually"
      description="Record audited verification for this payment"
    >
      <form onSubmit={handleVerify} className="space-y-4">
        {error ? (
          <div className="p-3 bg-red-50 text-[#C24141] text-xs rounded-xl border border-red-200">
            {error}
          </div>
        ) : null}

        <div className="p-4 bg-[#F7FCF9] rounded-2xl border border-[#E2EBE5] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#718078]">Amount:</span>
            <span className="font-bold text-sm text-[#15966A]">{formatINR(transaction.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#718078]">UTR / Ref:</span>
            <span className="font-mono">{transaction.transactionReference || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#718078]">Payment Date:</span>
            <span>{formatDate(transaction.paymentDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#718078]">Payer:</span>
            <span className="font-medium">{transaction.payerName || 'Unknown'}</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-[#B7791F] flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#B7791F]" />
          <span>
            This transaction will be recorded as <strong>teacher_verified</strong>. It will not be falsely represented as an automated bank API integration.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#26352E] mb-1">
            Verification Reason / Evidence Checked *
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Verified against HDFC Netbanking statement credit"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2EBE5] text-sm focus:border-[#15966A] focus:outline-hidden"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2EBE5]">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={loading}>
            Confirm Verification
          </Button>
        </div>
      </form>
    </Modal>
  );
};
