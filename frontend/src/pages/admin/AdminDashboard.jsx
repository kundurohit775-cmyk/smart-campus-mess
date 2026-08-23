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
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200" />
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Campus Administration Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mess Performance & Credit Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live overview of student credit burn rates, kitchen throughput, and menu performance today.
          </p>
        </div>

        {/* Quick Nav shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('menu-mgr')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Manage Menu
          </button>
          <button
            onClick={() => onNavigate('students')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Student Credits
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Most Ordered Dishes Leaderboard */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span>Most Ordered Food Items</span>
              </h3>
              <p className="text-xs text-slate-500">Highest volume dishes ordered across campus</p>
            </div>
            <button
              onClick={() => onNavigate('menu-mgr')}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
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
            <div className="space-y-3">
              {s.topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-orange-200 transition text-xs sm:text-sm"
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
                      <span className="font-extrabold text-slate-900 block">{item.total_sold} ordered</span>
                      <span className="text-[11px] text-emerald-600 font-bold">{item.total_revenue} credits</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Balance Warning & Quick Audit */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low Balance Accounts</span>
            </h3>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 space-y-2">
              <p className="text-2xl font-extrabold text-amber-900">
                {s.lowCreditStudents} <span className="text-xs font-semibold text-amber-700">students</span>
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Students currently below the 500-credit threshold. Their allowance resets to 9,000 on the 1st.
              </p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
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
