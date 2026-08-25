import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ShoppingBag, Coins, Clock, AlertTriangle, TrendingUp, ArrowRight, UtensilsCrossed, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';

export function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.getAdminAnalytics();
      setStats(res.analytics);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2.5xl border border-slate-200/80 shadow-stripe" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats || {
    totalStudents: 0,
    ordersToday: 0,
    creditsUsedToday: 0,
    pendingOrders: 0,
    lowCreditStudents: 0,
    topItems: []
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-7 sm:space-y-8">
      
      {/* Top Banner (Stripe Light Glass Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-stripe-md relative overflow-hidden">
        {/* Soft background ambient gradient glow */}
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-gradient-to-bl from-purple-400/10 via-indigo-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/60 text-purple-700 text-[11px] font-black uppercase tracking-wider shadow-stripe-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Mess Performance & Credit Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl font-medium">
            Live overview of student credit burn rates, kitchen throughput, and menu item performance.
          </p>
        </div>

        {/* Quick Nav shortcuts */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <button
            onClick={() => onNavigate('menu-mgr')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-black border border-slate-200/80 shadow-stripe-sm transition-all duration-150 flex items-center gap-1.5 active:scale-95"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-purple-600" />
            <span>Manage Menu</span>
          </button>
          <button
            onClick={() => onNavigate('students')}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-stripe-sm hover:shadow-glow-indigo transition-all duration-150 flex items-center gap-1.5 active:scale-95"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Student Credits</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Students"
          value={s.totalStudents}
          subtitle="Registered on platform"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Orders Placed Today"
          value={s.ordersToday}
          subtitle="Total campus meal orders"
          icon={ShoppingBag}
          color="orange"
        />
        <StatCard
          title="Credits Used Today"
          value={`${s.creditsUsedToday.toLocaleString()}`}
          subtitle="Mess revenue today"
          icon={Coins}
          color="emerald"
        />
        <StatCard
          title="Live Queue Orders"
          value={s.pendingOrders}
          subtitle="Pending / In-Kitchen"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Top Ordered Dishes & Low Credit Students */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Most Ordered Dishes Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-stripe space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span>Most Ordered Food Items</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">Highest volume dishes ordered across campus</p>
            </div>
            <button
              onClick={() => onNavigate('menu-mgr')}
              className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View All Menu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {s.topItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No orders logged yet today.
            </div>
          ) : (
            <div className="space-y-2.5">
              {s.topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 hover:border-orange-200/80 transition-colors text-xs sm:text-sm shadow-stripe-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-black flex items-center justify-center text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{item.item_name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-right">
                    <div>
                      <span className="font-black text-slate-900 block tabular-nums">{item.total_sold} ordered</span>
                      <span className="text-[11px] text-emerald-600 font-bold tabular-nums">{item.total_revenue} credits</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Balance Warning & Quick Audit */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-stripe space-y-4">
            <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Balance Accounts</span>
            </h3>
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2 shadow-stripe-sm">
              <p className="text-2xl font-black text-amber-950 tabular-nums">
                {s.lowCreditStudents} <span className="text-xs font-bold text-amber-700">students</span>
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Students currently below the 500-credit threshold. Their allowance resets to 9,000 on the 1st.
              </p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-stripe-sm transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Manage Student Balances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
