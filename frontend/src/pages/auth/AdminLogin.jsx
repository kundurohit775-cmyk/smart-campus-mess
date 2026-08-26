import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  LockKeyhole 
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
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Ambient background glow subtly tinted with Cyan */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#06B6D4]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#2563EB]/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Centered Container (max-w ~400px) */}
      <div className="max-w-[400px] w-full relative z-10 space-y-4 animate-slide-up">
        
        {/* Back Link positioned above the card */}
        <div className="text-left">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition font-heading"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>← Back to role selection</span>
          </button>
        </div>

        {/* Role Icon + Heading above the card */}
        <div className="text-center space-y-2 pt-1 pb-1">
          <div className="w-12 h-12 rounded-2xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center shadow-glow-secondary border border-[#06B6D4]/30 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink font-heading">
              Welcome back, Admin
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Campus dining governance & audit ledger
            </p>
          </div>
        </div>

        {/* Single Centered Glass Card */}
        <div className="card p-6 sm:p-7 shadow-level-3 border-[#06B6D4]/20 bg-[#131728]/85 backdrop-blur-xl space-y-5">
          
          <div className="p-3 bg-[#06B6D4]/10 rounded-xl border border-[#06B6D4]/30 text-xs text-[#06B6D4] flex items-start gap-2.5">
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
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-border text-center">
            <span className="text-xs text-muted">
              System access logs are recorded for security auditing.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
