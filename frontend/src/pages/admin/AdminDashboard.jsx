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
  Receipt
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';

export function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.getAdminStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* 1. HERO STAT STRIP (4 Stat Cards in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Students"
          value={stats ? stats.total_students : '--'}
          subtitle="Enrolled campus accounts"
          icon={Users}
          color="indigo"
          onClick={() => onNavigate('students')}
        />
        <StatCard
          title="Menu Dishes"
          value={stats ? stats.total_menu_items : '--'}
          subtitle="Catalog food items"
          icon={UtensilsCrossed}
          color="orange"
          onClick={() => onNavigate('menu-mgr')}
        />
        <StatCard
          title="Orders Processed"
          value={stats ? stats.total_orders : '--'}
          subtitle="Total campus meals served"
          icon={ShoppingBag}
          color="emerald"
          onClick={() => onNavigate('audit')}
        />
        <StatCard
          title="Total Credit Volume"
          value={stats ? `${(stats.total_credits_used || 0).toLocaleString()} Cr` : '--'}
          subtitle="Credits processed to date"
          icon={Coins}
          color="purple"
          onClick={() => onNavigate('audit')}
        />
      </div>

      {/* 2. MAIN CONTENT AREA: 2-Column Grid (Main 70% + Sidebar 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 70% (col-span-8): Most Ordered Dishes Leaderboard */}
        <div className="lg:col-span-8 space-y-5">
          <div className="card-static space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div>
                <h2 className="text-h2 text-ink">
                  Top Ordered Dishes
                </h2>
                <p className="text-body text-xs mt-0.5">
                  Leaderboard of most popular campus meals ordered
                </p>
              </div>
              <span className="status-pill status-pill-success text-xs">
                Popularity
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-muted animate-pulse">
                Loading analytics leaderboard...
              </div>
            ) : !stats?.top_items || stats.top_items.length === 0 ? (
              <div className="py-12 text-center text-muted">
                No orders recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-divider">
                {stats.top_items.map((item, index) => (
                  <div 
                    key={index}
                    className="h-14 flex items-center justify-between hover:bg-[#FAFAFB] px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF6B35] font-bold text-xs flex items-center justify-center border border-orange-100 shrink-0">
                        #{index + 1}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-ink">
                        {item.item_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">
                        Ordered <strong className="text-ink font-bold">{item.order_count}</strong> times
                      </span>
                      <span className="status-pill status-pill-info text-xs tabular-nums">
                        {item.total_credits} Credits
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 30% (col-span-4): Low Balance Warning & Quick Navigation Shortcuts */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Low Balance Warning Widget */}
          <div className="card bg-gradient-to-br from-amber-50/60 via-white to-white border-amber-200/80 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-bold text-ink">Low Credit Accounts</h3>
              </div>
              <span className="status-pill status-pill-warning text-[11px]">
                {stats?.low_balance_students?.length || 0} Students
              </span>
            </div>

            <p className="text-body text-xs leading-relaxed">
              Students with less than 500 remaining credits can be credited or refreshed in the Student Manager.
            </p>

            <button
              onClick={() => onNavigate('students')}
              className="w-full btn-secondary text-xs py-2 justify-center"
            >
              <span>Manage Student Balances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Admin Actions */}
          <div className="card space-y-3">
            <h3 className="text-h3 text-ink pb-2 border-b border-divider">
              Quick Management
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => onNavigate('menu-mgr')}
                className="w-full p-2.5 rounded-xl border border-border bg-[#FAFAFB] hover:bg-slate-100 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed className="w-4 h-4 text-[#FF6B35]" />
                  <span className="font-semibold text-ink">Menu Items Catalog</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>

              <button
                onClick={() => onNavigate('students')}
                className="w-full p-2.5 rounded-xl border border-border bg-[#FAFAFB] hover:bg-slate-100 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#6366F1]" />
                  <span className="font-semibold text-ink">Student Accounts & Resets</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>

              <button
                onClick={() => onNavigate('audit')}
                className="w-full p-2.5 rounded-xl border border-border bg-[#FAFAFB] hover:bg-slate-100 flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-ink">Campus Financial Audit Logs</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
