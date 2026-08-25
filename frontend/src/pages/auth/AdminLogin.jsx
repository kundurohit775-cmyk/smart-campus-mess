import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  LockKeyhole,
  CheckCircle,
  BarChart3
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
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col md:flex-row">
      
      {/* LEFT 45% PANEL: Branded Indigo Gradient Panel */}
      <div className="w-full md:w-[45%] bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#3730A3] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
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
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">SmartMess Admin</span>
              <span className="text-xs text-indigo-100 font-medium">Campus Governance & Ledger</span>
            </div>
          </div>
        </div>

        {/* Middle Messaging */}
        <div className="relative z-10 py-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#6366F1] flex items-center justify-center shadow-level-2 mb-2">
            <BarChart3 className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight leading-snug">
            Campus Dining Analytics & Financial Audit Controls
          </h2>
          
          <p className="text-indigo-100 text-sm sm:text-[15px] leading-relaxed max-w-md">
            Manage student credit allotments, trigger monthly resets, curate food menu pricing, and inspect immutable audit ledgers.
          </p>

          <div className="pt-4 space-y-2.5 text-xs text-indigo-50/90 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Student 9k monthly credit management & manual adjustments</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Menu items catalog, active pricing, and inventory allotments</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Comprehensive order and Razorpay credit transaction logs</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer note */}
        <div className="relative z-10 pt-4 border-t border-white/20 text-xs text-indigo-100/80">
          Authorized Campus Administrative Staff Only
        </div>
      </div>

      {/* RIGHT 55% PANEL: Form Panel Centered Vertically */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#FAFAFB]">
        <div className="max-w-md w-full bg-white p-7 sm:p-9 rounded-2xl shadow-level-1 border border-border space-y-6">
          
          {/* Header */}
          <div>
            <span className="text-micro text-[#6366F1] font-semibold block mb-1">Administration</span>
            <h2 className="text-h2 text-ink">Administrator Sign In</h2>
            <p className="text-body text-xs sm:text-sm mt-1">
              Sign in with your authorized admin credentials
            </p>
          </div>

          <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200/80 text-xs text-indigo-900 flex items-start gap-2.5">
            <LockKeyhole className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
            <span>Restricted administrative portal. Protected with 256-bit encryption.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Authorized Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="admin@campus.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field focus:border-[#6366F1] focus:shadow-focus-ring-indigo"
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
                className="input-field focus:border-[#6366F1] focus:shadow-focus-ring-indigo"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-btn text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-level-1 hover:shadow-level-2 active:scale-[0.98] bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#3730A3] hover:from-[#4338CA] hover:to-[#312E81] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-divider text-center">
            <span className="text-xs text-muted">
              System access logs are recorded for security auditing.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
