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
  Megaphone 
} from 'lucide-react';
import { api } from '../../services/api';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';

export function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminOrders().catch(() => ({ orders: [] }))
      ]);
      setStats(statsRes || null);
      setRecentOrders(ordersRes?.orders?.slice(0, 4) || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const topItems = Array.isArray(stats?.top_items) ? stats.top_items : [];
  const lowBalanceStudents = Array.isArray(stats?.low_balance_students) ? stats.low_balance_students : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle="Campus Dining Governance • Student credit allotments & financial audit" />

      {/* 2. HERO STAT ROW (Admin Dominant: Rose #F43F5E + Cyan #06B6D4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Credit Volume (Rose) */}
        <StatCard
          title="Total Credit Volume"
          value={stats ? `${(stats.total_credits_used || 0).toLocaleString()} Cr` : '--'}
          subtitle="Processed dining volume"
          icon={Coins}
          color="rose"
          isFeatured={true}
          trend="Total Volume"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('audit')}
        />

        {/* Stat 2: Active Students (Cyan) */}
        <StatCard
          title="Active Students"
          value={stats ? stats.total_students : '--'}
          subtitle="Enrolled campus accounts"
          icon={Users}
          color="cyan"
          trend="Enrolled"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('students')}
        />

        {/* Stat 3: Menu Catalog (Cyan) */}
        <StatCard
          title="Catalog Dishes"
          value={stats ? stats.total_menu_items : '--'}
          subtitle="Available menu catalog"
          icon={UtensilsCrossed}
          color="cyan"
          trend="Catalog"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('menu-mgr')}
        />

        {/* Stat 4: Orders Dispatched (Rose) */}
        <StatCard
          title="Orders Fulfilled"
          value={stats ? stats.total_orders : '--'}
          subtitle="Campus meals served"
          icon={ShoppingBag}
          color="rose"
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
          <div className="card space-y-6 p-6 sm:p-7 border border-[#06B6D4]/20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] font-heading">
                  Top Ordered Campus Dishes
                </h2>
                <p className="text-[#94A3B8] text-xs mt-0.5">
                  Leaderboard by total orders placed by VIT students
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('menu-mgr')}
                className="text-xs font-semibold text-[#06B6D4] hover:underline flex items-center gap-1"
              >
                <span>Manage Menu</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-[#94A3B8]">
                <div className="w-6 h-6 border-2 border-[#06B6D4] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-heading">Loading dish analytics...</p>
              </div>
            ) : topItems.length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-4 text-center">
                No orders recorded yet to rank dishes.
              </p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#0B0E1A]/80 border border-slate-800 hover:border-[#06B6D4]/40 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-heading ${
                        idx === 0 
                          ? 'bg-[#F59E0B]/20 text-amber-300 border border-[#F59E0B]/40' 
                          : idx === 1 
                          ? 'bg-[#06B6D4]/20 text-cyan-300 border border-[#06B6D4]/40' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-sm font-semibold text-[#F1F5F9] block group-hover:text-white transition">
                          {item.item_name}
                        </span>
                        <span className="text-[11px] text-[#94A3B8]">
                          {item.category} • {item.credits_price} Cr
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold font-heading text-[#06B6D4] tabular-nums">
                        {item.order_count} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Recent Campus Meal Orders */}
          <div className="card space-y-6 p-6 sm:p-7 border border-[#F43F5E]/20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-[#F1F5F9] font-heading">
                  Live Campus Activity Feed
                </h2>
                <p className="text-[#94A3B8] text-xs mt-0.5">
                  Recent transactions and student meal redemptions
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('audit')}
                className="text-xs font-semibold text-[#F43F5E] hover:underline flex items-center gap-1"
              >
                <span>Full Audit Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-4 text-center">
                No recent meal orders recorded today.
              </p>
            ) : (
              <div className="divide-y divide-slate-800">
                {recentOrders.map((order) => (
                  <div key={order.order_id} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F1F5F9] font-heading">
                          Order #{order.order_id}
                        </span>
                        <span className="status-pill status-pill-info text-[10px] py-0.5 px-2">
                          {order.order_status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">
                        {order.student_name} • {order.room_number || 'Hostel'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold font-heading text-[#F43F5E] tabular-nums">
                        {order.total_credits} Cr
                      </span>
                      <span className="text-[10px] text-[#64748B] block">
                        {new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 30% (col-span-4): Low Balance Alerts & Quick Governance Tools */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Low Balance Warning Widget (Rose) */}
          <div className="card p-6 space-y-4 border border-[#F43F5E]/30 bg-[#131728]/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-[#F43F5E] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9] font-heading">
                  Low Balance Alerts
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Students below 500 credits
                </p>
              </div>
            </div>

            {lowBalanceStudents.length === 0 ? (
              <p className="text-xs text-[#10B981] bg-[#10B981]/10 p-3 rounded-xl border border-[#10B981]/20">
                ✓ All active student accounts have sufficient credit balances.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {lowBalanceStudents.map((st) => (
                  <div
                    key={st.student_id}
                    className="p-2.5 rounded-xl bg-[#0B0E1A] border border-[#F43F5E]/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#F1F5F9] block truncate max-w-[140px]">
                        {st.name}
                      </span>
                      <span className="text-[10px] text-[#94A3B8]">
                        Room: {st.room_number || 'Hostel'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#F43F5E] tabular-nums">
                      {st.remaining_credits} Cr
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('students')}
              className="w-full btn-secondary text-xs py-2 border-[#F43F5E]/40 hover:bg-[#F43F5E]/10 text-rose-300 flex items-center justify-center gap-1.5"
            >
              <span>Manage Student Allocations</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Actions Console */}
          <div className="card p-6 space-y-3 border border-[#06B6D4]/20">
            <h3 className="text-sm font-bold text-[#F1F5F9] font-heading pb-2 border-b border-slate-800">
              Governance Tools
            </h3>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('menu-mgr')}
              className="w-full text-left p-3 rounded-xl bg-[#0B0E1A] hover:border-[#06B6D4]/50 border border-slate-800 text-xs text-[#F1F5F9] transition flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold block text-[#F1F5F9] group-hover:text-cyan-300 transition">
                  Menu & Pricing Catalog
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Add or edit meal prices
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-cyan-300 transition" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('students')}
              className="w-full text-left p-3 rounded-xl bg-[#0B0E1A] hover:border-[#F43F5E]/50 border border-slate-800 text-xs text-[#F1F5F9] transition flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold block text-[#F1F5F9] group-hover:text-rose-300 transition">
                  Student Credit Ledger
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  Top up or adjust allowances
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-rose-300 transition" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('audit')}
              className="w-full text-left p-3 rounded-xl bg-[#0B0E1A] hover:border-[#06B6D4]/50 border border-slate-800 text-xs text-[#F1F5F9] transition flex items-center justify-between group"
            >
              <div>
                <span className="font-semibold block text-[#F1F5F9] group-hover:text-cyan-300 transition">
                  Financial Audit Trail
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  View campus transactions
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-cyan-300 transition" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
