import React from 'react';
import { Clock, CheckCircle2, Flame, BellRing, PackageCheck, Ban } from 'lucide-react';

const STEPS = [
  { key: 'Pending', label: 'Order Placed', desc: 'Awaiting kitchen', icon: Clock },
  { key: 'Accepted', label: 'Accepted', desc: 'Sent to station', icon: CheckCircle2 },
  { key: 'Preparing', label: 'Preparing', desc: 'Cooking meal', icon: Flame },
  { key: 'Cooking', label: 'Cooking', desc: 'Cooking meal', icon: Flame },
  { key: 'Ready', label: 'Ready', desc: 'Counter pickup', icon: BellRing },
  { key: 'Completed', label: 'Collected', desc: 'Order fulfilled', icon: PackageCheck }
];

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
      <div className="flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 shadow-level-1">
        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-status-danger shrink-0">
          <Ban className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-status-danger">Order Cancelled</h4>
          <p className="text-xs text-rose-600">Credits were refunded back to student balance immediately.</p>
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
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0 mx-6">
          <div
            className="h-full bg-gradient-to-r from-[#FF6B35] to-[#16A34A] rounded-full transition-all duration-500"
            style={{ width: `${(activeIdx / (DISPLAY_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {DISPLAY_STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const Icon = step.icon;

          let nodeStyle = 'bg-white border-2 border-border text-muted shadow-level-1';
          let textColor = 'text-muted';

          if (isDone) {
            nodeStyle = 'bg-status-success border-status-success text-white shadow-level-1';
            textColor = 'text-status-success font-semibold';
          } else if (isCurrent) {
            nodeStyle = 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-level-4';
            textColor = 'text-[#FF6B35] font-bold';
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${nodeStyle}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={`text-xs ${textColor}`}>{step.label}</p>
                <p className="text-[10px] text-muted max-w-[80px] leading-tight">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile Label */}
      <div className="sm:hidden text-center mt-2.5 pt-2 border-t border-divider">
        <span className="text-xs font-bold text-[#FF6B35] uppercase">
          Status: {DISPLAY_STEPS[activeIdx]?.label}
        </span>
      </div>
    </div>
  );
}
