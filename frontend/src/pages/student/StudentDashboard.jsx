import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Search, 
  Sparkles, 
  ShoppingBag, 
  Coins, 
  CreditCard, 
  Clock, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Megaphone, 
  ArrowUpRight, 
  Receipt, 
  Zap 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';
import { MenuCard } from '../../components/MenuCard';
import { TopupModal } from '../../components/TopupModal';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages'];

export function StudentDashboard({ onNavigateToOrders, onNavigateToTransactions }) {
  const { user } = useAuth();
  const { cart = [], totalAmount = 0, totalCount = 0, setIsOpen: setCartOpen } = useCart();
  
  const [items, setItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [menuRes, transRes] = await Promise.all([
        api.getMenu(),
        api.getTransactions().catch(() => ({ transactions: [] }))
      ]);
      setItems(menuRes?.items || []);
      setRecentTransactions(transRes?.transactions?.slice(0, 4) || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const remainingCredits = user?.credits?.remaining ?? 9000;
  const usedCredits = user?.credits?.used ?? 0;
  const isLow = remainingCredits < 500;

  const filteredItems = (items || []).filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle="VIT Campus Mess Network • 9,000 monthly dining credits cycle" />

      {/* 2. HERO STAT ROW (4 Equal-Width Glass Cards, Balance is Featured) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Balance */}
        <StatCard
          title="Available Balance"
          value={`${remainingCredits.toLocaleString()} Cr`}
          subtitle="Monthly credit allocation"
          icon={Coins}
          color="violet"
          isFeatured={true}
          trend={isLow ? 'Low Balance' : 'Active'}
          trendPositive={!isLow}
        />

        {/* Stat 2: Used Monthly Credits */}
        <StatCard
          title="Spent This Cycle"
          value={`${usedCredits.toLocaleString()} Cr`}
          subtitle="Campus dining spend"
          icon={CreditCard}
          color="violet"
          trend="Monthly Spend"
          trendPositive={true}
        />

        {/* Stat 3: Active Meal Tray */}
        <StatCard
          title="Meal Tray Items"
          value={`${totalCount || (cart || []).length} ${(totalCount || (cart || []).length) === 1 ? 'dish' : 'dishes'}`}
          subtitle={totalAmount > 0 ? `Subtotal: ${totalAmount} credits` : 'Tray is ready'}
          icon={ShoppingBag}
          color="violet"
          onClick={() => setCartOpen(true)}
        />

        {/* Stat 4: Mess Service Status */}
        <StatCard
          title="Campus Mess Status"
          value="Kitchen Open"
          subtitle="Accepting meal orders"
          icon={Sparkles}
          color="cyan"
          trend="Live Queue"
          trendPositive={true}
        />
      </div>

      {/* 3. MAIN GRID (70% Primary Content + 30% Sidebar Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 70% (col-span-8): Primary Content Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section A: Today's Menu Catalog Card */}
          <div className="card space-y-6 p-6 sm:p-7">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider">
              <div>
                <h2 className="text-h2 text-ink font-heading">
                  Today's Dining Menu
                </h2>
                <p className="text-body text-xs mt-0.5">
                  Select dishes to add to your tray and generate instant pickup tokens
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-56 shrink-0">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {(CATEGORIES || []).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-glow-primary'
                      : 'bg-[#0B0E1A] text-body hover:text-ink hover:bg-[#1A1F3A] border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dishes Catalog Grid */}
            {loading ? (
              <div className="py-16 text-center text-muted">
                <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-glow-primary" />
                <p className="text-xs font-semibold">Loading daily fresh menu...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-muted space-y-2">
                <UtensilsCrossed className="w-10 h-10 mx-auto text-muted" />
                <h3 className="text-h3 text-ink font-heading">No dishes found</h3>
                <p className="text-body text-xs">Try selecting a different meal category or clearing your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {(filteredItems || []).map((item) => (
                  <MenuCard key={item.item_id} item={item} />
                ))}
              </div>
            )}

          </div>

          {/* Section B: Recent Transactions / Activity Table */}
          <div className="card space-y-4 p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div>
                <h3 className="text-h3 text-ink font-heading">Recent Dining Activity</h3>
                <p className="text-body text-xs mt-0.5">Latest meal orders and credit movements</p>
              </div>

              {onNavigateToTransactions && (
                <button
                  onClick={onNavigateToTransactions}
                  className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentTransactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">No dining activity recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="text-micro text-muted border-b border-divider bg-[#0B0E1A]/40">
                    <tr>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {recentTransactions.map((tx) => {
                      const isDebit = tx.transaction_type === 'DEBIT_ORDER';

                      return (
                        <tr key={tx.transaction_id} className="h-14 hover:bg-[#1A1F3A]/70 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`status-pill text-[11px] font-heading ${
                              isDebit ? 'status-pill-danger' : 'status-pill-success'
                            }`}>
                              {isDebit ? 'Food Order' : 'Top-Up / Credit'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-ink font-medium">
                            {tx.notes || (isDebit ? 'Mess meal purchase' : 'Credit adjustment')}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold tabular-nums font-heading ${
                            isDebit ? 'text-status-danger' : 'text-status-success'
                          }`}>
                            {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Cr
                          </td>
                          <td className="py-3 px-4 text-right text-muted tabular-nums font-heading">
                            {tx.balance_after?.toLocaleString() ?? tx.balance_after}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 30% (col-span-4): Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Quick Actions Card */}
          <div className="card space-y-4">
            <h3 className="text-h3 text-ink font-heading pb-2 border-b border-divider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#8B5CF6]" />
              <span>Quick Actions</span>
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => setCartOpen(true)}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Review Meal Tray</span>
                </div>
                <span className="status-pill status-pill-info text-[10px]">
                  {(cart || []).length} items
                </span>
              </button>

              <button
                onClick={onNavigateToOrders}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#06B6D4] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Track Live Tokens</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>

              <button
                onClick={onNavigateToTransactions}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Credit Ledger & History</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>
            </div>
          </div>

          {/* Widget 2: Announcements / Notices Card */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-divider">
              <Megaphone className="w-4 h-4 text-[#8B5CF6]" />
              <h3 className="text-h3 text-ink font-heading">Mess Announcements</h3>
            </div>

            <div className="space-y-3 text-xs text-body">
              <div className="p-3 bg-[#0B0E1A] rounded-xl border border-border space-y-1">
                <span className="font-bold text-ink block font-heading">🕒 Dining Service Timings</span>
                <p className="text-muted leading-relaxed">
                  Breakfast: 7:30 - 10:00 AM • Lunch: 12:00 - 3:00 PM • Dinner: 7:30 - 10:00 PM.
                </p>
              </div>

              <div className="p-3 bg-[#0B0E1A] rounded-xl border border-border space-y-1">
                <span className="font-bold text-ink block font-heading">✨ Monthly Credit Reset</span>
                <p className="text-muted leading-relaxed">
                  Monthly 9,000 allowance resets automatically on the 1st of every month.
                </p>
              </div>
            </div>
          </div>

          {/* Widget 3: Buy Credits CTA Card */}
          <div className="card bg-gradient-to-br from-[#1A1F3A] via-[#131728] to-[#0B0E1A] border-[#8B5CF6]/40 shadow-glow-primary space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] text-white flex items-center justify-center shadow-glow-primary">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink font-heading">Top Up Credits</h3>
                <span className="text-[11px] text-[#06B6D4] font-medium font-heading">1 Credit = ₹1 INR</span>
              </div>
            </div>

            <p className="text-body text-xs leading-relaxed">
              Need extra dining balance? Instant Razorpay top-ups via UPI, Debit Card, or NetBanking.
            </p>

            <button
              onClick={() => setIsTopupOpen(true)}
              className="w-full btn-primary py-2.5 text-xs justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buy Dining Credits</span>
            </button>
          </div>

        </div>

      </div>

      {/* Razorpay Top-Up Modal */}
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
