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
      
      {/* 1. HERO CREDIT BALANCE CARD with Display-Size Number */}
      <div className="card bg-gradient-to-br from-[#1A1F3A] via-[#131728] to-[#0B0E1A] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border-[#8B5CF6]/30 shadow-glow-primary">
        
        {/* Left: Display-Size Hero Balance */}
        <div className="space-y-3 max-w-lg">
          <div className="flex items-center gap-2">
            <span className="text-micro text-[#8B5CF6] font-semibold">
              Available Dining Credits
            </span>
            <span className="status-pill status-pill-success text-[11px] py-0.5 px-2">
              Live Ledger
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-display font-bold tabular-nums tracking-tight">
              {remaining.toLocaleString()}
            </h1>
            <span className="text-body text-base font-semibold">
              / 9,000 allowance
            </span>
          </div>

          {/* Monthly Allowance Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-muted font-medium">
              <span>{used.toLocaleString()} Credits Spent This Cycle</span>
              <span className="text-[#06B6D4] font-heading">{usedPercentage}% Utilized</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#0B0E1A] border border-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] transition-all duration-500 shadow-glow-primary"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Buy Credits CTA Card */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsTopupOpen(true)}
            className="w-full sm:w-auto btn-primary py-3.5 px-6 shadow-glow-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Buy Credits via Razorpay</span>
          </button>
        </div>
      </div>

      {/* 2. TRANSACTIONS LEDGER TABLE (56px row height, hover highlight, status pills) */}
      <div className="card-static space-y-4 p-5 sm:p-6">
        
        {/* Header & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider">
          <div>
            <h2 className="text-h2 text-ink font-heading">
              Credit Ledger Records
            </h2>
            <p className="text-body text-xs mt-0.5">
              Transparent, immutable history of all meals purchased, top-ups, and refunds
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-[#0B0E1A] p-1 rounded-xl border border-border">
            {['ALL', 'DEBIT', 'TOPUP', 'CREDIT'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all duration-200 ${
                  filterType === type
                    ? 'bg-[#131728] text-ink border border-[#8B5CF6]/40 shadow-glow-primary'
                    : 'text-muted hover:text-ink'
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
            <thead className="text-micro text-muted border-b border-divider bg-[#0B0E1A]/60">
              <tr>
                <th className="py-3 px-4">Transaction / Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted animate-pulse">
                    Loading credit transactions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted">
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
                      className="h-14 hover:bg-[#1A1F3A]/70 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDebit 
                              ? 'bg-[#F87171]/15 text-status-danger border-[#F87171]/30' 
                              : isTopup 
                              ? 'bg-[#34D399]/15 text-status-success border-[#34D399]/30 shadow-glow-emerald' 
                              : 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 shadow-glow-primary'
                          }`}>
                            {isDebit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-semibold text-ink block font-heading">
                              #{tx.transaction_id}
                            </span>
                            <span className="text-[10px] text-muted uppercase font-medium">
                              {tx.transaction_type}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-body font-medium">
                        {tx.notes || (isDebit ? 'Mess meal order payment' : isTopup ? 'Razorpay credit top-up' : 'Credit adjustment')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold tabular-nums text-sm font-heading ${
                          isDebit ? 'text-status-danger' : 'text-status-success'
                        }`}>
                          {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Credits
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-ink tabular-nums font-heading">
                        {tx.balance_after?.toLocaleString() ?? tx.balance_after}
                      </td>

                      <td className="py-3 px-4 text-right text-muted text-xs whitespace-nowrap">
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
