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
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export function Login() {
  const { login, sendOtp, loginWithOtp, sendRegisterOtp, verifyRegisterOtp } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [loading, setLoading] = useState(false);

  // Registration OTP Step: 'form' | 'otp'
  const [registerStep, setRegisterStep] = useState('form');
  const [registerOtpCode, setRegisterOtpCode] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes (600 seconds)
  const [resendingOtp, setResendingOtp] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Mobile SMS OTP state (alternative quick login)
  const [otpPhone, setOtpPhone] = useState('');
  const [smsOtpCode, setSmsOtpCode] = useState('');
  const [smsOtpSent, setSmsOtpSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(300);
  const [sendingSms, setSendingSms] = useState(false);

  // Countdown timer effect for Registration Email OTP
  useEffect(() => {
    let timer = null;
    if (isRegister && registerStep === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRegister, registerStep, countdown]);

  // Countdown timer effect for Mobile SMS OTP
  useEffect(() => {
    let timer = null;
    if (smsOtpSent && smsCountdown > 0) {
      timer = setInterval(() => {
        setSmsCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [smsOtpSent, smsCountdown]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ---------------------------------------------------------------------------
  // 1. STANDARD LOGIN (EMAIL + PASSWORD ONLY - NO OTP)
  // ---------------------------------------------------------------------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your email and password.', 'warning');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await login(cleanEmail, password);
      showToast('Welcome back to Smart Mess!', 'success');
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. REGISTRATION STEP 1: SEND EMAIL OTP
  // ---------------------------------------------------------------------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // STRICT VIT STUDENT EMAIL RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      showToast('Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.', 'error', 5000);
      return;
    }

    setLoading(true);

    try {
      await sendRegisterOtp({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone,
        roomNumber
      });

      setRegisterStep('otp');
      setCountdown(600); // 10 minutes
      setRegisterOtpCode('');
      showToast(`📧 Verification code sent to ${cleanEmail}. Enter the 6-digit OTP to complete registration.`, 'success', 6000);
    } catch (err) {
      showToast(err.message || 'Failed to send verification code', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. REGISTRATION STEP 2: VERIFY EMAIL OTP & CREATE ACCOUNT
  // ---------------------------------------------------------------------------
  const handleVerifyRegisterOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = registerOtpCode.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      showToast('Please enter the 6-digit verification code.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await verifyRegisterOtp({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone,
        roomNumber,
        otp: cleanOtp
      });

      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      showToast('🎉 Account verified & created successfully! 9,000 monthly credits granted. Please sign in.', 'success', 7000);

      // Redirect to Sign In tab with email prefilled
      setIsRegister(false);
      setRegisterStep('form');
      setRegisterOtpCode('');
    } catch (err) {
      showToast(err.message || 'OTP verification failed', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // RESEND REGISTRATION EMAIL OTP
  // ---------------------------------------------------------------------------
  const handleResendRegisterOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    setResendingOtp(true);

    try {
      await sendRegisterOtp({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone,
        roomNumber
      });
      setCountdown(600);
      setRegisterOtpCode('');
      showToast(`New verification code sent to ${cleanEmail}.`, 'success', 5000);
    } catch (err) {
      showToast(err.message || 'Failed to resend verification code', 'error', 5000);
    } finally {
      setResendingOtp(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MOBILE SMS OTP LOGIN (ALTERNATIVE OPTION)
  // ---------------------------------------------------------------------------
  const handleSendMobileSms = async () => {
    if (!otpPhone || otpPhone.trim().length < 8) {
      showToast('Please enter a valid mobile number with country code.', 'warning');
      return;
    }

    setSendingSms(true);
    try {
      const res = await sendOtp(otpPhone);
      setSmsOtpSent(true);
      setSmsCountdown(300);
      if (res.devCode) {
        setSmsOtpCode(res.devCode);
        showToast(`Twilio Trial: Unverified number. Test OTP: ${res.devCode}`, 'info', 8000);
      } else {
        showToast(res.message || 'OTP verification code sent via SMS to your mobile.', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to send OTP SMS', 'error');
    } finally {
      setSendingSms(false);
    }
  };

  const handleVerifyMobileSms = async (e) => {
    e.preventDefault();
    if (!smsOtpCode || smsOtpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit SMS code.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await loginWithOtp(otpPhone, smsOtpCode);
      showToast('Mobile OTP verified! Welcome to Smart Mess.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to verify OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 1-CLICK QUICK DEMO LOGIN
  // ---------------------------------------------------------------------------
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden subtle-mesh-bg">
      {/* Subtle Stripe-like ambient gradient blur shapes behind header */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-orange-400/10 via-amber-300/15 to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2.5xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-stripe-md shadow-orange-500/20 mx-auto mb-4 border border-white/60">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Smart<span className="text-orange-600">Mess</span>
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 font-medium">
          Digital Token & Campus Food Credit Management Platform
        </p>
      </div>

      {/* Centered Main Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-stripe-lg border border-slate-200/80 relative overflow-hidden">
          
          {/* Top highlight bar */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

          {/* Main Tab Switcher: Sign In vs Register */}
          {(!isRegister || registerStep === 'form') && (
            <div className="flex bg-slate-100/90 p-1 rounded-xl mb-6 border border-slate-200/50">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setRegisterStep('form'); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 ${
                  !isRegister 
                    ? 'bg-white text-slate-900 shadow-stripe-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setRegisterStep('form'); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 ${
                  isRegister 
                    ? 'bg-white text-slate-900 shadow-stripe-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Register Student
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: SIGN IN (EMAIL + PASSWORD - NO OTP)                        */}
          {/* ================================================================= */}
          {!isRegister ? (
            <div>
              {/* Login Method Toggle: Password vs Mobile SMS */}
              <div className="flex items-center justify-center gap-1.5 mb-5 p-1 bg-slate-50 border border-slate-200/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    loginMethod === 'password'
                      ? 'bg-white text-orange-600 shadow-stripe-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
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
                      ? 'bg-white text-orange-600 shadow-stripe-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile SMS</span>
                </button>
              </div>

              {loginMethod === 'password' ? (
                /* Standard Email & Password Sign In (NO OTP) */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Campus Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="student@vitstudent.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Mobile SMS Sign In */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Registered Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="+91-9876543210"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value)}
                          disabled={smsOtpSent}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition disabled:bg-slate-100"
                        />
                      </div>
                      {!smsOtpSent ? (
                        <button
                          type="button"
                          onClick={handleSendMobileSms}
                          disabled={sendingSms || !otpPhone}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-stripe-sm transition shrink-0"
                        >
                          {sendingSms ? 'Sending...' : 'Send SMS'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setSmsOtpSent(false); setSmsOtpCode(''); }}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition text-xs font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {smsOtpSent && (
                    <form onSubmit={handleVerifyMobileSms} className="space-y-4 pt-2 animate-fade-in">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Enter 6-Digit SMS Code
                          </label>
                          <span className="text-xs font-mono font-bold text-orange-600">
                            ⏱️ {formatTimer(smsCountdown)}
                          </span>
                        </div>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            maxLength="6"
                            required
                            autoFocus
                            placeholder="••••••"
                            value={smsOtpCode}
                            onChange={(e) => setSmsOtpCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-lg font-mono font-bold tracking-widest text-center focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || smsOtpCode.length !== 6 || smsCountdown <= 0}
                        className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50"
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

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <span>Didn't receive SMS?</span>
                        <button
                          type="button"
                          onClick={handleSendMobileSms}
                          disabled={sendingSms || smsCountdown > 240}
                          className="font-bold text-orange-600 hover:text-orange-700 disabled:opacity-40 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Resend SMS</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* 1-Click Quick Demo Login Switcher */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center mb-3">
                  ⚡ 1-Click Quick Demo Switcher
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('password'); handleQuickDemoLogin('student@vitstudent.ac.in', 'password123'); }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-orange-500/80 hover:bg-orange-50/40 transition shadow-stripe-sm group"
                  >
                    <GraduationCap className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800 mt-1">Student</span>
                    <span className="text-[10px] font-medium text-slate-400">9k Credits</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      setPassword('password123');
                      showToast('Enter your configured CHEF_EMAIL to sign in as Chef.', 'info', 4000);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-amber-500/80 hover:bg-amber-50/40 transition shadow-stripe-sm group"
                    title="Enter the email configured in CHEF_EMAIL environment variable"
                  >
                    <ChefHat className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800 mt-1">Chef</span>
                    <span className="text-[10px] font-medium text-slate-400">Kitchen</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      setPassword('password123');
                      showToast('Enter your configured ADMIN_EMAIL to sign in as Admin.', 'info', 4000);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-purple-500/80 hover:bg-purple-50/40 transition shadow-stripe-sm group"
                    title="Enter the email configured in ADMIN_EMAIL environment variable"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800 mt-1">Admin</span>
                    <span className="text-[10px] font-medium text-slate-400">Management</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* TAB 2: REGISTER STUDENT (EMAIL OTP VERIFICATION FLOW)            */
            /* =============================================================== */
            <div>
              {registerStep === 'form' ? (
                /* Step 1: Student Details Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Alex Chen"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hostel Room</label>
                      <div className="relative">
                        <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. B-302"
                          value={roomNumber}
                          onChange={(e) => setRoomNumber(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile Phone</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="+91-9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        VIT Campus Email
                      </label>
                      {email && (
                        <span className={`text-[10px] font-bold ${isVitEmail ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isVitEmail ? '✓ Valid VIT' : '✗ @vitstudent.ac.in'}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="your.name2024@vitstudent.ac.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 bg-slate-50/80 border rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-4 transition ${
                          email && !isVitEmail
                            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                            : 'border-slate-200/80 focus:border-orange-500 focus:ring-orange-500/10'
                        }`}
                      />
                    </div>

                    {email && !isVitEmail && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Only VIT student email addresses (@vitstudent.ac.in) are allowed.</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-2 shadow-stripe-sm">
                    <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>A <strong>6-digit OTP code</strong> will be sent to your email to verify and activate your 9,000 monthly credits.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isVitEmail}
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Continue to Email Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter Email OTP Screen */
                <div className="space-y-4 animate-fade-in">
                  <div className="text-center space-y-1">
                    <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center mx-auto mb-2 shadow-stripe-sm">
                      <Mail className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-black text-slate-900">
                      Verify Your VIT Email
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Enter the 6-digit verification code sent to <br />
                      <strong className="text-slate-800 font-bold">{email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyRegisterOtp} className="space-y-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Enter 6-Digit Email OTP
                        </label>
                        <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/60">
                          ⏱️ {formatTimer(countdown)}
                        </span>
                      </div>

                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength="6"
                          required
                          autoFocus
                          placeholder="••••••"
                          value={registerOtpCode}
                          onChange={(e) => setRegisterOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xl font-mono font-bold tracking-widest text-center focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Code valid for 10 minutes. 5 max attempts allowed.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || registerOtpCode.length !== 6 || countdown <= 0}
                      className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify & Create Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => { setRegisterStep('form'); setRegisterOtpCode(''); }}
                        className="font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back / Edit Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResendRegisterOtp}
                        disabled={resendingOtp || countdown > 0}
                        className="font-bold text-orange-600 hover:text-orange-700 disabled:opacity-40 flex items-center gap-1"
                        title={countdown > 0 ? `Wait ${formatTimer(countdown)} before resending` : 'Resend Code'}
                      >
                        <RotateCcw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                        <span>{resendingOtp ? 'Sending...' : 'Resend OTP'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
