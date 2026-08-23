import React from 'react';
import { AlertTriangle, BellRing, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function NotificationBanner({ readyOrders = [], onTrackOrder }) {
  const { user } = useAuth();

  if (!user || user.role !== 'student') return null;

  const remaining = user?.credits?.remaining ?? 9000;
  const isLow = remaining < 500;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 space-y-2">
      {/* Ready Order Alert Banner */}
      {readyOrders.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-emerald-400/30 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>🍽️ Food Ready for Pickup!</span>
                <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                  {readyOrders.map(o => o.pickup_token).join(', ')}
                </span>
              </h4>
              <p className="text-xs text-emerald-100 mt-0.5">
                Your order is hot and ready at the mess counter. Please show your token to collect.
              </p>
            </div>
          </div>
          {onTrackOrder && (
            <button
              onClick={onTrackOrder}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-md transition self-stretch sm:self-auto text-center"
            >
              View Order Token
            </button>
          )}
        </div>
      )}

      {/* Low Credit Warning Banner */}
      {isLow && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white p-4 rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-between gap-3 border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                <span>Low Credit Balance Alert</span>
                <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {remaining} Credits Remaining
                </span>
              </h4>
              <p className="text-xs text-amber-100 mt-0.5">
                You have less than 500 credits remaining for this cycle. Monthly allowance of 9,000 will refresh on the 1st.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
