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
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col justify-center items-center py-10 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Ambient background glow subtly tinted with Amber */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#F59E0B]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-[#EA580C]/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Centered Container (max-w ~400px) */}
      <div className="max-w-[400px] w-full relative z-10 space-y-4 animate-slide-up">
        
        {/* Back Link positioned above the card */}
        <div className="text-left">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition font-heading"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>← Back to role selection</span>
          </button>
        </div>

        {/* Role Icon + Heading above the card */}
        <div className="text-center space-y-2 pt-1 pb-1">
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center shadow-glow-amber border border-[#F59E0B]/30 mx-auto">
            <ChefHat className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink font-heading">
              Welcome back, Chef
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Live kitchen prep queue & portion controls
            </p>
          </div>
        </div>

        {/* Single Centered Glass Card */}
        <div className="card p-6 sm:p-7 shadow-level-3 border-[#F59E0B]/20 bg-[#131728]/85 backdrop-blur-xl space-y-5">
          
          <div className="p-3 bg-[#F59E0B]/10 rounded-xl border border-[#F59E0B]/30 text-xs text-[#F59E0B] flex items-start gap-2.5">
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
                  <span>Sign In as Chef</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-border text-center">
            <span className="text-xs text-muted">
              Need access? Contact campus dining administration.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
