import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, CheckCircle2, RotateCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export function ForgotPasswordModal({ isOpen, onClose, initialEmail = '', onSuccess }) {
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Email Request, 2: Code & New Password
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Sync initialEmail when opened
  useEffect(() => {
    if (isOpen) {
      if (initialEmail && initialEmail.trim()) {
        setEmail(initialEmail.trim());
      }
      setStep(1);
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setCountdown(0);
    }
  }, [isOpen, initialEmail]);

  // Countdown timer for Resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Step 1: Send Reset Code Email
  const handleRequestReset = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      showToast('Please enter your registered email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(cleanEmail);
      showToast(res.message || `Password reset code sent to ${cleanEmail}`, 'success');

      setStep(2);
      setCountdown(60);
    } catch (err) {
      showToast(err.message || 'Failed to send reset code. Please check your email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (resetCode || '').trim();

    if (!cleanCode || cleanCode.length !== 6) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please re-enter.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(cleanEmail, cleanCode, newPassword);
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      showToast(res.message || 'Password reset successfully! Please sign in with your new password.', 'success');

      if (onSuccess) {
        onSuccess(cleanEmail, newPassword);
      }
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to reset password. Please check your code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? 'Forgot Your Password?' : 'Create New Password'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {step === 1 ? (
          /* STEP 1: REQUEST CODE FORM */
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="text-center pb-2">
              <div className="w-12 h-12 rounded-full bg-[#FFF3EB] text-[#FF6B35] flex items-center justify-center mx-auto mb-3 shadow-sm border border-[#FF6B35]/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#6B6560] leading-relaxed">
                Enter your registered email address (Student, Chef, Warden, or Admin) and we'll send you a 6-digit password reset verification code.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E1B16] mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. yourname@vitstudent.ac.in"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-[#1E1B16] placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-semibold py-2.5 rounded-xl text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: VERIFY CODE & SET NEW PASSWORD */
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="truncate pr-2">
                <span className="text-[#6B6560]">Code sent to: </span>
                <span className="font-semibold text-[#1E1B16] truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[#FF6B35] font-semibold hover:underline flex items-center gap-1 shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            {/* 6-Digit Verification Code */}
            <div>
              <label className="block text-xs font-semibold text-[#1E1B16] mb-1.5">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type="text"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-base tracking-[0.25em] font-mono font-bold text-[#1E1B16] placeholder-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition text-center"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-[#1E1B16] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-[#1E1B16] placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-[#1E1B16] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 bg-stone-50 border rounded-xl text-sm text-[#1E1B16] placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-stone-200 focus:ring-[#FF6B35] focus:border-transparent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>Passwords do not match</span>
                </p>
              )}
            </div>

            {/* Resend Code Link */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-stone-500">Didn't receive email?</span>
              <button
                type="button"
                onClick={handleRequestReset}
                disabled={countdown > 0 || loading}
                className="font-semibold text-[#FF6B35] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
              >
                {countdown > 0 ? (
                  <span>Resend code in {countdown}s</span>
                ) : (
                  <>
                    <RotateCw className="w-3 h-3" />
                    <span>Resend code</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || (confirmPassword && confirmPassword !== newPassword)}
              className="w-full bg-[#FF6B35] hover:bg-[#E85D2A] text-white font-semibold py-2.5 rounded-xl text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Reset Password & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}
