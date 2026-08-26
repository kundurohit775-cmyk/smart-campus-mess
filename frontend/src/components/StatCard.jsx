import React from 'react';

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'violet', 
  subtitle,
  trend,
  trendPositive = true,
  isFeatured = false,
  onClick
}) {
  const colorMap = {
    violet: {
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 shadow-[0_0_16px_rgba(139,92,246,0.3)]',
      accent: 'text-[#8B5CF6]',
      borderHover: 'hover:border-[#8B5CF6]/50',
      glow: 'hover:shadow-[0_8px_32px_rgba(139,92,246,0.25)]'
    },
    cyan: {
      iconBg: 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30 shadow-[0_0_16px_rgba(6,182,212,0.3)]',
      accent: 'text-[#06B6D4]',
      borderHover: 'hover:border-[#06B6D4]/50',
      glow: 'hover:shadow-[0_8px_32px_rgba(6,182,212,0.25)]'
    },
    amber: {
      iconBg: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 shadow-[0_0_16px_rgba(245,158,11,0.3)]',
      accent: 'text-[#F59E0B]',
      borderHover: 'hover:border-[#F59E0B]/50',
      glow: 'hover:shadow-[0_8px_32px_rgba(245,158,11,0.25)]'
    },
    emerald: {
      iconBg: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 shadow-[0_0_16px_rgba(16,185,129,0.3)]',
      accent: 'text-[#10B981]',
      borderHover: 'hover:border-[#10B981]/50',
      glow: 'hover:shadow-[0_8px_32px_rgba(16,185,129,0.25)]'
    },
    rose: {
      iconBg: 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30 shadow-[0_0_16px_rgba(244,63,94,0.3)]',
      accent: 'text-[#F43F5E]',
      borderHover: 'hover:border-[#F43F5E]/50',
      glow: 'hover:shadow-[0_8px_32px_rgba(244,63,94,0.25)]'
    },
    sky: {
      iconBg: 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30 shadow-[0_0_16px_rgba(56,189,248,0.3)]',
      accent: 'text-[#38BDF8]',
      borderHover: 'hover:border-[#38BDF8]/50',
      glow: 'hover:shadow-[0_8px_32px_rgba(56,189,248,0.25)]'
    }
  };

  const scheme = colorMap[color] || colorMap.violet;

  return (
    <div 
      onClick={onClick}
      className={`card flex flex-col justify-between ${
        isFeatured 
          ? 'border-[#8B5CF6]/50 shadow-[0_8px_32px_rgba(139,92,246,0.25)] bg-[#131728]/95 scale-[1.01]' 
          : `bg-[#131728]/70 ${scheme.borderHover} ${scheme.glow}`
      } ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''} transition-all duration-200`}
    >
      <div>
        {/* Top: Icon in glowing circle top-left + Trend Pill top-right */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${scheme.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}

          {trend && (
            <span className={`status-pill ${trendPositive ? 'status-pill-success' : 'status-pill-danger'} text-[11px] py-0.5 px-2.5 font-heading`}>
              {trend}
            </span>
          )}
        </div>

        {/* Small uppercase label */}
        <span className="text-micro text-muted block mb-1">
          {title}
        </span>

        {/* Large number */}
        <div className={`text-2xl sm:text-3xl font-bold font-heading tracking-tight tabular-nums ${
          isFeatured ? 'text-gradient' : 'text-ink'
        }`}>
          {value}
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-muted font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
}
