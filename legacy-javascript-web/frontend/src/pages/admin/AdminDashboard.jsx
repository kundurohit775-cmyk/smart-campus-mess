import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UtensilsCrossed, 
  Coins, 
  ShoppingBag, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  RotateCcw, 
  Sparkles, 
  AlertTriangle, 
  Receipt, 
  Zap, 
  Megaphone,
  TrendingDown 
} from 'lucide-react';
import { api } from '../../services/api';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';

export function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [wastageSummary, setWastageSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, ordersRes, wasteRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminOrders().catch(() => ({ orders: [] })),
        api.getAdminWastageSummary().catch(() => null)
      ]);
      setStats(statsRes || null);
      setRecentOrders(ordersRes?.orders?.slice(0, 4) || []);
      setWastageSummary(wasteRes);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err.message || 'Failed to connect to campus admin services. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const topItems = Array.isArray(stats?.top_items) 
    ? stats.top_items 
    : Array.isArray(stats?.analytics?.topItems) 
    ? stats.analytics.topItems 
    : [];

  const lowBalanceStudents = Array.isArray(stats?.low_balance_students) 
    ? stats.low_balance_students 
    : Array.isArray(stats?.analytics?.lowBalanceStudents) 
    ? stats.analytics.lowBalanceStudents 
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle="Campus Dining Governance • Student credit allotments & financial audit" />

      {/* Error Alert Banner if fetch fails */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between gap-4 text-xs text-[#DC2626]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-[#DC2626]" />
            <span><strong>Data Load Warning:</strong> {error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shrink-0 transition"
          >
            Retry Fetch
          </button>
        </div>
      )}

      {/* 2. HERO STAT ROW (Admin Dominant: #C2410C) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Credit Volume */}
        <StatCard
          title="Total Credit Volume"
          value={stats ? `${(stats.total_credits_used || 0).toLocaleString()} Cr` : '--'}
          subtitle="Processed dining volume"
          icon={Coins}
          color="admin"
          isFeatured={true}
          trend="Total Volume"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('audit')}
        />

        {/* Stat 2: Active Students */}
        <StatCard
          title="Active Students"
          value={stats ? stats.total_students : '--'}
          subtitle="Enrolled campus accounts"
          icon={Users}
          color="orange"
          trend="Enrolled"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('students')}
        />

        {/* Stat 3: Menu Catalog */}
        <StatCard
          title="Catalog Dishes"
          value={stats ? stats.total_menu_items : '--'}
          subtitle="Available menu catalog"
          icon={UtensilsCrossed}
          color="orange"
          trend="Catalog"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('menu-mgr')}
        />

        {/* Stat 4: Orders Dispatched */}
        <StatCard
          title="Orders Fulfilled"
          value={stats ? stats.total_orders : '--'}
          subtitle="Campus meals served"
          icon={ShoppingBag}
          color="admin"
          trend="Dispatched"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('audit')}
        />
      </div>

      {/* 3. MAIN GRID (70% Primary Content + 30% Sidebar Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 70% (col-span-8): Primary Analytics & Activity Table */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section A: Popular Dishes Leaderboard Card */}
          <div className="card space-y-6 p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-bold text-[#1E1B16] font-heading">
                  Top Ordered Campus Dishes
                </h2>
                <p className="text-[#6B6560] text-xs mt-0.5">
                  Leaderboard by total orders placed by VIT students
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('menu-mgr')}
                className="text-xs font-semibold text-[#C2410C] hover:underline flex items-center gap-1"
              >
                <span>Manage Menu</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-[#6B6560]">
                <div className="w-6 h-6 border-2 border-[#C2410C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-heading">Loading dish analytics...</p>
              </div>
            ) : topItems.length === 0 ? (
              <p className="text-xs text-[#9B9590] py-4 text-center">
                No orders recorded yet to rank dishes.
              </p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-orange-200 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-heading ${
                        idx === 0 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : idx === 1 
                          ? 'bg-orange-100 text-[#EA580C] border border-orange-200' 
                          : 'bg-stone-200 text-stone-700'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-[#1E1B16] block group-hover:text-[#C2410C] transition">
                          {item.item_name}
                        </span>
                        <span className="text-[11px] text-[#6B6560]">
                          {item.category} • {item.credits_price} Cr
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-heading text-[#1E1B16] tabular-nums">
                        {item.order_count} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Recent Campus Meal Orders */}
          <div className="card space-y-6 p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-bold text-[#1E1B16] font-heading">
                  Live Campus Activity Feed
                </h2>
                <p className="text-[#6B6560] text-xs mt-0.5">
                  Recent transactions and student meal redemptions
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('audit')}
                className="text-xs font-semibold text-[#C2410C] hover:underline flex items-center gap-1"
              >
                <span>Full Audit Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-xs text-[#9B9590] py-4 text-center">
                No recent meal orders recorded today.
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {recentOrders.map((order) => (
                  <div key={order.order_id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E1B16] font-heading">
                          Order #{order.order_id}
                        </span>
                        <span className="status-pill status-pill-info text-[10px] py-0.5 px-2 bg-blue-50">
                          {order.order_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6B6560]">
                        {order.student_name} • {order.room_number || 'Hostel'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-heading text-[#1E1B16] tabular-nums">
                        {order.total_credits} Cr
                      </span>
                      <span className="text-[10px] text-[#9B9590] block">
                        {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 30% (col-span-4): Sustainability, Low Balance Alerts & Quick Governance Tools */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Food Waste & Kitchen Sustainability Widget */}
          {wastageSummary && (
            <div className="card p-6 space-y-4 border border-orange-200 bg-[#FFF7F0]/40">
              <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7F0] border border-orange-200 text-[#C2410C] flex items-center justify-center font-bold">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E1B16] font-heading">Food Waste Reduction</h3>
                    <p className="text-[11px] text-[#6B6560]">Campus dining efficiency</p>
                  </div>
                </div>
                <span className={`status-pill text-[10px] font-heading ${
                  wastageSummary.isPositiveTrend ? 'status-pill-success' : 'status-pill-warning'
                }`}>
                  {wastageSummary.trendBadgeText}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-stone-200/80">
                  <span className="text-[11px] text-[#6B6560] block">Waste Rate (30d)</span>
                  <span className="text-lg font-bold text-[#C2410C] font-heading tabular-nums block mt-0.5">
                    {wastageSummary.wastageRate}%
                  </span>
                  <span className="text-[10px] text-[#6B6560]">Portion loss</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200/80">
                  <span className="text-[11px] text-[#6B6560] block">Kitchen Efficiency</span>
                  <span className="text-lg font-bold text-[#16A34A] font-heading tabular-nums block mt-0.5">
                    {wastageSummary.kitchenEfficiency}%
                  </span>
                  <span className="text-[10px] text-[#6B6560]">Cooked vs sold</span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-[#15803D] flex items-center gap-2">
                <span className="font-bold">🌱 Sustainability Impact:</span>
                <span>~{wastageSummary.estimatedSavedPortions} meals saved through accurate forecasting.</span>
              </div>
            </div>
          )}

          {/* Low Balance Warning Widget */}
          <div className="card p-6 space-y-4 border border-red-200 bg-red-50/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] flex items-center justify-center shadow-soft-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E1B16] font-heading">
                  Low Balance Alerts
                </h3>
                <p className="text-xs text-[#6B6560]">
                  Students below 500 credits
                </p>
              </div>
            </div>

            {lowBalanceStudents.length === 0 ? (
              <p className="text-xs text-[#16A34A] bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                ✓ All active student accounts have sufficient credit balances.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lowBalanceStudents.map((st) => (
                  <div
                    key={st.student_id}
                    className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs shadow-soft-sm"
                  >
                    <div>
                      <span className="font-semibold text-[#1E1B16] block truncate max-w-[140px]">
                        {st.name}
                      </span>
                      <span className="text-[10px] text-[#6B6560]">
                        Room: {st.room_number || 'Hostel'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#DC2626] tabular-nums">
                      {st.remaining_credits} Cr
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('students')}
              className="w-full btn-secondary text-xs py-2 border-orange-200 hover:bg-[#FFF7F0] text-[#C2410C] flex items-center justify-center gap-1.5"
            >
              <span>Manage Student Allocations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Actions Console */}
          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100">
              Governance Tools
            </h3>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('menu-mgr')}
              className="w-full text-left p-3 rounded-xl bg-stone-50 hover:bg-[#FFF7F0] border border-stone-200 hover:border-orange-200 text-xs text-[#1E1B16] transition flex items-center justify-between group shadow-soft-sm"
            >
              <div>
                <span className="font-semibold block text-[#1E1B16] group-hover:text-[#C2410C] transition">
                  Menu & Pricing Catalog
                </span>
                <span className="text-[11px] text-[#6B6560]">
                  Add or edit meal prices
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9B9590] group-hover:text-[#C2410C] transition" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('students')}
              className="w-full text-left p-3 rounded-xl bg-stone-50 hover:bg-[#FFF7F0] border border-stone-200 hover:border-orange-200 text-xs text-[#1E1B16] transition flex items-center justify-between group shadow-soft-sm"
            >
              <div>
                <span className="font-semibold block text-[#1E1B16] group-hover:text-[#C2410C] transition">
                  Student Credit Ledger
                </span>
                <span className="text-[11px] text-[#6B6560]">
                  Top up or adjust allowances
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9B9590] group-hover:text-[#C2410C] transition" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('audit')}
              className="w-full text-left p-3 rounded-xl bg-stone-50 hover:bg-[#FFF7F0] border border-stone-200 hover:border-orange-200 text-xs text-[#1E1B16] transition flex items-center justify-between group shadow-soft-sm"
            >
              <div>
                <span className="font-semibold block text-[#1E1B16] group-hover:text-[#C2410C] transition">
                  Financial Audit Trail
                </span>
                <span className="text-[11px] text-[#6B6560]">
                  View campus transactions
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9B9590] group-hover:text-[#C2410C] transition" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
