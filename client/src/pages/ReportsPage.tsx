import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Calendar, Filter, Users, ShieldAlert } from 'lucide-react';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { apiFetch } from '../lib/api.js';
import { formatINR, formatMonth, getCurrentMonth } from '../lib/utils.js';

export const ReportsPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [collectionsReport, setCollectionsReport] = useState<any>(null);
  const [outstandingReport, setOutstandingReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async (month: string) => {
    setLoading(true);
    try {
      const [colRes, outRes] = await Promise.all([
        apiFetch<any>(`/reports/collections?month=${month}`),
        apiFetch<any>('/reports/outstanding'),
      ]);
      setCollectionsReport(colRes);
      setOutstandingReport(outRes);
    } catch (e) {
      console.error('Failed to load reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedMonth);
  }, [selectedMonth]);

  const handleDownloadCsv = (type: 'collections' | 'outstanding' | 'transactions') => {
    const url = `/api/reports/export-csv?type=${type}&month=${selectedMonth}`;
    const token = localStorage.getItem('rivo_token');
    
    // Fetch with auth and trigger download
    fetch(url, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    })
      .then(res => res.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rivo_${type}_${selectedMonth}.csv`;
        link.click();
      })
      .catch(err => alert('Failed to download CSV: ' + err.message));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#15966A]" />
            <span>Reports & Financial Exports</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Audit-ready reports of monthly collections, fee balances, and raw transaction exports
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-[#E2EBE5] text-xs font-semibold text-[#18392D] shadow-xs">
          <Calendar className="w-4 h-4 text-[#15966A]" />
          <span>{formatMonth(selectedMonth)}</span>
        </div>
      </div>

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Monthly Collections */}
        <Card className="p-5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#18392D]">Monthly Collections</h3>
            <span className="text-xs font-extrabold text-[#15966A]">
              {formatINR(collectionsReport?.totalCollected)}
            </span>
          </div>
          <p className="text-xs text-[#718078] leading-relaxed">
            Detailed breakdown of fees expected and verified collections for {formatMonth(selectedMonth)}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadCsv('collections')}
            className="w-full text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Collections CSV</span>
          </Button>
        </Card>

        {/* Card 2: Outstanding Balances */}
        <Card className="p-5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#18392D]">Outstanding Fees Roster</h3>
            <span className="text-xs font-extrabold text-[#C24141]">
              {formatINR(outstandingReport?.totalOutstanding)}
            </span>
          </div>
          <p className="text-xs text-[#718078] leading-relaxed">
            Complete list of students with outstanding balances, parent contact numbers, and unpaid amounts.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadCsv('outstanding')}
            className="w-full text-xs font-bold text-[#C24141] hover:bg-red-50 border-red-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Outstanding CSV</span>
          </Button>
        </Card>

        {/* Card 3: All Bank Transactions */}
        <Card className="p-5 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#18392D]">All Bank Transactions</h3>
            <span className="text-xs font-semibold text-[#718078]">Bank Statement</span>
          </div>
          <p className="text-xs text-[#718078] leading-relaxed">
            Export all verified, pending, and reversed credit transactions with UTR references and audit status.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadCsv('transactions')}
            className="w-full text-xs font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Transactions CSV</span>
          </Button>
        </Card>
      </div>

      {/* Outstanding Students Preview Table */}
      <Card className="space-y-3 p-5 bg-white">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2EBE5]">
          <div>
            <h3 className="font-bold text-sm text-[#18392D]">Students with Outstanding Fees</h3>
            <p className="text-xs text-[#718078]">Requires parent fee reminder on WhatsApp</p>
          </div>
          <span className="font-bold text-xs text-[#C24141] bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
            Total Outstanding: {formatINR(outstandingReport?.totalOutstanding)}
          </span>
        </div>

        <div className="divide-y divide-[#E2EBE5]">
          {outstandingReport?.obligations?.slice(0, 8).map((ob: any) => (
            <div key={ob._id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#26352E]">{ob.studentId?.name}</span>
                <span className="text-[#718078] ml-2">({ob.studentId?.batchId?.name || 'Class'})</span>
                {ob.studentId?.guardianPhone ? (
                  <span className="text-[#15966A] ml-2 font-mono">
                    WA: {ob.studentId.guardianPhone}
                  </span>
                ) : null}
              </div>
              <div className="font-bold text-sm text-[#C24141]">
                {formatINR(ob.outstandingBalance)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
