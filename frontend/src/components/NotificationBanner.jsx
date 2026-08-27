import React from 'react';
import { AlertTriangle, BellRing, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function NotificationBanner({ readyOrders = [], onTrackOrder }) {
  const { user } = useAuth();

  if (!user || (user.role !== 'student' && !user.isStudent)) return null;

  const ordersList = Array.isArray(readyOrders) ? readyOrders : [];
  const remaining = user?.credits?.remaining ?? 9000;
  const isLow = remaining < 500;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-3">
      
      {/* Ready Order Alert Banner */}
      {ordersList.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 shadow-soft-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden animate-slide-up">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-[#16A34A] flex items-center justify-center shrink-0 shadow-soft-sm">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#1E1B16] flex items-center gap-2 font-heading">
                <span>🍽️ Food Ready for Pickup!</span>
                <span className="status-pill status-pill-success text-xs font-bold uppercase bg-white shadow-soft-sm">
                  {ordersList.map(o => o.pickup_token).join(', ')}
                </span>
              </h4>
              <p className="text-xs text-[#6B6560] mt-0.5 font-medium">
                Your order is hot and ready at the mess counter. Please show your token to collect.
              </p>
            </div>
          </div>

          {onTrackOrder && (
            <button
              onClick={onTrackOrder}
              className="btn-primary py-2 px-4 text-xs self-stretch sm:self-auto shadow-btn-orange"
            >
              <span>View Token</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Low Credit Warning Banner */}
      {isLow && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/90 shadow-soft-sm flex items-center justify-between gap-3 relative overflow-hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-[#D97706] flex items-center justify-center shrink-0 shadow-soft-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-[#1E1B16] flex items-center gap-2 font-heading">
                <span>Low Credit Balance Alert</span>
                <span className="status-pill status-pill-warning text-xs font-bold tabular-nums bg-white shadow-soft-sm">
                  {remaining} Credits Remaining
                </span>
              </h4>
              <p className="text-xs text-[#6B6560] mt-0.5 font-medium">
                You have less than 500 credits remaining for this cycle. Buy credits anytime with Razorpay.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
