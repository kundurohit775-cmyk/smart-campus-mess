import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Home, 
  ArrowRight, 
  ShieldCheck, 
  ChefHat, 
  GraduationCap, 
  CheckCircle, 
  Smartphone, 
  KeyRound, 
  RotateCcw, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export function Login() {
  const { login, sendOtp, loginWithOtp, sendEmailOtp, verifyEmailOtp } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [loading, setLoading] = useState(false);

  // Email OTP Step State: 'form' | 'email_otp'
  const [authStep, setAuthStep] = useState('form');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(600); // 10 minutes in seconds
  const [resendingEmailOtp, setResendingEmailOtp] = useState(false);

  // Email/Password Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Mobile SMS OTP state (alternative login)
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [sendingOtp, setSendingOtp] = useState(false);

  // Countdown timer effect for Mobile OTP
  useEffect(() => {
    let timer = null;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpSent, countdown]);

  // Countdown timer effect for Email OTP
  useEffect(() => {
    let timer = null;
    if (authStep === 'email_otp' && emailCountdown > 0) {
      timer = setInterval(() => {
        setEmailCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [authStep, emailCountdown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ---------------------------------------------------------------------------
  // Mobile SMS OTP Login Handlers (Optional Fast Login)
  // ---------------------------------------------------------------------------
  const handleSendMobileOtp = async () => {
    if (!otpPhone || otpPhone.trim().length < 8) {
      showToast('Please enter a valid mobile number with country code.', 'warning');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendOtp(otpPhone);
      setOtpSent(true);
      setCountdown(300);
      if (res.devCode) {
        setOtpCode(res.devCode);
        showToast(`Twilio Trial: Unverified number. Test OTP: ${res.devCode}`, 'info', 8000);
      } else {
        showToast(res.message || 'OTP verification code sent via SMS to your mobile.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send OTP SMS', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit OTP code.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await loginWithOtp(otpPhone, otpCode);
      showToast('Mobile OTP verified! Welcome to Smart Mess.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to verify OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Email Form Submit: Initiates Email OTP for Registration & Login
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isRegister) {
        // Registration validations
        if (!name || !email || !password) {
          showToast('Please fill in all required fields.', 'warning');
          setLoading(false);
          return;
        }

        // STRICT VIT STUDENT EMAIL RESTRICTION
        if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
          showToast('Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.', 'error', 5000);
          setLoading(false);
          return;
        }

        // Request Email OTP for registration
        const otpRes = await sendEmailOtp(cleanEmail, 'register');
        setAuthStep('email_otp');
        setEmailCountdown(600);
        setEmailOtpCode('');
        showToast(`📧 Verification code sent to ${cleanEmail}. Enter the 6-digit OTP below.`, 'success', 6000);
      } else {
        // Sign-in validation
        if (!email || !password) {
          showToast('Please enter your email and password.', 'warning');
          setLoading(false);
          return;
        }

        // Attempt login
        const loginRes = await login(cleanEmail, password);
        if (loginRes?.requireOtp) {
          setAuthStep('email_otp');
          setEmailCountdown(600);
          setEmailOtpCode('');
          showToast(`📧 Password verified! 6-digit verification code sent to ${cleanEmail}.`, 'success', 6000);
        } else {
          showToast('Welcome back to Smart Mess!', 'success');
        }
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Verify Email OTP (Step 2 of Registration & Login)
  // ---------------------------------------------------------------------------
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = emailOtpCode.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      showToast('Please enter the 6-digit verification code.', 'warning');
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        // Verify OTP and complete account creation + credit allocation
        await verifyEmailOtp({
          name: name.trim(),
          email: cleanEmail,
          password,
          phone,
          roomNumber,
          otp: cleanCode,
          purpose: 'register'
        });

        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
        showToast('🎉 Account verified & created! 9,000 monthly credits granted.', 'success', 6000);
      } else {
        // Verify OTP and complete login session
        await verifyEmailOtp({
          email: cleanEmail,
          otp: cleanCode,
          purpose: 'login'
        });

        showToast('Email verified! Welcome back to Smart Mess.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Resend Email OTP
  // ---------------------------------------------------------------------------
  const handleResendEmailOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setResendingEmailOtp(true);

    try {
      const purpose = isRegister ? 'register' : 'login';
      await sendEmailOtp(cleanEmail, purpose);
      setEmailCountdown(600);
      setEmailOtpCode('');
      showToast(`New verification code sent to ${cleanEmail}.`, 'success', 5000);
    } catch (err) {
      showToast(err.message || 'Failed to resend code', 'error', 5000);
    } finally {
      setResendingEmailOtp(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1-Click Quick Demo Login Switcher
  // ---------------------------------------------------------------------------
  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      const res = await login(demoEmail, demoPassword);
      if (res?.requireOtp) {
        setAuthStep('email_otp');
        setEmailCountdown(600);
        setEmailOtpCode('');
        showToast(`Verification code sent to ${demoEmail}. Enter the OTP below.`, 'info', 6000);
      } else {
        showToast(`Logged in successfully!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isVitEmail = email.trim().toLowerCase().endsWith('@vitstudent.ac.in');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Smart<span className="text-orange-400">Mess</span>
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Campus Food Ordering & Digital Credit Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-white/20">
          {/* Main Tab Switcher: Sign In vs Register (Only shown on form step) */}
          {authStep === 'form' && (
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setOtpSent(false); }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setOtpSent(false); }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                  isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register Student
              </button>
            </div>
          )}

          {/* Sign In Sub-methods (Email + OTP vs Mobile SMS OTP) */}
          {authStep === 'form' && !isRegister && (
            <div className="flex items-center justify-center gap-2 mb-5 p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setLoginMethod('password')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  loginMethod === 'password'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Campus Email OTP</span>
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('otp')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  loginMethod === 'otp'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile SMS</span>
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* STEP 2: EMAIL OTP VERIFICATION SCREEN                            */}
          {/* ================================================================= */}
          {authStep === 'email_otp' ? (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {isRegister ? 'Verify Your VIT Email' : 'Two-Step Email Verification'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  We've sent a single-use 6-digit verification code to <br />
                  <strong className="text-slate-800 font-bold">{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyEmailOtp} className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Enter 6-Digit Email OTP
                    </label>
                    <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                      ⏱️ {formatTimer(emailCountdown)}
                    </span>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength="6"
                      required
                      autoFocus
                      placeholder="••••••"
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>5 max attempts allowed. Code expires in 10 minutes.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || emailOtpCode.length !== 6 || emailCountdown <= 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{isRegister ? 'Verify & Claim 9,000 Credits' : 'Verify & Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setAuthStep('form'); setEmailOtpCode(''); }}
                    className="font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back / Change Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    disabled={resendingEmailOtp || emailCountdown > 540}
                    className="font-bold text-orange-600 hover:text-orange-700 disabled:opacity-40 flex items-center gap-1"
                    title={emailCountdown > 540 ? `Wait ${emailCountdown - 540}s before resending` : 'Resend Code'}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resendingEmailOtp ? 'animate-spin' : ''}`} />
                    <span>{resendingEmailOtp ? 'Sending...' : 'Resend Code'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : !isRegister && loginMethod === 'otp' ? (
            /* =============================================================== */
            /* MODE 1: MOBILE SMS OTP LOGIN (FALLBACK)                          */
            /* =============================================================== */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Registered Mobile Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+91-9876543210"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      disabled={otpSent}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={sendingOtp || !otpPhone}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                    >
                      {sendingOtp ? 'Sending...' : 'Send SMS'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); }}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition text-xs font-semibold"
                      title="Change phone number"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <form onSubmit={handleVerifyMobileOtp} className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Enter 6-Digit SMS Code
                      </label>
                      <span className="text-xs font-mono font-bold text-orange-600">
                        ⏱️ {formatTimer(countdown)}
                      </span>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength="6"
                        required
                        autoFocus
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6 || countdown <= 0}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Didn't receive SMS?</span>
                    <button
                      type="button"
                      onClick={handleSendMobileOtp}
                      disabled={sendingOtp || countdown > 240}
                      className="font-bold text-orange-600 hover:text-orange-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend SMS</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* =============================================================== */
            /* MODE 2: EMAIL FORM (REGISTRATION & PASSWORD SIGN-IN)             */
            /* =============================================================== */
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Chen"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Hostel Room</label>
                      <div className="relative">
                        <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. B-302"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Phone</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="+91-9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {isRegister ? 'VIT Campus Email (@vitstudent.ac.in)' : 'Campus Email'}
                  </label>
                  {isRegister && email && (
                    <span className={`text-[11px] font-bold ${isVitEmail ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isVitEmail ? '✓ Valid VIT Email' : '✗ Must end with @vitstudent.ac.in'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder={isRegister ? "your.name2024@vitstudent.ac.in" : "student@campus.edu"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:bg-white transition ${
                      isRegister && email && !isVitEmail
                        ? 'border-rose-300 focus:ring-rose-500'
                        : 'border-slate-200 focus:ring-orange-500'
                    }`}
                  />
                </div>

                {isRegister && email && !isVitEmail && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {isRegister && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>A <strong>6-digit OTP code</strong> will be sent to your email to verify your student account.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (isRegister && !isVitEmail)}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? 'Continue to Email Verification' : 'Sign In with Email OTP'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Logins Section */}
          {authStep === 'form' && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400 text-center mb-3">
                ⚡ 1-Click Quick Demo Switcher
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setLoginMethod('password'); handleQuickDemoLogin('student@vitstudent.ac.in', 'password123'); }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50/50 transition text-center group"
                >
                  <GraduationCap className="w-5 h-5 text-orange-600 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-800 mt-1">Student</span>
                  <span className="text-[10px] text-slate-400">9k Credits</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setIsRegister(false);
                    setPassword('password123');
                    showToast('Enter your configured CHEF_EMAIL to sign in as Chef.', 'info', 4000);
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition text-center group"
                  title="Enter the email configured in CHEF_EMAIL environment variable"
                >
                  <ChefHat className="w-5 h-5 text-amber-600 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-800 mt-1">Chef</span>
                  <span className="text-[10px] text-slate-400">Kitchen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setIsRegister(false);
                    setPassword('password123');
                    showToast('Enter your configured ADMIN_EMAIL to sign in as Admin.', 'info', 4000);
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition text-center group"
                  title="Enter the email configured in ADMIN_EMAIL environment variable"
                >
                  <ShieldCheck className="w-5 h-5 text-purple-600 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-800 mt-1">Admin</span>
                  <span className="text-[10px] text-slate-400">Management</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
