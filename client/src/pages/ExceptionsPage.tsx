import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Filter,
  Check,
  X,
  FileQuestion,
} from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { ResolveExceptionModal } from '../components/modals/ResolveExceptionModal.js';
import { apiFetch } from '../lib/api.js';
import { ExceptionCase, Student } from '../types/index.js';
import { formatINR, formatDate } from '../lib/utils.js';

export const ExceptionsPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<ExceptionCase[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [resolvingException, setResolvingException] = useState<ExceptionCase | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [exRes, stuRes] = await Promise.all([
        apiFetch<{ exceptions: ExceptionCase[] }>(`/exceptions?status=${statusFilter}`),
        apiFetch<{ students: Student[] }>('/students'),
      ]);
      setExceptions(exRes.exceptions || []);
      setStudents(stuRes.students || []);
    } catch (e) {
      console.error('Failed to load exceptions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const openCount = exceptions.filter(e => e.status === 'open').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#B7791F]" />
            <span>Reconciliation Exception Queue</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Review uncertain evidence, amount mismatches, unallocated payments, and unknown student claims
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E2EBE5] shadow-xs">
          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'open'
                ? 'bg-amber-100 text-[#B7791F]'
                : 'text-[#718078] hover:text-[#26352E]'
            }`}
          >
            Open Cases ({openCount})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'resolved'
                ? 'bg-[#DDF7E9] text-[#15966A]'
                : 'text-[#718078] hover:text-[#26352E]'
            }`}
          >
            Resolved Cases
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-stone-200 text-[#26352E]'
                : 'text-[#718078] hover:text-[#26352E]'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Exception Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exceptions.map(item => {
          const isResolved = item.status === 'resolved' || item.status === 'dismissed';

          return (
            <Card
              key={item._id}
              className={`p-5 space-y-3.5 transition-all ${
                isResolved
                  ? 'bg-white opacity-80 border-[#E2EBE5]'
                  : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
              }`}
            >
              {/* Header Badge & Amount */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge variant={isResolved ? 'paid' : 'pending_review'}>
                    {item.reason.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                  {item.evidenceSource ? (
                    <span className="text-[11px] text-[#718078] block">
                      Source: <span className="font-medium text-[#26352E]">{item.evidenceSource.replace(/_/g, ' ')}</span>
                    </span>
                  ) : null}
                </div>

                <div className="text-right">
                  {item.claimedAmount ? (
                    <div className="text-base font-extrabold text-[#18392D]">
                      {formatINR(item.claimedAmount)}
                    </div>
                  ) : null}
                  <span className="text-[10px] text-[#718078] block">
                    {formatDate(item.createdAt)}
                  </span>
                </div>
              </div>

              {/* Exact Reason & Explanation */}
              <div className="p-3 bg-[#F7FCF9] rounded-xl border border-[#E2EBE5] text-xs space-y-1">
                <span className="font-semibold text-[#26352E] block">Issue Summary:</span>
                <p className="text-[#718078] leading-relaxed">
                  {item.notes || 'Evidence received requires manual review.'}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="text-xs text-[#26352E] space-y-1">
                <span className="font-semibold text-[#15966A] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Recommended Next Step:
                </span>
                <p className="text-[#718078] text-[11px] pl-4">{item.recommendedAction}</p>
              </div>

              {/* Resolution Details if Already Resolved */}
              {isResolved ? (
                <div className="p-2.5 bg-[#DDF7E9]/40 rounded-xl border border-[#9DE5BE] text-xs text-[#15966A] space-y-0.5">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {item.status.toUpperCase()}: {item.resolutionAction?.replace('_', ' ')}
                  </span>
                  <p className="text-[11px] text-[#26352E] italic">"{item.resolutionReason}"</p>
                  <span className="text-[10px] text-[#718078]">By {item.resolvedBy || 'Teacher'}</span>
                </div>
              ) : null}

              {/* Action Button */}
              {!isResolved ? (
                <div className="pt-2 border-t border-[#E2EBE5] flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => setResolvingException(item)}
                    className="h-8 text-xs font-bold"
                  >
                    <span>Take Action / Resolve</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {exceptions.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#15966A] bg-white rounded-3xl border border-[#E2EBE5] p-8 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#DDF7E9] flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-[#15966A]" />
          </div>
          <h3 className="font-bold text-base text-[#18392D]">Exception Queue Clear</h3>
          <p className="text-[#718078] max-w-sm mt-1">
            There are currently no open reconciliation exceptions requiring teacher review.
          </p>
        </div>
      ) : null}

      {/* Resolution Modal */}
      <ResolveExceptionModal
        isOpen={!!resolvingException}
        onClose={() => setResolvingException(null)}
        onSuccess={fetchData}
        exception={resolvingException}
        students={students}
      />
    </div>
  );
};
