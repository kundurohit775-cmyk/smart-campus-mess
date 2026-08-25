import React from 'react';
import { Clock, CheckCircle2, Flame, BellRing, PackageCheck, Ban } from 'lucide-react';

const STEPS = [
  { key: 'Pending', label: 'Order Placed', desc: 'Awaiting mess confirmation', icon: Clock },
  { key: 'Accepted', label: 'Accepted', desc: 'Order sent to kitchen', icon: CheckCircle2 },
  { key: 'Preparing', label: 'Preparing', desc: 'Chef cooking your meal', icon: Flame },
  { key: 'Ready', label: 'Ready', desc: 'Hot & ready at counter', icon: BellRing },
  { key: 'Completed', label: 'Collected', desc: 'Order fulfilled', icon: PackageCheck }
];

export function OrderStepper({ status }) {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-3 p-3.5 bg-rose-50/80 border border-rose-200/80 rounded-2xl text-rose-800 shadow-stripe-sm">
        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
          <Ban className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-rose-900">Order Cancelled</h4>
          <p className="text-xs text-rose-600">Credits were refunded back to student balance immediately.</p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex(s => s.key === status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0 mx-6">
          <div
            className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${(activeIdx / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {STEPS.map((step, idx) => {
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const Icon = step.icon;

          let nodeStyle = 'bg-white border-2 border-slate-200 text-slate-400 shadow-stripe-sm';
          let textColor = 'text-slate-400';

          if (isDone) {
            nodeStyle = 'bg-emerald-500 border-emerald-500 text-white shadow-stripe-sm';
            textColor = 'text-emerald-700 font-bold';
          } else if (isCurrent) {
            nodeStyle = 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-500/15 shadow-stripe-md animate-pulse-subtle';
            textColor = 'text-orange-600 font-black';
          }

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${nodeStyle}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="mt-2 text-center hidden sm:block">
                <p className={`text-xs ${textColor}`}>{step.label}</p>
                <p className="text-[10px] text-slate-400 max-w-[80px] leading-tight font-medium">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile Current Step Label */}
      <div className="sm:hidden text-center mt-3 pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
          Current Status: {STEPS[activeIdx]?.label}
        </span>
        <p className="text-xs text-slate-500">{STEPS[activeIdx]?.desc}</p>
      </div>
    </div>
  );
}
