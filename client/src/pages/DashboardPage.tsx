import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Smartphone,
  Upload,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Card } from '../components/ui/Card.js';
import { Badge } from '../components/ui/Badge.js';
import { Button } from '../components/ui/Button.js';
import { apiFetch } from '../lib/api.js';
import { formatINR, formatDate, formatMonth, getCurrentMonth } from '../lib/utils.js';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async (month: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<any>(`/dashboard/metrics?month=${month}`);
      setData(res);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedMonth);

    const handleReconciled = () => {
      fetchDashboardData(selectedMonth);
    };
    window.addEventListener('rivo:evidence-reconciled', handleReconciled);
    return () => window.removeEventListener('rivo:evidence-reconciled', handleReconciled);
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const summary = data?.summary || {
    totalExpected: 0,
    verifiedCollected: 0,
    outstandingAmount: 0,
    studentsWithOutstanding: 0,
    awaitingReviewCount: 0,
    fullyPaidStudents: 0,
    totalStudentsCount: 0,
  };

  const collectionRate =
    summary.totalExpected > 0
      ? Math.round((summary.verifiedCollected / summary.totalExpected) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#18392D] tracking-tight">
            Fee Reconciliation Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-[#718078] mt-0.5">
            Real-time audit of monthly student fees, verified collections, and exceptions
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E2EBE5] shadow-xs shrink-0">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-[#718078] hover:text-[#26352E] hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 text-sm font-bold text-[#18392D]">
            <Calendar className="w-4 h-4 text-[#15966A]" />
            <span>{formatMonth(selectedMonth)}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 text-[#718078] hover:text-[#26352E] hover:bg-stone-50 rounded-xl transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Phone Simulator Feature Card */}
      <div className="bg-linear-to-r from-[#18392D] via-[#15966A] to-[#128C7E] rounded-3xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Interactive Simulator</span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
            Test Incoming WhatsApp Receipts with Live Phone Simulator
          </h3>
          <p className="text-xs text-emerald-100/90 max-w-2xl leading-relaxed">
            Open a realistic smartphone interface to simulate WhatsApp parent chats (Keerthana, Rao family siblings, Roopa) and trigger real-time OCR extraction & reconciliation into the ledger.
          </p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('rivo:open-simulator'))}
          className="relative z-10 shrink-0 bg-[#DDF7E9] hover:bg-white text-[#18392D] font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 group"
        >
          <Smartphone className="w-4 h-4 text-[#15966A] group-hover:scale-110 transition-transform" />
          <span>Launch Phone Simulator</span>
          <ArrowRight className="w-4 h-4 text-[#15966A] group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/evidence')}
          className="h-10 text-xs font-semibold justify-start bg-[#DDF7E9] text-[#15966A] hover:bg-[#c6efd9]"
        >
          <Smartphone className="w-4 h-4" />
          <span>Record Evidence</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/transactions')}
          className="h-10 text-xs font-semibold justify-start"
        >
          <Upload className="w-4 h-4 text-[#15966A]" />
          <span>Import CSV</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/students')}
          className="h-10 text-xs font-semibold justify-start"
        >
          <Plus className="w-4 h-4 text-[#15966A]" />
          <span>Add Student</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/ledger')}
          className="h-10 text-xs font-semibold justify-start"
        >
          <Calendar className="w-4 h-4 text-[#15966A]" />
          <span>View Ledger</span>
        </Button>
      </div>

      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Fees Expected */}
        <Card className="p-4 bg-white">
          <div className="text-xs text-[#718078] font-medium">Total Fees Due</div>
          <div className="text-xl sm:text-2xl font-bold text-[#18392D] mt-1">
            {formatINR(summary.totalExpected)}
          </div>
          <div className="text-[11px] text-[#718078] mt-1.5">
            {summary.totalStudentsCount} Students in Month
          </div>
        </Card>

        {/* Card 2: Verified Collected */}
        <Card className="p-4 bg-linear-to-br from-white to-[#DDF7E9]/30 border-[#9DE5BE]">
          <div className="text-xs text-[#15966A] font-bold flex items-center justify-between">
            <span>Verified Collected</span>
            <ShieldCheck className="w-4 h-4 text-[#15966A]" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-[#15966A] mt-1">
            {formatINR(summary.verifiedCollected)}
          </div>
          <div className="text-[11px] text-[#15966A] font-medium mt-1.5">
            {collectionRate}% Collected
          </div>
        </Card>

        {/* Card 3: Outstanding Amount */}
        <Card className="p-4 bg-white">
          <div className="text-xs text-[#718078] font-medium">Outstanding Fees</div>
          <div className="text-xl sm:text-2xl font-bold text-[#C24141] mt-1">
            {formatINR(summary.outstandingAmount)}
          </div>
          <div className="text-[11px] text-[#718078] mt-1.5">
            Pending reconciliation
          </div>
        </Card>

        {/* Card 4: Students with Outstanding */}
        <Card className="p-4 bg-white">
          <div className="text-xs text-[#718078] font-medium">Unpaid Students</div>
          <div className="text-xl sm:text-2xl font-bold text-[#B7791F] mt-1">
            {summary.studentsWithOutstanding}
          </div>
          <div className="text-[11px] text-[#718078] mt-1.5">
            Need payment follow-up
          </div>
        </Card>

        {/* Card 5: Fully Paid Students */}
        <Card className="p-4 bg-white">
          <div className="text-xs text-[#718078] font-medium">Fully Paid</div>
          <div className="text-xl sm:text-2xl font-bold text-[#18392D] mt-1">
            {summary.fullyPaidStudents}
          </div>
          <div className="text-[11px] text-[#15966A] font-medium mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Settled in full
          </div>
        </Card>

        {/* Card 6: Payments Awaiting Review */}
        <Card
          onClick={() => navigate('/exceptions')}
          className="p-4 bg-white cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="text-xs text-[#B7791F] font-semibold flex items-center justify-between">
            <span>Awaiting Review</span>
            <AlertTriangle className="w-4 h-4 text-[#B7791F]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#B7791F] mt-1">
            {summary.awaitingReviewCount}
          </div>
          <div className="text-[11px] text-[#718078] mt-1.5 flex items-center gap-1">
            <span>Needs verification</span>
            <ArrowRight className="w-3 h-3 text-[#B7791F]" />
          </div>
        </Card>
      </div>

      {/* Charts Section: Monthly Trend & Batch-wise Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Monthly Collection Trend */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#18392D]">Monthly Fee Collections</h3>
              <p className="text-xs text-[#718078]">Expected vs. Verified Collected (Last 6 Months)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#15966A]" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2EBE5" />
                <XAxis
                  dataKey="month"
                  tickFormatter={m => formatMonth(m).slice(0, 3)}
                  stroke="#718078"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  stroke="#718078"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={v => `₹${v / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  labelFormatter={m => formatMonth(String(m))}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#E2EBE5', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="expected" name="Expected Due" fill="#E2EBE5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Verified Collected" fill="#15966A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Batch-wise Breakdown */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#18392D]">Batch Fee Progress</h3>
              <p className="text-xs text-[#718078]">Collection by dance class batch for {formatMonth(selectedMonth)}</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.batchBreakdown || []}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2EBE5" />
                <XAxis type="number" stroke="#718078" fontSize={11} tickFormatter={v => `₹${v}`} />
                <YAxis
                  type="category"
                  dataKey="batchName"
                  stroke="#718078"
                  fontSize={10}
                  width={110}
                  tickFormatter={name => (name.length > 15 ? name.slice(0, 15) + '…' : name)}
                />
                <Tooltip
                  formatter={(val: any) => formatINR(Number(val))}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', borderColor: '#E2EBE5', fontSize: '12px' }}
                />
                <Bar dataKey="collected" name="Collected" fill="#15966A" radius={[0, 4, 4, 0]} />
                <Bar dataKey="outstanding" name="Outstanding" fill="#F7A8A8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Two Column Section: Recent Activity & Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Transactions */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2EBE5]">
            <h3 className="text-sm font-bold text-[#18392D]">Recent Bank Transactions</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/transactions')}
              className="text-xs"
            >
              View All
            </Button>
          </div>

          <div className="divide-y divide-[#E2EBE5]">
            {data?.recentPayments?.length > 0 ? (
              data.recentPayments.map((txn: any) => (
                <div key={txn._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#26352E]">
                      {txn.payerName || txn.description || 'Direct Transfer'}
                    </div>
                    <div className="text-[11px] text-[#718078] flex items-center gap-2 mt-0.5">
                      <span>{formatDate(txn.paymentDate)}</span>
                      {txn.transactionReference ? (
                        <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">
                          UTR: {txn.transactionReference}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-[#18392D]">{formatINR(txn.amount)}</div>
                    <Badge variant={txn.status} className="mt-1">
                      {txn.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#718078]">
                No transactions recorded yet.
              </div>
            )}
          </div>
        </Card>

        {/* Recent Exceptions requiring attention */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2EBE5]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#18392D]">Exceptions Requiring Review</h3>
              {data?.recentExceptions?.length > 0 ? (
                <span className="bg-amber-100 text-[#B7791F] text-xs font-bold px-2 py-0.5 rounded-full">
                  {data.recentExceptions.length} Open
                </span>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/exceptions')}
              className="text-xs"
            >
              View Queue
            </Button>
          </div>

          <div className="divide-y divide-[#E2EBE5]">
            {data?.recentExceptions?.length > 0 ? (
              data.recentExceptions.map((ex: any) => (
                <div
                  key={ex._id}
                  onClick={() => navigate('/exceptions')}
                  className="py-2.5 flex items-start justify-between gap-3 text-xs cursor-pointer hover:bg-[#F7FCF9] rounded-xl p-2 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="pending_review">
                        {ex.reason.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                      {ex.claimedAmount ? (
                        <span className="font-bold text-[#26352E]">
                          {formatINR(ex.claimedAmount)}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#718078] leading-tight">
                      {ex.notes || ex.recommendedAction}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#718078] shrink-0 mt-1" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#15966A] flex flex-col items-center gap-1">
                <CheckCircle className="w-5 h-5" />
                <span>All caught up! No open exceptions in queue.</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
