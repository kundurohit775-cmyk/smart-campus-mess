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
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col md:flex-row relative overflow-hidden">
      
      {/* LEFT 45% PANEL: Branded Cosmic Amber Panel */}
      <div className="w-full md:w-[45%] bg-gradient-to-br from-[#1E1B18] via-[#131728] to-[#0B0E1A] border-b md:border-b-0 md:border-r border-border text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Ambient atmospheric glow inside panel */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#F59E0B]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-64 h-64 bg-[#EA580C]/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-15 bg-cyber-grid pointer-events-none" />
        
        {/* Top Back / Logo */}
        <div className="relative z-10 space-y-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#131728]/80 hover:bg-[#1A1F3A] text-[#F1F5F9] text-xs font-semibold backdrop-blur-md transition active:scale-95 border border-border"
          >
            <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
            <span>← Back to role selection</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#F59E0B] to-[#EA580C] flex items-center justify-center text-white border border-white/20 shadow-[0_0_24px_rgba(245,158,11,0.4)]">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block text-ink font-heading">SmartMess Kitchen</span>
              <span className="text-xs text-[#F59E0B] font-medium font-heading">Live Order Dispatch & Controls</span>
            </div>
          </div>
        </div>

        {/* Middle Messaging */}
        <div className="relative z-10 py-6 sm:py-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shadow-glow-amber border border-[#F59E0B]/30 mb-2">
            <Flame className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-ink font-heading">
            Welcome back, <br />
            <span className="text-[#F59E0B]">Chef</span>
          </h2>
          
          <p className="text-body text-xs sm:text-sm leading-relaxed max-w-md">
            Manage active meal preparation, update cooking progress, and notify students instantly when their tokens are ready.
          </p>

          <div className="pt-3 space-y-2.5 text-xs text-body font-medium hidden sm:block">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
              </div>
              <span>Live status advancement (Pending → Cooking → Ready)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
              </div>
              <span>1-click portion restock & live sold-out toggle</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#34D399]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#34D399]" />
              </div>
              <span>Pickup token verification and completion matching</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer note */}
        <div className="relative z-10 pt-4 border-t border-border text-xs text-muted hidden md:block">
          Authorized Campus Culinary Staff Only
        </div>
      </div>

      {/* RIGHT 55% PANEL: Form Panel Centered Vertically with Amber Glow */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14">
        
        {/* Mobile Back Button */}
        <div className="w-full max-w-md md:hidden mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-muted hover:text-ink transition font-heading"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>← Back to role selection</span>
          </button>
        </div>

        <div className="max-w-md w-full card space-y-6 shadow-level-2 border-[#F59E0B]/20">
          
          {/* Header */}
          <div>
            <span className="text-micro text-[#F59E0B] block mb-1">Chef Station</span>
            <h2 className="text-h2 text-ink font-heading">Sign In</h2>
            <p className="text-body text-xs sm:text-sm mt-1">
              Sign in with your authorized chef staff credentials
            </p>
          </div>

          <div className="p-3.5 bg-[#F59E0B]/10 rounded-xl border border-[#F59E0B]/30 text-xs text-[#F59E0B] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <span>Single-account authorized access. Self-registration is restricted.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">
                Authorized Chef Email
              </label>
              <input
                type="email"
                required
                placeholder="chef@campus.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]/50 shadow-[0_0_12px_rgba(245,158,11,0.1)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary bg-gradient-to-r from-[#F59E0B] to-[#EA580C] shadow-glow-amber hover:from-[#D97706] hover:to-[#C2410C]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-border text-center">
            <span className="text-xs text-muted">
              Need access? Contact campus dining administration.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
