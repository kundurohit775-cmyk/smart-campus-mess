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
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 shadow-glow-primary',
      accent: 'text-[#8B5CF6]',
    },
    cyan: {
      iconBg: 'bg-[#06B6D4]/15 text-[#06B6D4] border-[#06B6D4]/30 shadow-glow-secondary',
      accent: 'text-[#06B6D4]',
    },
    orange: {
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
      accent: 'text-[#8B5CF6]',
    },
    amber: {
      iconBg: 'bg-[#FBBF24]/15 text-[#FBBF24] border-[#FBBF24]/30 shadow-glow-amber',
      accent: 'text-[#FBBF24]',
    },
    emerald: {
      iconBg: 'bg-[#34D399]/15 text-[#34D399] border-[#34D399]/30 shadow-glow-emerald',
      accent: 'text-[#34D399]',
    },
    indigo: {
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30',
      accent: 'text-[#8B5CF6]',
    },
    purple: {
      iconBg: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 shadow-glow-primary',
      accent: 'text-[#8B5CF6]',
    },
    rose: {
      iconBg: 'bg-[#F87171]/15 text-[#F87171] border-[#F87171]/30 shadow-glow-rose',
      accent: 'text-[#F87171]',
    }
  };

  const scheme = colorMap[color] || colorMap.violet;

  return (
    <div 
      onClick={onClick}
      className={`card flex flex-col justify-between ${
        isFeatured 
          ? 'border-[#8B5CF6]/50 shadow-[0_8px_32px_rgba(139,92,246,0.25)] bg-[#131728]/90 scale-[1.01]' 
          : 'bg-[#131728]/70 hover:border-[#8B5CF6]/40'
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

        {/* Large gradient-text number */}
        <div className={`text-2xl sm:text-3xl font-bold font-heading tracking-tight tabular-nums ${
          isFeatured ? 'text-gradient' : 'text-ink'
        }`}>
          {value}
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-divider text-xs text-muted font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
}
