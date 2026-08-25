import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Home, 
  ArrowRight, 
  GraduationCap, 
  CheckCircle, 
  Smartphone, 
  KeyRound, 
  RotateCcw, 
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Coins
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

export function StudentLogin({ onBack }) {
  const { login, sendOtp, loginWithOtp, sendRegisterOtp, verifyRegisterOtp } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [loading, setLoading] = useState(false);

  // Registration OTP Step: 'form' | 'otp'
  const [registerStep, setRegisterStep] = useState('form');
  const [registerOtpCode, setRegisterOtpCode] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [resendingOtp, setResendingOtp] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Mobile SMS OTP state
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

  // 1. Student Sign In (Email + Password - NO OTP)
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

  // 2. Student Registration Step 1: Send Email OTP
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
      setCountdown(600);
      setRegisterOtpCode('');
      showToast(`📧 Verification code sent to ${cleanEmail}. Enter the 6-digit OTP to complete registration.`, 'success', 6000);
    } catch (err) {
      showToast(err.message || 'Failed to send verification code', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // 3. Student Registration Step 2: Verify Email OTP
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

  // Resend OTP
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

  // Mobile SMS OTP
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

  const isVitEmail = email.trim().toLowerCase().endsWith('@vitstudent.ac.in');

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col md:flex-row">
      
      {/* LEFT 45% PANEL: Branded Gradient Panel with Messaging */}
      <div className="w-full md:w-[45%] bg-gradient-to-br from-[#FF6B35] via-[#FF7A45] to-[#F7931E] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
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
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">SmartMess</span>
              <span className="text-xs text-orange-100 font-medium">Campus Food & Credit Hub</span>
            </div>
          </div>
        </div>

        {/* Middle Messaging */}
        <div className="relative z-10 py-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#FF6B35] flex items-center justify-center shadow-level-2 mb-2">
            <GraduationCap className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-3.5xl font-bold tracking-tight leading-snug">
            Student Meal Portal & Credit Management
          </h2>
          
          <p className="text-orange-100 text-sm sm:text-[15px] leading-relaxed max-w-md">
            Order food without waiting in lines. Every active student receives <strong>9,000 monthly credits</strong> with instant Razorpay top-ups.
          </p>

          <div className="pt-4 space-y-2.5 text-xs text-orange-50/90 font-medium">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Instant pickup token queue system</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Transparent credit audit ledger & refunds</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <span>Verified student registration via Email OTP</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer note */}
        <div className="relative z-10 pt-4 border-t border-white/20 text-xs text-orange-100/80">
          VIT University Campus Mess Network
        </div>
      </div>

      {/* RIGHT 55% PANEL: Form Panel Centered Vertically */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#FAFAFB]">
        <div className="max-w-md w-full bg-white p-7 sm:p-9 rounded-2xl shadow-level-1 border border-border space-y-6">
          
          {/* Header */}
          <div>
            <span className="text-micro text-[#FF6B35] font-semibold block mb-1">Student Portal</span>
            <h2 className="text-h2 text-ink">
              {isRegister ? 'Register Student Account' : 'Sign in to Your Account'}
            </h2>
            <p className="text-body text-xs sm:text-sm mt-1">
              {isRegister ? 'Sign up with your official VIT student email' : 'Access your daily menu and credit balance'}
            </p>
          </div>

          {/* Tab Switcher: Sign In vs Register (Hidden on OTP verification step) */}
          {(!isRegister || registerStep === 'form') && (
            <div className="flex bg-[#FAFAFB] p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => { setIsRegister(false); setRegisterStep('form'); }}
                className={`flex-1 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  !isRegister 
                    ? 'bg-white text-ink shadow-level-1' 
                    : 'text-muted hover:text-ink'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegister(true); setRegisterStep('form'); }}
                className={`flex-1 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isRegister 
                    ? 'bg-white text-ink shadow-level-1' 
                    : 'text-muted hover:text-ink'
                }`}
              >
                Register Student
              </button>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: SIGN IN                                                  */}
          {/* =============================================================== */}
          {!isRegister ? (
            <div className="space-y-5">
              {/* Method Switcher */}
              <div className="flex items-center justify-center gap-1.5 p-1 bg-[#FAFAFB] border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    loginMethod === 'password'
                      ? 'bg-white text-[#FF6B35] shadow-level-1 border border-border'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    loginMethod === 'otp'
                      ? 'bg-white text-[#FF6B35] shadow-level-1 border border-border'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile SMS</span>
                </button>
              </div>

              {loginMethod === 'password' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                      VIT Student Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@vitstudent.ac.in"
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
                    className="w-full btn-primary"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Student Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                      Registered Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="+91-9876543210"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        disabled={smsOtpSent}
                        className="input-field flex-1"
                      />
                      {!smsOtpSent ? (
                        <button
                          type="button"
                          onClick={handleSendMobileSms}
                          disabled={sendingSms || !otpPhone}
                          className="px-4 bg-ink text-white font-semibold text-xs rounded-btn shadow-level-1 hover:bg-black transition shrink-0"
                        >
                          {sendingSms ? 'Sending...' : 'Send SMS'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setSmsOtpSent(false); setSmsOtpCode(''); }}
                          className="px-3 bg-slate-100 hover:bg-slate-200 text-ink rounded-btn text-xs font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {smsOtpSent && (
                    <form onSubmit={handleVerifyMobileSms} className="space-y-5 pt-2 animate-fade-in">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                            6-Digit SMS Code
                          </label>
                          <span className="text-xs font-mono font-bold text-[#FF6B35]">
                            ⏱️ {formatTimer(smsCountdown)}
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength="6"
                          required
                          autoFocus
                          placeholder="••••••"
                          value={smsOtpCode}
                          onChange={(e) => setSmsOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="input-field font-mono text-lg tracking-widest text-center"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || smsOtpCode.length !== 6 || smsCountdown <= 0}
                        className="w-full btn-primary"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Verify SMS & Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-xs text-muted pt-1">
                        <span>Didn't receive SMS?</span>
                        <button
                          type="button"
                          onClick={handleSendMobileSms}
                          disabled={sendingSms || smsCountdown > 240}
                          className="font-semibold text-[#FF6B35] hover:underline disabled:opacity-40"
                        >
                          Resend SMS
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* =============================================================== */
            /* TAB 2: REGISTER STUDENT (EMAIL OTP FLOW)                         */
            /* =============================================================== */
            <div>
              {registerStep === 'form' ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Chen"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider">Hostel Room</label>
                      <input
                        type="text"
                        placeholder="e.g. B-302"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider">Mobile Phone</label>
                      <input
                        type="tel"
                        placeholder="+91-9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                        VIT Student Email
                      </label>
                      {email && (
                        <span className={`text-[11px] font-bold ${isVitEmail ? 'text-status-success' : 'text-status-danger'}`}>
                          {isVitEmail ? '✓ Valid VIT' : '✗ @vitstudent.ac.in'}
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="your.name2024@vitstudent.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                    {email && !isVitEmail && (
                      <p className="text-xs text-status-danger mt-1">
                        Only official VIT student email addresses are permitted.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <span>A <strong>6-digit OTP code</strong> will be sent to verify and allocate your 9,000 monthly credits.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isVitEmail}
                    className="w-full btn-primary mt-2"
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
                <div className="space-y-5 animate-fade-in">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF6B35] flex items-center justify-center mx-auto mb-2 border border-orange-100">
                      <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="text-h3 text-ink">
                      Verify Your VIT Email
                    </h3>
                    <p className="text-body text-xs max-w-xs mx-auto">
                      Enter the 6-digit verification code sent to <br />
                      <strong className="text-ink">{email}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                          6-Digit Email OTP
                        </label>
                        <span className="text-xs font-mono font-bold text-[#FF6B35] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/60">
                          ⏱️ {formatTimer(countdown)}
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        autoFocus
                        placeholder="••••••"
                        value={registerOtpCode}
                        onChange={(e) => setRegisterOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="input-field font-mono text-xl font-bold tracking-widest text-center"
                      />
                    </div>

                    <div className="p-2.5 bg-[#FAFAFB] border border-border rounded-xl text-xs text-muted flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-status-success shrink-0" />
                      <span>Code valid for 10 minutes (5 max attempts).</span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || registerOtpCode.length !== 6 || countdown <= 0}
                      className="w-full btn-primary"
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

                    <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-divider">
                      <button
                        type="button"
                        onClick={() => { setRegisterStep('form'); setRegisterOtpCode(''); }}
                        className="font-semibold text-ink hover:text-[#FF6B35] flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Edit Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResendRegisterOtp}
                        disabled={resendingOtp || countdown > 0}
                        className="font-semibold text-[#FF6B35] hover:underline disabled:opacity-40"
                      >
                        {resendingOtp ? 'Sending...' : 'Resend Code'}
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
