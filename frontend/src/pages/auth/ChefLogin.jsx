import React, { useState } from 'react';
import { 
  ChefHat, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function ChefLogin({ onBack }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your chef email and password.', 'warning');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await login(cleanEmail, password);
      showToast('Welcome to Kitchen Management Portal!', 'success');
    } catch (err) {
      showToast(err.message || 'Chef authentication failed. Please verify credentials.', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden subtle-mesh-bg">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-amber-400/10 via-orange-300/15 to-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 text-xs font-bold shadow-stripe-sm hover:shadow-stripe transition mb-4 active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Change Role / Back</span>
        </button>

        <div className="w-12 h-12 rounded-2.5xl bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-500 flex items-center justify-center text-white shadow-stripe-md shadow-amber-500/20 mx-auto mb-3 border border-white/60">
          <ChefHat className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Chef Kitchen Portal
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          Sign in to manage the live cooking queue and food stock
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-7 px-6 sm:px-9 rounded-3xl shadow-stripe-lg border border-slate-200/80 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

          <div className="mb-5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-center gap-2.5 shadow-stripe-sm">
            <Flame className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Authorized kitchen staff portal. Requires verified chef credentials.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Authorized Chef Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="chef@campus.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl shadow-stripe-sm hover:shadow-stripe-md flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Chef</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single-Account Access Restricted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
