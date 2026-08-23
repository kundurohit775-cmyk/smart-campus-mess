import React from 'react';

export function StatCard({ title, value, subtitle, icon: Icon, color = 'orange', trend }) {
  const colorMap = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const badgeStyle = colorMap[color] || colorMap.orange;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${badgeStyle}`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </div>
  );
}
