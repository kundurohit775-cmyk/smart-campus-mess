import React, { useState, useEffect } from 'react';
import { Coins, ArrowDownLeft, ArrowUpRight, RotateCcw, ShieldCheck, Sparkles, AlertTriangle, Calendar, CreditCard, PlusCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TopupModal } from '../../components/TopupModal';

export function Transactions() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  const fetchCreditsData = async () => {
    if (!user) return;
    try {
      const res = await api.getCredits(user.id);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch credit ledger:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCreditsData();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCreditsData();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-40 bg-white rounded-3xl border border-slate-200" />
        <div className="h-64 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  const credits = data?.credits || { monthly_limit: 9000, used_credits: 0, remaining_credits: 9000 };
  const transactions = data?.transactions || [];

  const percentageUsed = Math.min(100, Math.round((credits.used_credits / credits.monthly_limit) * 100));

  const filteredTransactions = transactions.filter(tx => {
    if (filterType === 'ALL') return true;
    return tx.transaction_type === filterType;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Credit Ledger & Balance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete transparent audit trail of monthly allowances, meal orders, and Razorpay top-ups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh transactions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsTopupOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center gap-2 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buy Credits (₹1 = 1 Cr)</span>
          </button>
        </div>
      </div>

      {/* Credit Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Current Monthly Cycle</span>
              <span className="bg-white/10 text-[11px] px-2.5 py-0.5 rounded-full font-medium text-slate-300">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                {credits.remaining_credits.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                / {credits.monthly_limit.toLocaleString()} Credits
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Fixed monthly allowance of 9,000 credits plus purchased Razorpay credits.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 w-full md:w-72 space-y-3 backdrop-blur-md">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Credit Utilization</span>
              <span className="text-orange-400">{percentageUsed}% used</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Used: {credits.used_credits}</span>
              <span>Remaining: {credits.remaining_credits}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-500">{transactions.length} record(s) logged</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'TOPUP', label: 'Top-ups (₹)' },
              { key: 'DEBIT_ORDER', label: 'Orders' },
              { key: 'CREDIT_REFUND', label: 'Refunds' },
              { key: 'MONTHLY_ALLOWANCE', label: 'Monthly Allowance' },
              { key: 'ADMIN_ADJUSTMENT', label: 'Adjustments' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  filterType === f.key
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-5">Type / Description</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-5 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-slate-400">
                    No transactions found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isTopup = tx.transaction_type === 'TOPUP';
                  const isDebit = tx.transaction_type === 'DEBIT_ORDER';
                  const isRefund = tx.transaction_type === 'CREDIT_REFUND';
                  const isAllowance = tx.transaction_type === 'MONTHLY_ALLOWANCE';

                  let badgeColor = 'bg-slate-100 text-slate-700';
                  let Icon = Coins;

                  if (isTopup) {
                    badgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                    Icon = CreditCard;
                  } else if (isDebit) {
                    badgeColor = 'bg-rose-100 text-rose-700';
                    Icon = ArrowDownLeft;
                  } else if (isRefund) {
                    badgeColor = 'bg-teal-100 text-teal-700';
                    Icon = RotateCcw;
                  } else if (isAllowance) {
                    badgeColor = 'bg-purple-100 text-purple-700';
                    Icon = Sparkles;
                  } else {
                    badgeColor = 'bg-amber-100 text-amber-700';
                    Icon = ShieldCheck;
                  }

                  return (
                    <tr key={tx.transaction_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${badgeColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {tx.notes || tx.transaction_type}
                            </span>
                            <span className={`inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded mt-0.5 ${badgeColor}`}>
                              {isTopup ? '💳 RAZORPAY TOPUP' : tx.transaction_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(tx.transaction_time).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className={`py-4 px-4 text-right font-black ${
                        isDebit ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Credits
                      </td>
                      <td className="py-4 px-5 text-right font-extrabold text-slate-800">
                        {Number(tx.balance_after).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topup Modal */}
      <TopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        onSuccess={() => fetchCreditsData()}
      />
    </div>
  );
}
