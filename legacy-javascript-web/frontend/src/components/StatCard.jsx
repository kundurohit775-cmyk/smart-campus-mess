import React from 'react';

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'orange', 
  subtitle,
  trend,
  trendPositive = true,
  isFeatured = false,
  onClick
}) {
  const colorMap = {
    orange: {
      iconBg: 'bg-[#FFF7F0] text-[#FF6B35] border border-orange-100',
      accent: 'text-[#FF6B35]',
      borderHover: 'hover:border-orange-300'
    },
    chef: {
      iconBg: 'bg-orange-50 text-[#EA580C] border border-orange-100',
      accent: 'text-[#EA580C]',
      borderHover: 'hover:border-orange-400'
    },
    admin: {
      iconBg: 'bg-orange-50 text-[#C2410C] border border-orange-100',
      accent: 'text-[#C2410C]',
      borderHover: 'hover:border-orange-500'
    },
    success: {
      iconBg: 'bg-emerald-50 text-[#16A34A] border border-emerald-100',
      accent: 'text-[#16A34A]',
      borderHover: 'hover:border-emerald-300'
    },
    warning: {
      iconBg: 'bg-amber-50 text-[#D97706] border border-amber-100',
      accent: 'text-[#D97706]',
      borderHover: 'hover:border-amber-300'
    },
    danger: {
      iconBg: 'bg-red-50 text-[#DC2626] border border-red-100',
      accent: 'text-[#DC2626]',
      borderHover: 'hover:border-red-300'
    },
    info: {
      iconBg: 'bg-blue-50 text-[#2563EB] border border-blue-100',
      accent: 'text-[#2563EB]',
      borderHover: 'hover:border-blue-300'
    }
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div 
      onClick={onClick}
      className={`card flex flex-col justify-between ${
        isFeatured 
          ? 'bg-[#FFF7F0] border-orange-300/80 shadow-soft-md' 
          : `bg-[#FFFFFF] border-stone-200/80 ${scheme.borderHover}`
      } ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''} transition-all duration-180`}
    >
      <div>
        {/* Top: Icon in rounded box top-left + Trend Pill top-right */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${scheme.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}

          {trend && (
            <span className={`status-pill ${trendPositive ? 'status-pill-success' : 'status-pill-danger'} text-[11px] py-0.5 px-2.5 font-heading`}>
              {trend}
            </span>
          )}
        </div>

        {/* Small label */}
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] block mb-1">
          {title}
        </span>

        {/* Large bold dark number */}
        <div className="text-2xl sm:text-3xl font-bold font-heading tracking-tight tabular-nums text-[#1E1B16]">
          {value}
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs text-[#6B6560] font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
}
