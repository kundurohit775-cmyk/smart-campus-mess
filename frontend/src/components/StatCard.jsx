import React from 'react';

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'orange', 
  subtitle,
  trend,
  trendPositive = true,
  onClick
}) {
  const colorMap = {
    orange: {
      iconBg: 'bg-orange-50 text-[#FF6B35] border-orange-100',
      accent: 'text-[#FF6B35]',
    },
    amber: {
      iconBg: 'bg-amber-50 text-[#D97706] border-amber-100',
      accent: 'text-[#D97706]',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-[#16A34A] border-emerald-100',
      accent: 'text-[#16A34A]',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-[#6366F1] border-indigo-100',
      accent: 'text-[#6366F1]',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      accent: 'text-purple-600',
    },
    rose: {
      iconBg: 'bg-rose-50 text-[#DC2626] border-rose-100',
      accent: 'text-[#DC2626]',
    }
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div 
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-micro text-muted block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight tabular-nums">
            {value}
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 pt-2.5 border-t border-divider flex items-center justify-between text-xs">
          {subtitle && (
            <span className="text-muted font-medium">
              {subtitle}
            </span>
          )}
          {trend && (
            <span className={`status-pill ${trendPositive ? 'status-pill-success' : 'status-pill-danger'} text-[11px] py-0.5 px-2`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
