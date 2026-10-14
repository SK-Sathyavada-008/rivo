import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, User, Clock, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { apiFetch } from '../lib/api.js';
import { AuditEvent } from '../types/index.js';
import { formatDate } from '../lib/utils.js';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ logs: AuditEvent[] }>('/audit-logs');
      setLogs(res.logs || []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-[#15966A]" />
          <span>Immutable Audit Trail</span>
        </h2>
        <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
          Tamper-evident record of all manual verifications, allocations, reversals, and roster modifications
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2EBE5] overflow-hidden shadow-xs">
        <div className="divide-y divide-[#E2EBE5]">
          {logs.map(log => (
            <div key={log._id} className="p-4 hover:bg-[#F7FCF9]/50 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="paid" className="text-[10px] font-mono uppercase">
                    {log.action}
                  </Badge>
                  <span className="text-xs font-bold text-[#26352E]">{log.targetType}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#718078]">
                  <span className="font-medium text-[#26352E] flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#15966A]" />
                    {log.actorName}
                  </span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {log.reason ? (
                <div className="text-xs text-[#26352E] bg-[#F7FCF9] p-2.5 rounded-xl border border-[#E2EBE5] font-medium">
                  Reason / Notes: <span className="font-normal text-[#718078]">{log.reason}</span>
                </div>
              ) : null}

              {log.afterState ? (
                <div className="text-[11px] font-mono text-[#718078] overflow-x-auto bg-stone-50 p-2 rounded-lg border border-[#E2EBE5] max-h-24">
                  Snapshot: {JSON.stringify(log.afterState)}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#718078]">
            No audit records logged yet.
          </div>
        ) : null}
      </div>
    </div>
  );
};
