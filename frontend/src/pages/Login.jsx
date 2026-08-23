import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Mail, Lock, User, Phone, Home, ArrowRight, ShieldCheck, ChefHat, GraduationCap, CheckCircle, Smartphone, KeyRound, RotateCcw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function Login() {
  const { login, register, sendOtp, loginWithOtp } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [loading, setLoading] = useState(false);

  // Email/Password Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Mobile OTP state
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [sendingOtp, setSendingOtp] = useState(false);

  // Countdown timer effect
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

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSendOtp = async () => {
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

  const handleVerifyOtp = async (e) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !email || !password) {
          showToast('Please fill in all required fields.', 'warning');
          setLoading(false);
          return;
        }

        // STRICT VIT STUDENT EMAIL RESTRICTION
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
          showToast('Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.', 'error', 5000);
          setLoading(false);
          return;
        }

        await register({ name, email: cleanEmail, password, phone, roomNumber });
        showToast('Account created successfully! 9,000 monthly credits granted.', 'success');
      } else {
        if (!email || !password) {
          showToast('Please enter your email and password.', 'warning');
          setLoading(false);
          return;
        }
        await login(email, password);
        showToast('Welcome back to Smart Mess!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    try {
      await login(demoEmail, demoPassword);
      showToast(`Logged in successfully!`, 'success');
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
          {/* Main Tab Switcher: Sign In vs Register */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setSimulatedDevCode(''); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setSimulatedDevCode(''); }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register Student
            </button>
          </div>

          {/* Sign In Sub-methods (Email vs Mobile OTP) */}
          {!isRegister && (
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
                <span>Email & Password</span>
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
                <span>Mobile OTP</span>
              </button>
            </div>
          )}

          {/* Mode 1: Mobile OTP Login */}
          {!isRegister && loginMethod === 'otp' ? (
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
                      onClick={handleSendOtp}
                      disabled={sendingOtp || !otpPhone}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition shrink-0"
                    >
                      {sendingOtp ? 'Sending...' : 'Send OTP'}
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
                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Enter 6-Digit OTP Code
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
                      onClick={handleSendOtp}
                      disabled={sendingOtp || countdown > 240}
                      className="font-bold text-orange-600 hover:text-orange-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Resend OTP</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Mode 2: Standard Email & Password Login / Student Registration */
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
                  <span>New VIT students automatically receive a <strong>9,000 monthly credit allowance</strong> valid immediately.</span>
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
                    <span>{isRegister ? 'Create Account & Claim Credits' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Logins Section */}
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
                onClick={() => { setLoginMethod('password'); handleQuickDemoLogin('admin@campus.edu', 'password123'); }}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition text-center group"
              >
                <ShieldCheck className="w-5 h-5 text-purple-600 group-hover:scale-110 transition" />
                <span className="text-xs font-bold text-slate-800 mt-1">Admin</span>
                <span className="text-[10px] text-slate-400">Full Access</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
