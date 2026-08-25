import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'orange', trend }) {
  const colorMap = {
    orange: {
      badge: 'bg-orange-50 text-orange-600 border-orange-200/60 shadow-orange-500/10',
      glow: 'group-hover:shadow-glow-orange'
    },
    emerald: {
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-200/60 shadow-emerald-500/10',
      glow: 'group-hover:shadow-glow-emerald'
    },
    blue: {
      badge: 'bg-sky-50 text-sky-600 border-sky-200/60 shadow-sky-500/10',
      glow: 'group-hover:shadow-sky-500/20'
    },
    purple: {
      badge: 'bg-purple-50 text-purple-600 border-purple-200/60 shadow-purple-500/10',
      glow: 'group-hover:shadow-glow-indigo'
    },
    amber: {
      badge: 'bg-amber-50 text-amber-600 border-amber-200/60 shadow-amber-500/10',
      glow: 'group-hover:shadow-amber-500/20'
    },
    rose: {
      badge: 'bg-rose-50 text-rose-600 border-rose-200/60 shadow-rose-500/10',
      glow: 'group-hover:shadow-rose-500/20'
    },
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div className="group bg-white p-5 sm:p-6 rounded-2.5xl border border-slate-200/80 shadow-stripe hover:shadow-stripe-hover hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4 relative overflow-hidden">
      {/* Top subtle highlight shimmer */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="space-y-1.5 z-10">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">{value}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 shadow-sm transition-all duration-200 group-hover:scale-105 ${scheme.badge} ${scheme.glow}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </div>
  );
}
