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
  ArrowLeft, 
  Coins, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import confetti from 'canvas-confetti';

export function StudentLogin({ onBack }) {
  const { login, register, sendOtp, loginWithOtp } = useAuth();
  const { showToast } = useToast();

  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [loading, setLoading] = useState(false);

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

  // 1. Student Sign In (Email + Password)
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

  // 2. Student Direct Registration (1-Step, No OTP)
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
      await register({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone,
        roomNumber
      });

      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      showToast('🎉 Account created successfully! 9,000 monthly dining credits granted. Welcome to Smart Mess!', 'success', 7000);
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // Mobile SMS OTP Handlers
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
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col md:flex-row relative overflow-hidden">
      
      {/* LEFT 45% PANEL: Violet Gradient & Cosmic Atmosphere */}
      <div className="w-full md:w-[45%] bg-gradient-to-br from-[#1A1F3A] via-[#131728] to-[#0B0E1A] border-b md:border-b-0 md:border-r border-border text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Ambient atmospheric glow inside panel */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#8B5CF6]/25 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-64 h-64 bg-[#06B6D4]/15 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 opacity-15 bg-cyber-grid pointer-events-none" />
        
        {/* Top Back / Logo */}
        <div className="relative z-10 space-y-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#131728]/80 hover:bg-[#1A1F3A] text-[#F1F5F9] text-xs font-semibold backdrop-blur-md transition active:scale-95 border border-border"
          >
            <ArrowLeft className="w-4 h-4 text-[#8B5CF6]" />
            <span>← Back to role selection</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white border border-white/20 shadow-level-4">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block text-ink font-heading">SmartMess</span>
              <span className="text-xs text-[#8B5CF6] font-medium font-heading">Student Dining Hub</span>
            </div>
          </div>
        </div>

        {/* Middle Messaging */}
        <div className="relative z-10 py-6 sm:py-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center shadow-glow-primary border border-[#8B5CF6]/30 mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-ink font-heading">
            Welcome back, <br />
            <span className="text-gradient">Student</span>
          </h2>
          
          <p className="text-body text-xs sm:text-sm leading-relaxed max-w-md">
            Order fresh meals, monitor live queue tokens, and manage your 9,000 monthly dining credits.
          </p>

          <div className="pt-3 space-y-2.5 text-xs text-body font-medium hidden sm:block">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </div>
              <span>Instant pickup token queue generation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </div>
              <span>9,000 monthly credit balance ledger & Razorpay top-up</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-[#8B5CF6]" />
              </div>
              <span>Direct registration for @vitstudent.ac.in accounts</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer note */}
        <div className="relative z-10 pt-4 border-t border-border text-xs text-muted hidden md:block">
          VIT University Campus Mess Network
        </div>
      </div>

      {/* RIGHT 55% PANEL: Centered Form with Violet Glow */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14">
        
        {/* Mobile Back Button (Visible only on mobile) */}
        <div className="w-full max-w-md md:hidden mb-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs text-muted hover:text-ink transition font-heading"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>← Back to role selection</span>
          </button>
        </div>

        <div className="max-w-md w-full card space-y-6 shadow-level-2 border-[#8B5CF6]/20">
          
          {/* Header */}
          <div>
            <span className="text-micro text-[#8B5CF6] block mb-1">Student Portal</span>
            <h2 className="text-h2 text-ink font-heading">
              {isRegister ? 'Register Student Account' : 'Sign In'}
            </h2>
            <p className="text-body text-xs sm:text-sm mt-1">
              {isRegister ? 'Direct registration with your official VIT student email' : 'Access your daily menu and credit balance'}
            </p>
          </div>

          {/* Tab Switcher: Sign In vs Register */}
          <div className="flex bg-[#0B0E1A] p-1 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all duration-200 font-heading ${
                !isRegister 
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-glow-primary' 
                  : 'text-muted hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2 rounded-[10px] text-xs sm:text-sm font-semibold transition-all duration-200 font-heading ${
                isRegister 
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-glow-primary' 
                  : 'text-muted hover:text-ink'
              }`}
            >
              Register Student
            </button>
          </div>

          {/* =============================================================== */}
          {/* TAB 1: SIGN IN                                                  */}
          {/* =============================================================== */}
          {!isRegister ? (
            <div className="space-y-5">
              {/* Method Switcher */}
              <div className="flex items-center justify-center gap-1.5 p-1 bg-[#0B0E1A] border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-semibold transition flex items-center justify-center gap-1.5 font-heading ${
                    loginMethod === 'password'
                      ? 'bg-[#131728] text-[#8B5CF6] border border-[#8B5CF6]/30 shadow-level-1'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email & Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`flex-1 py-1.5 px-3 rounded-[8px] text-xs font-semibold transition flex items-center justify-center gap-1.5 font-heading ${
                    loginMethod === 'otp'
                      ? 'bg-[#131728] text-[#06B6D4] border border-[#06B6D4]/30 shadow-level-1'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile SMS</span>
                </button>
              </div>

              {loginMethod === 'password' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">
                      VIT Student Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@vitstudent.ac.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
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
                      className="input-field focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/50 shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] shadow-glow-primary hover:from-[#7C3AED] hover:to-[#4F46E5]"
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
              ) : (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">
                      Registered Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="+91-9876543210"
                        value={otpPhone}
                        onChange={(e) => setOtpPhone(e.target.value)}
                        disabled={smsOtpSent}
                        className="input-field flex-1 focus:border-[#8B5CF6]"
                      />
                      {!smsOtpSent ? (
                        <button
                          type="button"
                          onClick={handleSendMobileSms}
                          disabled={sendingSms || !otpPhone}
                          className="px-4 bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 text-[#8B5CF6] border border-[#8B5CF6]/40 font-semibold text-xs rounded-btn shadow-level-1 transition shrink-0 font-heading"
                        >
                          {sendingSms ? 'Sending...' : 'Send SMS'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setSmsOtpSent(false); setSmsOtpCode(''); }}
                          className="px-3 bg-[#1A1F3A] hover:bg-[#23294C] text-ink rounded-btn text-xs font-semibold border border-border"
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
                          <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">
                            6-Digit SMS Code
                          </label>
                          <span className="text-xs font-mono font-bold text-[#06B6D4]">
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
                          className="input-field font-mono text-lg tracking-widest text-center focus:border-[#8B5CF6]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || smsOtpCode.length !== 6 || smsCountdown <= 0}
                        className="w-full btn-primary bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]"
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
                          className="font-semibold text-[#8B5CF6] hover:underline disabled:opacity-40"
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
            /* TAB 2: REGISTER STUDENT (DIRECT 1-STEP REGISTRATION)             */
            /* =============================================================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field focus:border-[#8B5CF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">Hostel Room</label>
                  <input
                    type="text"
                    placeholder="e.g. B-302"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="input-field focus:border-[#8B5CF6]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="+91-9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field focus:border-[#8B5CF6]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">
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
                  className="input-field focus:border-[#8B5CF6]"
                />
                {email && !isVitEmail && (
                  <p className="text-xs text-status-danger mt-1">
                    Only official VIT student email addresses are permitted.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider font-heading">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field focus:border-[#8B5CF6]"
                />
              </div>

              <div className="p-3 bg-[#34D399]/10 rounded-xl border border-[#34D399]/30 text-xs text-[#34D399] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#34D399] shrink-0 mt-0.5" />
                <span>Upon registration, <strong>9,000 monthly dining credits</strong> will be allocated immediately.</span>
              </div>

              <button
                type="submit"
                disabled={loading || !isVitEmail}
                className="w-full btn-primary mt-2 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] shadow-glow-primary"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account & Grant 9k Credits</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
