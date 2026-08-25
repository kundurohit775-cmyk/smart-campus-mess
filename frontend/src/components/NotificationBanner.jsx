import React from 'react';
import { AlertTriangle, BellRing, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function NotificationBanner({ readyOrders = [], onTrackOrder }) {
  const { user } = useAuth();

  if (!user || user.role !== 'student') return null;

  const remaining = user?.credits?.remaining ?? 9000;
  const isLow = remaining < 500;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2.5">
      {/* Ready Order Alert Banner (Stripe Light Card Style) */}
      {readyOrders.length > 0 && (
        <div className="bg-white p-4 sm:p-5 rounded-2.5xl shadow-stripe border border-emerald-300/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden animate-slide-up">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0 shadow-stripe-sm">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span>🍽️ Food Ready for Pickup!</span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs px-2.5 py-0.5 rounded-full font-black uppercase">
                  {readyOrders.map(o => o.pickup_token).join(', ')}
                </span>
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Your order is hot and ready at the mess counter. Please show your token to collect.
              </p>
            </div>
          </div>
          {onTrackOrder && (
            <button
              onClick={onTrackOrder}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-stripe-sm hover:shadow-glow-emerald transition-all duration-150 self-stretch sm:self-auto text-center flex items-center justify-center gap-1 active:scale-95"
            >
              <span>View Order Token</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Low Credit Warning Banner */}
      {isLow && (
        <div className="bg-white p-4 sm:p-5 rounded-2.5xl shadow-stripe border border-amber-300/80 flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0 shadow-stripe-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <span>Low Credit Balance Alert</span>
                <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-xs px-2.5 py-0.5 rounded-full font-black tabular-nums">
                  {remaining} Credits Remaining
                </span>
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                You have less than 500 credits remaining for this cycle. Buy credits anytime with Razorpay.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
