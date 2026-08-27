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
      <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-soft-sm">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
          <Ban className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-red-800 font-heading">Order Cancelled</h4>
          <p className="text-xs text-red-600">Credits were refunded back to student balance immediately.</p>
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
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-stone-200 rounded-full z-0 mx-6">
          <div
            className="h-full bg-[#FF6B35] rounded-full transition-all duration-300"
            style={{ width: `${(activeIdx / (DISPLAY_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {DISPLAY_STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const Icon = step.icon;

          let nodeStyle = 'bg-white border-2 border-stone-200 text-stone-400 shadow-soft-sm';
          let textColor = 'text-[#9B9590]';

          if (isDone) {
            nodeStyle = 'bg-[#16A34A] border-[#16A34A] text-white shadow-soft-sm';
            textColor = 'text-[#16A34A] font-semibold';
          } else if (isCurrent) {
            nodeStyle = 'bg-[#FF6B35] border-[#FF6B35] text-white shadow-btn-orange';
            textColor = 'text-[#FF6B35] font-bold';
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${nodeStyle}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={`text-xs font-heading ${textColor}`}>{step.label}</p>
                <p className="text-[10px] text-[#6B6560] max-w-[80px] leading-tight">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile Label */}
      <div className="sm:hidden text-center mt-2.5 pt-2 border-t border-stone-100">
        <span className="text-xs font-bold text-[#FF6B35] uppercase font-heading">
          Status: {DISPLAY_STEPS[activeIdx]?.label}
        </span>
      </div>
    </div>
  );
}
