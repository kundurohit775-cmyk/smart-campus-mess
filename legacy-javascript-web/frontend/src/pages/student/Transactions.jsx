import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Filter, 
  Receipt, 
  Calendar, 
  CreditCard, 
  Sparkles, 
  TrendingDown, 
  Lock, 
  ArrowRight 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { TopupModal } from '../../components/TopupModal';

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.getTransactions();
        setTransactions(res?.transactions || []);
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const remaining = user?.credits?.remaining ?? 9000;
  const used = user?.credits?.used ?? 0;
  const monthlyTotal = 9000;
  const usedPercentage = Math.min(100, Math.round((used / monthlyTotal) * 100));

  const transList = Array.isArray(transactions) ? transactions : [];

  const filtered = transList.filter(t => {
    if (filterType === 'DEBIT') return t.transaction_type === 'DEBIT_ORDER';
    if (filterType === 'TOPUP') return t.transaction_type === 'TOPUP';
    if (filterType === 'CREDIT') return t.transaction_type === 'CREDIT_MONTHLY' || t.transaction_type === 'CREDIT_REFUND';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* 1. HERO CREDIT BALANCE CARD */}
      <div className="card bg-[#FFF7F0] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-orange-200/80 shadow-soft-sm">
        
        {/* Left: Display-Size Hero Balance */}
        <div className="space-y-3 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">
              Available Dining Credits
            </span>
            <span className="status-pill status-pill-success text-[11px] py-0.5 px-2 bg-white shadow-soft-sm">
              Live Ledger
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E1B16] font-heading tabular-nums tracking-tight">
              {remaining.toLocaleString()}
            </h1>
            <span className="text-sm font-semibold text-[#6B6560]">
              / 9,000 allowance
            </span>
          </div>

          {/* Monthly Allowance Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-[#6B6560] font-medium">
              <span>{used.toLocaleString()} Credits Spent This Cycle</span>
              <span className="text-[#FF6B35] font-heading font-semibold">{usedPercentage}% Utilized</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF6B35] transition-all duration-300"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Buy Credits CTA Card */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsTopupOpen(true)}
            className="w-full sm:w-auto btn-primary py-3.5 px-6 shadow-btn-orange"
          >
            <Plus className="w-4 h-4" />
            <span>Buy Credits via Razorpay</span>
          </button>
        </div>
      </div>

      {/* 2. TRANSACTIONS LEDGER TABLE */}
      <div className="card-static space-y-4 p-5 sm:p-6">
        
        {/* Header & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-bold text-[#1E1B16] font-heading">
              Credit Ledger Records
            </h2>
            <p className="text-xs text-[#6B6560] mt-0.5">
              Transparent, immutable history of all meals purchased, top-ups, and refunds
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            {['ALL', 'DEBIT', 'TOPUP', 'CREDIT'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-180 ${
                  filterType === type
                    ? 'bg-white text-[#FF6B35] shadow-soft-sm font-bold border border-orange-100'
                    : 'text-[#6B6560] hover:text-[#1E1B16]'
                }`}
              >
                {type === 'ALL' ? 'All Records' : type === 'DEBIT' ? 'Food Orders' : type === 'TOPUP' ? 'Razorpay Topups' : 'Allowances'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="py-3 px-4">Transaction / Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[#6B6560] animate-pulse">
                    Loading credit transactions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-[#9B9590]">
                    No transactions found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => {
                  const isDebit = tx.transaction_type === 'DEBIT_ORDER';
                  const isTopup = tx.transaction_type === 'TOPUP';

                  return (
                    <tr 
                      key={tx.transaction_id} 
                      className="h-14 hover:bg-stone-50/80 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDebit 
                              ? 'bg-red-50 text-[#DC2626] border-red-200' 
                              : isTopup 
                              ? 'bg-emerald-50 text-[#16A34A] border-emerald-200' 
                              : 'bg-orange-50 text-[#FF6B35] border-orange-200'
                          }`}>
                            {isDebit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-semibold text-[#1E1B16] block font-heading">
                              #{tx.transaction_id}
                            </span>
                            <span className="text-[10px] text-[#9B9590] uppercase font-medium">
                              {tx.transaction_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#1E1B16] font-medium">
                        <div>
                          <span>{tx.notes || (isDebit ? 'Mess meal order payment' : isTopup ? 'Razorpay credit top-up' : 'Credit adjustment')}</span>
                          {tx.total_calories > 0 && (
                            <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200/80 text-[10px] font-bold text-[#FF6B35] font-heading">
                              🔥 {tx.total_calories} kcal
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold tabular-nums text-sm font-heading ${
                          isDebit ? 'text-[#DC2626]' : 'text-[#16A34A]'
                        }`}>
                          {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Credits
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-[#1E1B16] tabular-nums font-heading">
                        {tx.balance_after?.toLocaleString() ?? tx.balance_after}
                      </td>

                      <td className="py-3 px-4 text-right text-[#6B6560] text-xs whitespace-nowrap">
                        {new Date(tx.transaction_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
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
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
