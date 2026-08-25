import React, { useState } from 'react';
import { 
  ChefHat, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  Flame,
  CheckCircle,
  UtensilsCrossed,
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
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col md:flex-row">
      
      {/* LEFT 45% PANEL: Branded Warm Amber Gradient Panel */}
      <div className="w-full md:w-[45%] bg-gradient-to-br from-[#F59E0B] via-[#D97706] to-[#B45309] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
        {/* Subtle geometric overlay pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        {/* Top Back / Logo */}
        <div className="relative z-10 space-y-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md transition active:scale-95 border border-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Role Selection</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-level-1">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">SmartMess Kitchen</span>
              <span className="text-xs text-amber-100 font-medium">Live Order Dispatch & Controls</span>
            </div>
          </div>
        </div>

        {/* Middle Messaging */}
        <div className="relative z-10 py-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#D97706] flex items-center justify-center shadow-level-2 mb-2">
            <Flame className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight leading-snug">
            Real-Time Kitchen Queue & Inventory Dispatch
          </h2>
          
          <p className="text-amber-100 text-sm sm:text-[15px] leading-relaxed max-w-md">
            Manage active meal preparation, update cooking progress, and notify students instantly when their tokens are ready.
          </p>

          <div className="pt-4 space-y-2.5 text-xs text-amber-50/90 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Live status advancement (Pending → Cooking → Ready)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>1-click inventory portion restocking & sold out toggle</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Pickup token verification and completion matching</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer note */}
        <div className="relative z-10 pt-4 border-t border-white/20 text-xs text-amber-100/80">
          Authorized Campus Culinary Staff Only
        </div>
      </div>

      {/* RIGHT 55% PANEL: Form Panel Centered Vertically */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#FAFAFB]">
        <div className="max-w-md w-full bg-white p-7 sm:p-9 rounded-2xl shadow-level-1 border border-border space-y-6">
          
          {/* Header */}
          <div>
            <span className="text-micro text-[#D97706] font-semibold block mb-1">Kitchen Operations</span>
            <h2 className="text-h2 text-ink">Chef Staff Sign In</h2>
            <p className="text-body text-xs sm:text-sm mt-1">
              Sign in with your authorized chef credentials
            </p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
            <span>Single-account authorized access. Self-registration is restricted.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Authorized Chef Email
              </label>
              <input
                type="email"
                required
                placeholder="chef@campus.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-btn text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-level-1 hover:shadow-level-2 active:scale-[0.98] bg-gradient-to-r from-[#F59E0B] via-[#D97706] to-[#B45309] hover:from-[#D97706] hover:to-[#92400E] disabled:opacity-50"
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

          <div className="pt-4 border-t border-divider text-center">
            <span className="text-xs text-muted">
              Need access? Contact campus dining administration.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
