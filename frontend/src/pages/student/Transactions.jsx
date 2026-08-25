import React, { useState, useEffect } from 'react';
import { Coins, ArrowDownLeft, ArrowUpRight, RotateCcw, ShieldCheck, Sparkles, AlertTriangle, Calendar, CreditCard, PlusCircle, RefreshCw, ChevronRight } from 'lucide-react';
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
        <div className="h-44 bg-white rounded-3xl border border-slate-200/80 shadow-stripe" />
        <div className="h-72 bg-white rounded-3xl border border-slate-200/80 shadow-stripe" />
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Credit Ledger & Balances
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Immutable audit record of 9,000 monthly allowance, meal transactions, and Razorpay refills
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`p-2.5 bg-white border border-slate-200/80 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition shadow-stripe-sm ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh transactions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsTopupOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange transition-all duration-150 flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buy Credits (₹1 = 1 Cr)</span>
          </button>
        </div>
      </div>

      {/* Credit Summary Card (Stripe Light Glass Card Style) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-stripe-md border border-slate-200/80 relative overflow-hidden">
        {/* Soft background ambient gradient glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-orange-400/10 via-amber-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-600">Current Monthly Cycle</span>
              <span className="bg-slate-100 text-[11px] px-2.5 py-0.5 rounded-full font-bold text-slate-600 border border-slate-200/60">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 tabular-nums">
                {credits.remaining_credits.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {credits.monthly_limit.toLocaleString()} Monthly Credits
              </span>
            </div>
            
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              Standard 9,000 monthly credits granted to active VIT students, plus any purchased Razorpay credits.
            </p>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2.5xl p-5 w-full md:w-80 space-y-3 shadow-stripe-sm">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">Credit Utilization</span>
              <span className="text-orange-600 font-extrabold">{percentageUsed}% used</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${percentageUsed}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400 tabular-nums">
              <span>Used: {credits.used_credits} Crs</span>
              <span>Remaining: {credits.remaining_credits} Crs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-stripe overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-base text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-400 font-medium">{transactions.length} record(s) logged</p>
          </div>

          {/* Filter Pills (Stripe Segmented Style) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/60 rounded-2xl overflow-x-auto scrollbar-none shadow-stripe-sm">
            {[
              { key: 'ALL', label: 'All' },
              { key: 'TOPUP', label: 'Top-ups (₹)' },
              { key: 'DEBIT_ORDER', label: 'Orders' },
              { key: 'CREDIT_REFUND', label: 'Refunds' },
              { key: 'MONTHLY_ALLOWANCE', label: 'Allowance' },
              { key: 'ADMIN_ADJUSTMENT', label: 'Adjustments' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterType(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-150 whitespace-nowrap ${
                  filterType === f.key
                    ? 'bg-white text-slate-900 shadow-stripe-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
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
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Type / Description</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-6 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-slate-400">
                    No transactions found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isTopup = tx.transaction_type === 'TOPUP';
                  const isDebit = tx.transaction_type === 'DEBIT_ORDER';
                  const isRefund = tx.transaction_type === 'CREDIT_REFUND';
                  const isAllowance = tx.transaction_type === 'MONTHLY_ALLOWANCE';

                  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                  let Icon = Coins;

                  if (isTopup) {
                    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
                    Icon = CreditCard;
                  } else if (isDebit) {
                    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200/80';
                    Icon = ArrowDownLeft;
                  } else if (isRefund) {
                    badgeColor = 'bg-sky-50 text-sky-700 border-sky-200/80';
                    Icon = RotateCcw;
                  } else if (isAllowance) {
                    badgeColor = 'bg-purple-50 text-purple-700 border-purple-200/80';
                    Icon = Sparkles;
                  } else {
                    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200/80';
                    Icon = ShieldCheck;
                  }

                  return (
                    <tr key={tx.transaction_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 shadow-stripe-sm ${badgeColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {tx.notes || tx.transaction_type}
                            </span>
                            <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border mt-0.5 ${badgeColor}`}>
                              {isTopup ? '💳 RAZORPAY TOPUP' : tx.transaction_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap text-xs font-medium">
                        {new Date(tx.transaction_time).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </td>
                      <td className={`py-4 px-4 text-right font-black tabular-nums ${
                        isDebit ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Credits
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-slate-800 tabular-nums">
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
