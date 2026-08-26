import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  LockKeyhole, 
  CheckCircle, 
  BarChart3, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function AdminLogin({ onBack }) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your admin email and password.', 'warning');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await login(cleanEmail, password);
      showToast('Welcome to Campus Administration Portal!', 'success');
    } catch (err) {
      showToast(err.message || 'Admin authentication failed. Please verify credentials.', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col md:flex-row relative overflow-hidden">
      
      {/* LEFT 45% PANEL: Branded Cyan / Space Navy Panel */}
      <div className="w-full md:w-[45%] bg-gradient-to-br from-[#102A43] via-[#131728] to-[#0B0E1A] border-b md:border-b-0 md:border-r border-border text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Ambient atmospheric glow inside panel */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#06B6D4]/25 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-64 h-64 bg-[#2563EB]/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-15 bg-cyber-grid pointer-events-none" />
        
        {/* Top Back / Logo */}
        <div className="relative z-10 space-y-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#131728]/80 hover:bg-[#1A1F3A] text-[#F1F5F9] text-xs font-semibold backdrop-blur-md transition active:scale-95 border border-border"
          >
            <ArrowLeft className="w-4 h-4 text-[#06B6D4]" />
            <span>← Back to role selection</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#06B6D4] to-[#2563EB] flex items-center justify-center text-white border border-white/20 shadow-[0_0_24px_rgba(6,182,212,0.4)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block text-ink font-heading">SmartMess Admin</span>
              <span className="text-xs text-[#06B6D4] font-medium font-heading">Campus Governance & Ledger</span>
            </div>
          </div>
        </div>

        {/* Middle Messaging */}
        <div className="relative z-10 py-6 sm:py-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center shadow-glow-secondary border border-[#06B6D4]/30 mb-2">
            <BarChart3 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-ink font-heading">
            Welcome back, <br />
            <span className="text-[#06B6D4]">Admin</span>
          </h2>
          
          <p className="text-body text-xs sm:text-sm leading-relaxed max-w-md">
            Manage student credit allotments, trigger monthly resets, curate food menu pricing, and inspect immutable audit ledgers.
          </p>

          <div className="pt-3 space-y-2.5 text-xs text-body font-medium hidden sm:block">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#06B6D4]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#06B6D4]" />
              </div>
              <span>Student 9k monthly credit management & manual adjustments</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#06B6D4]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#06B6D4]" />
              </div>
              <span>Menu items catalog, active pricing, and inventory allotments</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#34D399]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#34D399]" />
              </div>
              <span>Comprehensive order and Razorpay credit transaction logs</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer note */}
        <div className="relative z-10 pt-4 border-t border-border text-xs text-muted hidden md:block">
          Authorized Campus Administrative Staff Only
        </div>
      </div>

      {/* RIGHT 55% PANEL: Form Panel Centered Vertically with Cyan Glow */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14">
        
        {/* Mobile Back Button */}
        <div className="w-full max-w-md md:hidden mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-muted hover:text-ink transition font-heading"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>← Back to role selection</span>
          </button>
        </div>

        <div className="max-w-md w-full card space-y-6 shadow-level-2 border-[#06B6D4]/20">
          
          {/* Header */}
          <div>
            <span className="text-micro text-[#06B6D4] block mb-1">Administration</span>
            <h2 className="text-h2 text-ink font-heading">Sign In</h2>
            <p className="text-body text-xs sm:text-sm mt-1">
              Sign in with your authorized admin credentials
            </p>
          </div>

          <div className="p-3.5 bg-[#06B6D4]/10 rounded-xl border border-[#06B6D4]/30 text-xs text-[#06B6D4] flex items-start gap-2.5">
            <LockKeyhole className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
            <span>Restricted administrative portal. Protected with 256-bit encryption.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">
                Authorized Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@campus.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
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
                className="input-field focus:border-[#06B6D4] focus:ring-1 focus:ring-[#06B6D4]/50 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary bg-gradient-to-r from-[#06B6D4] to-[#2563EB] shadow-glow-secondary hover:from-[#0891B2] hover:to-[#1D4ED8]"
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
              System access logs are recorded for security auditing.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
