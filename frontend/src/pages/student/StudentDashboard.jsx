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
  Zap,
  Heart,
  Flame,
  Edit3
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';
import { MenuCard } from '../../components/MenuCard';
import { TopupModal } from '../../components/TopupModal';
import { Modal } from '../../components/Modal';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages'];
const GOAL_PRESETS = [1500, 2000, 2500];

export function StudentDashboard({ onNavigateToOrders, onNavigateToTransactions }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { cart = [], totalAmount = 0, totalCount = 0, setIsOpen: setCartOpen } = useCart();
  
  const [items, setItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  // Health Mode states
  const [healthMode, setHealthMode] = useState(() => {
    return localStorage.getItem('smartmess_health_mode') === 'true';
  });
  const [healthStats, setHealthStats] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [menuRes, transRes, healthRes] = await Promise.all([
        api.getMenu(),
        api.getTransactions().catch(() => ({ transactions: [] })),
        api.getHealthStats().catch(() => null)
      ]);
      setItems(menuRes?.items || []);
      setRecentTransactions(transRes?.transactions?.slice(0, 4) || []);
      if (healthRes) {
        setHealthStats(healthRes);
        const goal = healthRes.goal ?? healthRes.dailyCalorieGoal;
        if (goal) {
          setGoalInput(goal);
        }
        if (healthRes.healthModeEnabled !== undefined) {
          const syncedHM = Boolean(healthRes.healthModeEnabled);
          setHealthMode(syncedHM);
          localStorage.setItem('smartmess_health_mode', String(syncedHM));
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleHealthMode = async () => {
    const nextVal = !healthMode;
    setHealthMode(nextVal);
    localStorage.setItem('smartmess_health_mode', String(nextVal));

    // Persist to backend per-student preference
    api.setHealthMode(nextVal).catch(() => {});

    if (nextVal) {
      showToast('Health Mode ON: Filtered to diet-friendly items (≤400 kcal)', 'success', 3000);
      // If student hasn't set a goal yet, show modal to prompt setting goal
      const currentGoal = healthStats?.goal ?? healthStats?.dailyCalorieGoal;
      if (!currentGoal) {
        setIsGoalModalOpen(true);
      }
    } else {
      showToast('Health Mode OFF: Showing full dining menu', 'info', 2000);
    }
  };

  const handleSaveGoal = async (targetGoal) => {
    const val = parseInt(targetGoal || goalInput, 10);
    if (!val || isNaN(val) || val < 500) {
      showToast('Please enter a realistic calorie goal (min 500 kcal).', 'warning');
      return;
    }

    setSavingGoal(true);
    try {
      const res = await api.setCalorieGoal(val);
      const updatedGoal = res.goal ?? res.dailyCalorieGoal;
      setHealthStats(prev => ({
        ...prev,
        goal: updatedGoal,
        dailyCalorieGoal: updatedGoal,
        consumed: res.consumed ?? (prev?.consumed || prev?.consumedToday || 0),
        consumedToday: res.consumedToday ?? (prev?.consumedToday || prev?.consumed || 0)
      }));
      setGoalInput(updatedGoal);
      setIsGoalModalOpen(false);
      showToast(`Daily calorie goal set to ${updatedGoal} kcal!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save goal', 'error');
    } finally {
      setSavingGoal(false);
    }
  };

  const remainingCredits = user?.credits?.remaining ?? 9000;
  const usedCredits = user?.credits?.used ?? 0;
  const isLow = remainingCredits < 500;

  const consumedToday = healthStats?.consumed ?? healthStats?.consumedToday ?? 0;
  const dailyCalorieGoal = healthStats?.goal ?? healthStats?.dailyCalorieGoal ?? null;
  const hasGoalSet = Boolean(dailyCalorieGoal && dailyCalorieGoal > 0);
  const progressPercent = hasGoalSet ? Math.min(100, Math.round((consumedToday / dailyCalorieGoal) * 100)) : 0;
  const isOverGoal = Boolean(hasGoalSet && consumedToday > dailyCalorieGoal);

  const filteredItems = (items || []).filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // When Health Mode is ON, strictly filter to is_healthy items only
    const matchesHealth = !healthMode || Boolean(item.is_healthy || item.isHealthy);
    return matchesCategory && matchesSearch && matchesHealth;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle="VIT Campus Mess Network • 9,000 monthly dining credits cycle" />

      {/* 2. HERO STAT ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Balance */}
        <StatCard
          title="Available Balance"
          value={`${remainingCredits.toLocaleString()} Credits`}
          subtitle="Monthly credit allocation"
          icon={Coins}
          color="orange"
          isFeatured={true}
          trend={isLow ? 'Low Balance' : 'Active Wallet'}
          trendPositive={!isLow}
        />

        {/* Stat 2: Spent Monthly Credits */}
        <StatCard
          title="Spent This Cycle"
          value={`${usedCredits.toLocaleString()} Credits`}
          subtitle="Campus dining spend"
          icon={CreditCard}
          color="orange"
          trend="Monthly Spend"
          trendPositive={true}
        />

        {/* Stat 3: Active Meal Tray */}
        <StatCard
          title="Meal Tray Items"
          value={`${totalCount || (cart || []).length} ${(totalCount || (cart || []).length) === 1 ? 'dish' : 'dishes'}`}
          subtitle={totalAmount > 0 ? `Subtotal: ${totalAmount} credits` : 'Tray is ready'}
          icon={ShoppingBag}
          color="orange"
          onClick={() => setCartOpen(true)}
        />

        {/* Stat 4: Mess Service Status */}
        <StatCard
          title="Campus Mess Status"
          value="Kitchen Open"
          subtitle="Accepting meal orders"
          icon={Sparkles}
          color="success"
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
            
            {/* Header & Filter Controls + Health Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading">
                    Today's Dining Menu
                  </h2>
                  {healthMode && (
                    <span className="status-pill status-pill-success text-[10px] font-heading font-bold">
                      Diet-Friendly Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6560] mt-0.5">
                  {healthMode 
                    ? 'Showing only diet-friendly dishes (≤400 kcal or chef recommended)'
                    : 'Select dishes to add to your tray and generate instant pickup tokens'
                  }
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Health Mode Switch */}
                <button
                  type="button"
                  onClick={handleToggleHealthMode}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
                    healthMode
                      ? 'bg-[#FFF7F0] text-[#FF6B35] border-orange-300 shadow-soft-sm'
                      : 'bg-stone-100 text-[#6B6560] border-stone-200 hover:text-[#1E1B16]'
                  }`}
                  title="Toggle diet-friendly filtering and daily calorie tracking"
                >
                  <Heart className={`w-3.5 h-3.5 ${healthMode ? 'fill-[#FF6B35] text-[#FF6B35]' : 'text-[#9B9590]'}`} />
                  <span className="font-heading">Health Mode</span>
                  <span className={`w-2 h-2 rounded-full ${healthMode ? 'bg-[#FF6B35] animate-pulse' : 'bg-stone-300'}`} />
                </button>

                {/* Search Bar */}
                <div className="relative flex-1 sm:w-48 shrink-0">
                  <Search className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-9 pr-3 py-1.5 rounded-xl text-xs focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Health Mode Sticky / Top Calorie Progress Bar */}
            {healthMode && (
              <div className="p-4 rounded-2xl bg-[#FFF7F0] border border-orange-200 shadow-soft-sm space-y-2.5 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FF6B35] text-white flex items-center justify-center shadow-soft-sm font-bold shrink-0">
                      <Flame className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E1B16] font-heading">Daily Calorie Tracker</span>
                        <span className="text-[10px] text-[#6B6560] font-medium bg-white px-2 py-0.5 rounded-full border border-stone-200">
                          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6560] mt-0.5">
                        {hasGoalSet ? (
                          <>
                            Consumed today: <strong className="text-[#1E1B16] font-heading font-bold">{consumedToday}</strong> / <span className="font-heading font-bold text-[#FF6B35]">{dailyCalorieGoal} kcal</span>
                          </>
                        ) : (
                          <>
                            Consumed today: <strong className="text-[#1E1B16] font-heading font-bold">{consumedToday} kcal</strong> • <span className="text-[#9B9590]">No target goal set</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isOverGoal && (
                      <span className="status-pill status-pill-warning text-[10px] font-heading">
                        Goal Exceeded (+{consumedToday - dailyCalorieGoal} kcal)
                      </span>
                    )}
                    <button
                      onClick={() => setIsGoalModalOpen(true)}
                      className="text-xs font-semibold text-[#FF6B35] hover:text-[#E85A2A] bg-white px-2.5 py-1 rounded-lg border border-orange-200 shadow-soft-sm flex items-center gap-1 transition"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{hasGoalSet ? 'Edit Goal' : 'Set Daily Goal'}</span>
                    </button>
                  </div>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full bg-stone-200/80 rounded-full h-2.5 overflow-hidden">
                  {hasGoalSet ? (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverGoal ? 'bg-gradient-to-r from-[#FF6B35] to-[#DC2626]' : 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E]'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  ) : (
                    <div className="h-full w-full bg-stone-200 rounded-full" />
                  )}
                </div>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {(CATEGORIES || []).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                    selectedCategory === cat
                      ? 'bg-[#FF6B35] text-white shadow-btn-orange font-bold'
                      : 'bg-stone-100 text-[#6B6560] hover:text-[#1E1B16] hover:bg-stone-200/80 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dishes Catalog Grid */}
            {loading ? (
              <div className="py-16 text-center text-[#6B6560]">
                <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-semibold">Loading daily fresh menu...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center text-[#6B6560] space-y-2">
                <UtensilsCrossed className="w-10 h-10 mx-auto text-[#9B9590]" />
                <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                  {healthMode ? 'No diet-friendly dishes found' : 'No dishes found'}
                </h3>
                <p className="text-xs text-[#6B6560]">
                  {healthMode 
                    ? 'No items match the diet-friendly filter in this category. Try choosing "All" or turning off Health Mode.'
                    : 'Try selecting a different meal category or clearing your search.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {(filteredItems || []).map((item) => (
                  <MenuCard 
                    key={item.item_id} 
                    item={item} 
                    healthMode={healthMode}
                    consumedToday={consumedToday}
                    dailyCalorieGoal={dailyCalorieGoal}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Section B: Recent Transactions / Activity Table */}
          <div className="card space-y-4 p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-[#1E1B16] font-heading">Recent Dining Activity</h3>
                <p className="text-xs text-[#6B6560] mt-0.5">Latest meal orders and credit movements</p>
              </div>

              {onNavigateToTransactions && (
                <button
                  onClick={onNavigateToTransactions}
                  className="text-xs font-semibold text-[#FF6B35] hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentTransactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#9B9590]">No dining activity recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] border-b border-stone-200 bg-stone-50">
                    <tr>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {recentTransactions.map((tx) => {
                      const isDebit = tx.transaction_type === 'DEBIT_ORDER';

                      return (
                        <tr key={tx.transaction_id} className="h-14 hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`status-pill text-[11px] font-heading ${
                              isDebit ? 'status-pill-danger' : 'status-pill-success'
                            }`}>
                              {isDebit ? 'Food Order' : 'Top-Up / Credit'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#1E1B16] font-medium">
                            {tx.notes || (isDebit ? 'Mess meal purchase' : 'Credit adjustment')}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold tabular-nums font-heading ${
                            isDebit ? 'text-[#DC2626]' : 'text-[#16A34A]'
                          }`}>
                            {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Cr
                          </td>
                          <td className="py-3 px-4 text-right text-[#6B6560] tabular-nums font-heading">
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
            <h3 className="text-base font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF6B35]" />
              <span>Quick Actions</span>
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => setCartOpen(true)}
                className="w-full p-3 rounded-xl border border-stone-200 bg-white hover:bg-[#FFF7F0] hover:border-orange-200 flex items-center justify-between transition group shadow-soft-sm"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-[#FF6B35]" />
                  <span className="font-semibold text-[#1E1B16] font-heading">Review Meal Tray</span>
                </div>
                <span className="status-pill status-pill-info text-[10px]">
                  {(cart || []).length} items
                </span>
              </button>

              <button
                onClick={onNavigateToOrders}
                className="w-full p-3 rounded-xl border border-stone-200 bg-white hover:bg-[#FFF7F0] hover:border-orange-200 flex items-center justify-between transition group shadow-soft-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#FF6B35]" />
                  <span className="font-semibold text-[#1E1B16] font-heading">Track Live Tokens</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#9B9590]" />
              </button>

              <button
                onClick={onNavigateToTransactions}
                className="w-full p-3 rounded-xl border border-stone-200 bg-white hover:bg-[#FFF7F0] hover:border-orange-200 flex items-center justify-between transition group shadow-soft-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#FF6B35]" />
                  <span className="font-semibold text-[#1E1B16] font-heading">Credit Ledger & History</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#9B9590]" />
              </button>

              {/* Goal Edit Quick Button */}
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="w-full p-3 rounded-xl border border-orange-200 bg-[#FFF7F0] hover:bg-orange-100/60 flex items-center justify-between transition group shadow-soft-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-[#FF6B35]" />
                  <span className="font-semibold text-[#1E1B16] font-heading">
                    {hasGoalSet ? `Daily Goal: ${dailyCalorieGoal} kcal` : 'Set Calorie Goal'}
                  </span>
                </div>
                <Edit3 className="w-3.5 h-3.5 text-[#FF6B35]" />
              </button>
            </div>
          </div>

          {/* Widget 2: Announcements / Notices Card */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <Megaphone className="w-4 h-4 text-[#FF6B35]" />
              <h3 className="text-base font-bold text-[#1E1B16] font-heading">Mess Announcements</h3>
            </div>

            <div className="space-y-3 text-xs text-[#6B6560]">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <span className="font-bold text-[#1E1B16] block font-heading">🕒 Dining Service Timings</span>
                <p className="text-[#6B6560] leading-relaxed">
                  Breakfast: 7:30 - 10:00 AM • Lunch: 12:00 - 3:00 PM • Dinner: 7:30 - 10:00 PM.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <span className="font-bold text-[#1E1B16] block font-heading">✨ Monthly Credit Reset</span>
                <p className="text-[#6B6560] leading-relaxed">
                  Monthly 9,000 allowance resets automatically on the 1st of every month.
                </p>
              </div>
            </div>
          </div>

          {/* Widget 3: Buy Credits CTA Card */}
          <div className="card bg-[#FFF7F0] border border-orange-200 space-y-4 shadow-soft-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#F7931E] text-white flex items-center justify-center shadow-soft-sm">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E1B16] font-heading">Top Up Credits</h3>
                <span className="text-[11px] text-[#FF6B35] font-semibold font-heading">1 Credit = ₹1 INR</span>
              </div>
            </div>

            <p className="text-xs text-[#6B6560] leading-relaxed">
              Need extra dining balance? Instant Razorpay top-ups via UPI, Debit Card, or NetBanking.
            </p>

            <button
              onClick={() => setIsTopupOpen(true)}
              className="w-full btn-primary py-2.5 text-xs justify-center shadow-btn-orange"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buy Dining Credits</span>
            </button>
          </div>

        </div>

      </div>

      {/* Set Daily Calorie Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Set Daily Calorie Goal"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#6B6560] leading-relaxed">
            Set your target daily calorie intake. Health Mode tracks your daily meal orders and keeps you informed of your nutritional progress.
          </p>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1E1B16]">Quick Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {(GOAL_PRESETS || []).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGoalInput(preset)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-180 font-heading ${
                    Number(goalInput) === preset
                      ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-btn-orange'
                      : 'bg-[#FAFAF9] text-[#1E1B16] border-stone-200 hover:bg-[#FFF7F0] hover:border-orange-300'
                  }`}
                >
                  {preset} kcal
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1E1B16]">Custom Daily Goal (kcal)</label>
            <input
              type="number"
              min="500"
              max="10000"
              step="50"
              placeholder="e.g. 2100"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="btn-secondary py-2 px-4 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSaveGoal()}
              disabled={savingGoal || !goalInput}
              className="btn-primary py-2 px-5 text-xs shadow-btn-orange"
            >
              {savingGoal ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Razorpay Top-Up Modal */}
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
