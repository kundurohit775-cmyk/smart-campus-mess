import React from 'react';
import { Clock, CheckCircle2, Flame, BellRing, PackageCheck, Ban } from 'lucide-react';

const DISPLAY_STEPS = [
  { key: 'Pending', label: 'Order Placed', desc: 'Awaiting kitchen', icon: Clock },
  { key: 'Cooking', label: 'Cooking', desc: 'Chef preparing', icon: Flame },
  { key: 'Ready', label: 'Ready', desc: 'Counter pickup', icon: BellRing },
  { key: 'Completed', label: 'Collected', desc: 'Order fulfilled', icon: PackageCheck }
];

export function OrderStepper({ status, currentStatus }) {
  const activeStatus = status || currentStatus || 'Pending';

  if (activeStatus === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 p-3.5 bg-[#F87171]/15 border border-[#F87171]/30 rounded-xl text-[#F87171] shadow-level-1">
        <div className="w-8 h-8 rounded-lg bg-[#F87171]/20 flex items-center justify-center text-status-danger shrink-0">
          <Ban className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-status-danger font-heading">Order Cancelled</h4>
          <p className="text-xs text-[#F87171]">Credits were refunded back to student balance immediately.</p>
        </div>
      </div>
    );
  }

  let activeIdx = 0;
  if (activeStatus === 'Pending' || activeStatus === 'Accepted') activeIdx = 0;
  else if (activeStatus === 'Cooking' || activeStatus === 'Preparing') activeIdx = 1;
  else if (activeStatus === 'Ready') activeIdx = 2;
  else if (activeStatus === 'Completed') activeIdx = 3;

  return (
    <div className="w-full py-3">
      <div className="relative flex items-center justify-between">
        {/* Connecting Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-[#1A1F3A] rounded-full z-0 mx-6">
          <div
            className="h-full bg-gradient-to-r from-[#8B5CF6] via-[#06B6D4] to-[#34D399] rounded-full transition-all duration-500 shadow-glow-primary"
            style={{ width: `${(activeIdx / (DISPLAY_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {DISPLAY_STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const Icon = step.icon;

          let nodeStyle = 'bg-[#0B0E1A] border-2 border-border text-muted shadow-level-1';
          let textColor = 'text-muted';

          if (isDone) {
            nodeStyle = 'bg-status-success border-status-success text-white shadow-glow-emerald';
            textColor = 'text-status-success font-semibold';
          } else if (isCurrent) {
            nodeStyle = 'bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] border-transparent text-white shadow-glow-primary';
            textColor = 'text-[#06B6D4] font-bold';
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${nodeStyle}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={`text-xs font-heading ${textColor}`}>{step.label}</p>
                <p className="text-[10px] text-muted max-w-[80px] leading-tight">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile Label */}
      <div className="sm:hidden text-center mt-2.5 pt-2 border-t border-divider">
        <span className="text-xs font-bold text-[#06B6D4] uppercase font-heading">
          Status: {DISPLAY_STEPS[activeIdx]?.label}
        </span>
      </div>
    </div>
  );
}
