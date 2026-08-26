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

      {/* 2. HERO STAT ROW (4 Equal-Width Glass Cards, Credit Volume is Featured) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Credit Volume */}
        <StatCard
          title="Total Credit Volume"
          value={stats ? `${(stats.total_credits_used || 0).toLocaleString()} Cr` : '--'}
          subtitle="Processed dining volume"
          icon={Coins}
          color="violet"
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
          color="violet"
          trend="Enrolled"
          trendPositive={true}
          onClick={() => onNavigate && onNavigate('students')}
        />

        {/* Stat 3: Menu Dishes */}
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

        {/* Stat 4: Orders Processed */}
        <StatCard
          title="Orders Fulfilled"
          value={stats ? stats.total_orders : '--'}
          subtitle="Campus meals served"
          icon={ShoppingBag}
          color="violet"
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
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div>
                <h2 className="text-h2 text-ink font-heading">
                  Top Ordered Campus Dishes
                </h2>
                <p className="text-body text-xs mt-0.5">
                  Leaderboard of most popular meals ordered by students
                </p>
              </div>
              <span className="status-pill status-pill-success text-xs font-heading">
                Popularity
              </span>
            </div>

            {loading ? (
              <div className="py-16 text-center text-muted animate-pulse">
                Loading analytics leaderboard...
              </div>
            ) : topItems.length === 0 ? (
              <div className="py-16 text-center text-muted">
                No orders recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-divider">
                {topItems.map((item, index) => (
                  <div 
                    key={index}
                    className="h-14 flex items-center justify-between hover:bg-[#1A1F3A]/60 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] font-bold text-xs flex items-center justify-center border border-[#8B5CF6]/30 shrink-0 font-heading">
                        #{index + 1}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-ink font-heading">
                        {item.item_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">
                        Ordered <strong className="text-ink font-bold font-heading">{item.order_count}</strong> times
                      </span>
                      <span className="status-pill status-pill-info text-xs tabular-nums font-heading">
                        {item.total_credits} Credits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Recent Audit Records Table */}
          <div className="card space-y-4 p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div>
                <h3 className="text-h3 text-ink font-heading">Recent Campus Meal Orders</h3>
                <p className="text-body text-xs mt-0.5">Live campus ordering audit ledger</p>
              </div>

              {onNavigate && (
                <button
                  onClick={() => onNavigate('audit')}
                  className="text-xs font-semibold text-[#8B5CF6] hover:underline flex items-center gap-1"
                >
                  <span>View All Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">No meal orders recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="text-micro text-muted border-b border-divider bg-[#0B0E1A]/40">
                    <tr>
                      <th className="py-3 px-4">Order / Token</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {recentOrders.map((order) => (
                      <tr key={order.order_id} className="h-14 hover:bg-[#1A1F3A]/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-ink font-heading">
                            #{order.order_id} <span className="text-[#06B6D4]">({order.pickup_token})</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ink font-medium">
                          {order.student_name}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gradient tabular-nums font-heading">
                          {order.total_amount} Credits
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="status-pill status-pill-success text-[11px] font-heading">
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 30% (col-span-4): Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Low Balance Alerts Card */}
          <div className="card bg-gradient-to-br from-[#1A1F3A] via-[#131728] to-[#0B0E1A] border-[#8B5CF6]/40 shadow-glow-primary space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FBBF24]" />
                <h3 className="text-sm font-bold text-ink font-heading">Low Credit Accounts</h3>
              </div>
              <span className="status-pill status-pill-warning text-[11px] font-heading">
                {lowBalanceStudents.length} Students
              </span>
            </div>

            <p className="text-body text-xs leading-relaxed">
              Students with less than 500 remaining credits can be credited or refreshed in the Student Manager.
            </p>

            <button
              onClick={() => onNavigate && onNavigate('students')}
              className="w-full btn-secondary text-xs py-2 justify-center"
            >
              <span>Manage Student Balances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Widget 2: Quick Management Shortcuts */}
          <div className="card space-y-3">
            <h3 className="text-h3 text-ink pb-2 border-b border-divider font-heading flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#8B5CF6]" />
              <span>Administration Controls</span>
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate && onNavigate('menu-mgr')}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed className="w-4 h-4 text-[#06B6D4] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Menu Items Catalog</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate('students')}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Student Accounts & Resets</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>

              <button
                onClick={() => onNavigate && onNavigate('audit')}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-[#34D399] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Campus Financial Audit Logs</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>
            </div>
          </div>

          {/* Widget 3: Governance Policies */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-divider">
              <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" />
              <h3 className="text-h3 text-ink font-heading">Governance Policies</h3>
            </div>

            <div className="space-y-2.5 text-xs text-body">
              <div className="p-3 bg-[#0B0E1A] rounded-xl border border-border space-y-1">
                <span className="font-bold text-ink block font-heading">💳 9,000 Credit Limit</span>
                <p className="text-muted leading-relaxed">
                  Default student allowance is 9,000 monthly dining credits. Manual grants are logged in audit ledger.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
