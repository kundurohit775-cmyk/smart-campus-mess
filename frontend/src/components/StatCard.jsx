import React from 'react';

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'violet', 
  subtitle,
  trend,
  trendPositive = true,
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
      className={`card ${onClick ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="text-micro text-muted block">
            {title}
          </span>
          <div className="text-2xl sm:text-3.5xl font-bold font-heading text-ink tracking-tight tabular-nums">
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
