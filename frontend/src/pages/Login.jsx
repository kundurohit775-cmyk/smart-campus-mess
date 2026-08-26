import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Phone, 
  Home, 
  ArrowRight, 
  ArrowLeft, 
  GraduationCap, 
  ChefHat, 
  ShieldCheck, 
  CheckCircle, 
  Smartphone, 
  RotateCw, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export function Login() {
  const { login, register, sendLoginOtp, loginWithOtp } = useAuth();
  const { showToast } = useToast();

  // View state: 'role_select' | 'student' | 'chef' | 'admin' | 'register'
  const getViewFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/register')) return 'register';
    if (path.includes('/login/chef')) return 'chef';
    if (path.includes('/login/admin')) return 'admin';
    if (path.includes('/login/student') || path === '/login') return 'student';
    return 'role_select'; // default for '/'
  };

  const [view, setView] = useState(getViewFromPath);

  // Student Login Method Tab: 'password' | 'otp'
  const [studentLoginMethod, setStudentLoginMethod] = useState('password');

  // Password Login Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Mobile OTP Login Fields
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  // Register Fields (Single Step)
  const [name, setName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Countdown timer for Mobile OTP Login
  useEffect(() => {
    let timer = null;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [otpSent, countdown]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setView(getViewFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (targetView, routePath) => {
    setView(targetView);
    if (targetView === 'student') {
      setStudentLoginMethod('password');
      setOtpSent(false);
      setOtpCode('');
    }
    window.history.pushState({}, '', routePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Password Login Submit Handler (Student, Chef, Admin)
  const handlePasswordLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter your email and password.', 'warning');
      return;
    }

    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    try {
      await login(cleanEmail, password);
      showToast('Welcome back to Smart Campus Mess!', 'success');
    } catch (err) {
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // 2. Student Mobile OTP Login — Step 1: Send OTP
  const handleSendLoginOtp = async (e) => {
    e.preventDefault();

    const cleanPhone = otpPhone.replace(/[^0-9+]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }

    setLoading(true);

    try {
      const res = await sendLoginOtp(cleanPhone);
      setOtpSent(true);
      setCountdown(60);
      showToast(res.message || 'Verification code sent via SMS to your registered mobile number.', 'success', 6000);
    } catch (err) {
      showToast(err.message || 'Failed to send OTP SMS.', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // 3. Student Mobile OTP Login — Step 2: Verify OTP
  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();

    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('Please enter the complete 6-digit verification code.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await loginWithOtp(otpPhone, otpCode.trim());
      showToast('Mobile OTP verified! Welcome back to Smart Campus Mess.', 'success');
    } catch (err) {
      showToast(err.message || 'Invalid or expired verification code.', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // Resend Login OTP
  const handleResendLoginOtp = async () => {
    if (countdown > 0) return;

    setResending(true);
    try {
      const res = await sendLoginOtp(otpPhone);
      setCountdown(60);
      showToast(res.message || 'New verification code sent via SMS.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to resend code.', 'error');
    } finally {
      setResending(false);
    }
  };

  // 4. Student Direct 1-Step Registration Submit Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !regPhone || !password || !confirmPassword) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // STRICT VIT STUDENT EMAIL RESTRICTION
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      showToast('Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.', 'error', 5000);
      return;
    }

    const cleanPhone = regPhone.replace(/[^0-9+]/g, '').trim();
    if (cleanPhone.length < 10) {
      showToast('Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: cleanEmail,
        password,
        phone: cleanPhone,
        roomNumber: roomNumber.trim()
      });

      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      showToast('🎉 Account created successfully! 9,000 monthly dining credits granted.', 'success', 7000);
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const isVitEmail = email.trim().toLowerCase().endsWith('@vitstudent.ac.in');

  const maskPhoneNumber = (rawPhone) => {
    if (!rawPhone) return '';
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `+91 ******${digits.slice(-4)}`;
    }
    return rawPhone;
  };

  // =========================================================================
  // VIEW 1: DARK HERO ROLE-SELECTION LANDING PAGE (route: "/")
  // =========================================================================
  if (view === 'role_select') {
    return (
      <div className="min-h-screen bg-[#0B0E1A] text-[#F1F5F9] font-sans relative overflow-x-hidden selection:bg-[#8B5CF6] selection:text-white">
        
        {/* Subtle radial gradient glow behind headline */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#8B5CF6]/15 via-[#6366F1]/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] right-[-100px] w-[500px] h-[500px] bg-[#06B6D4]/10 blur-[140px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 relative z-10 flex flex-col items-center">
          
          {/* Top Brand Logo + App Name */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-white/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#F1F5F9]">
              Smart<span className="text-[#8B5CF6]">Mess</span>
            </span>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl space-y-6 animate-slide-up">
            
            {/* Badge Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(139,92,246,0.12)] border border-[rgba(139,92,246,0.3)] text-[#A78BFA] text-xs font-semibold backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse shadow-[0_0_8px_#A78BFA]" />
              <span>Campus Food & Credit Platform</span>
            </div>

            {/* Large Bold Headline (2 Lines) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              <span className="text-[#F1F5F9] block">Smart dining,</span>
              <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#06B6D4] bg-clip-text text-transparent block mt-1">
                seamlessly managed.
              </span>
            </h1>

            {/* Subtext Paragraph */}
            <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl mx-auto leading-relaxed font-normal">
              SmartMess connects students, chefs, and admins on one platform — from ordering to credit top-ups to kitchen management.
            </p>

            {/* Two Hero Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('role-selection-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] hover:from-[#7C3AED] hover:to-[#0891B2] text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-[0_0_24px_rgba(139,92,246,0.4)] transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  document.getElementById('role-selection-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-[1.5px] border-[#8B5CF6] hover:bg-[#8B5CF6]/10 text-[#A78BFA] font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-200 backdrop-blur-md"
              >
                Learn More
              </button>
            </div>

          </div>

          {/* Subtle Horizontal Divider */}
          <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent my-14" />

          {/* Role Cards Section */}
          <div id="role-selection-section" className="w-full space-y-8 scroll-mt-8">
            
            <div className="text-center space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#F1F5F9]">
                Choose how you'd like to sign in
              </h2>
              <p className="text-xs sm:text-sm text-[#94A3B8]">
                Select your role to initialize your authenticated dining session
              </p>
            </div>

            {/* Three Role Cards Row (Desktop) / Stack (Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              
              {/* Card 1: Student (Violet #8B5CF6) */}
              <div
                onClick={() => navigateTo('student', '/login/student')}
                className="group cursor-pointer bg-[rgba(19,23,40,0.65)] backdrop-blur-xl border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/70 rounded-2xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.3)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center shadow-[0_0_16px_rgba(139,92,246,0.3)] group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F1F5F9] group-hover:text-white transition-colors">
                      Student
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                      Order meals, track live queue tokens, and manage your 9,000 monthly credits.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-[#8B5CF6] group-hover:text-[#A78BFA] transition-colors">
                    Enter Student Portal
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#1A1F3A] border border-[#8B5CF6]/30 group-hover:bg-[#8B5CF6] group-hover:text-white flex items-center justify-center transition-all duration-200 text-[#8B5CF6]">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 2: Chef (Amber #F59E0B) */}
              <div
                onClick={() => navigateTo('chef', '/login/chef')}
                className="group cursor-pointer bg-[rgba(19,23,40,0.65)] backdrop-blur-xl border border-[#F59E0B]/20 hover:border-[#F59E0B]/70 rounded-2xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.3)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center justify-center shadow-[0_0_16px_rgba(245,158,11,0.3)] group-hover:scale-105 transition-transform">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F1F5F9] group-hover:text-white transition-colors">
                      Chef
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                      Manage active meal prep, advance cooking stages, and control portion stock.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-[#F59E0B] group-hover:text-amber-400 transition-colors">
                    Enter Kitchen
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#1A1F3A] border border-[#F59E0B]/30 group-hover:bg-[#F59E0B] group-hover:text-white flex items-center justify-center transition-all duration-200 text-[#F59E0B]">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 3: Admin (Cyan #06B6D4) */}
              <div
                onClick={() => navigateTo('admin', '/login/admin')}
                className="group cursor-pointer bg-[rgba(19,23,40,0.65)] backdrop-blur-xl border border-[#06B6D4]/20 hover:border-[#06B6D4]/70 rounded-2xl p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_32px_rgba(6,182,212,0.3)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/15 text-[#06B6D4] border border-[#06B6D4]/30 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.3)] group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F1F5F9] group-hover:text-white transition-colors">
                      Admin
                    </h3>
                    <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                      Campus dining governance, student credit allotments, and audit logs.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-[#06B6D4] group-hover:text-cyan-400 transition-colors">
                    Enter Console
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#1A1F3A] border border-[#06B6D4]/30 group-hover:bg-[#06B6D4] group-hover:text-white flex items-center justify-center transition-all duration-200 text-[#06B6D4]">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Footer Note */}
          <div className="mt-16 text-center text-xs text-[#64748B]">
            VIT University Campus Mess Network • 256-bit SSL Encrypted
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN PAGES (Student, Chef, Admin) & REGISTER (Student)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#1E293B] font-sans flex flex-col justify-between items-center py-12 px-4 sm:px-6 relative selection:bg-[#6366F1] selection:text-white">
      
      {/* Top Centered Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#6366F1] flex items-center justify-center text-white shadow-md mx-auto">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">
          Smart<span className="text-[#6366F1]">Mess</span>
        </h1>
        <p className="text-xs text-[#64748B] font-medium">
          Campus Food & Credit Platform
        </p>
      </div>

      {/* =================================================================== */}
      {/* LOGIN CARD (Student, Chef, Admin)                                   */}
      {/* =================================================================== */}
      {(view === 'student' || view === 'chef' || view === 'admin') && (
        <div className="max-w-[460px] w-full my-auto space-y-4 animate-fade-in">
          
          {/* Back to Role Selection Link */}
          <button
            type="button"
            onClick={() => navigateTo('role_select', '/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to role selection</span>
          </button>

          {/* White Login Card */}
          <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200/80 space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                  {view === 'student' ? 'Student Portal' : view === 'chef' ? 'Chef Station' : 'Admin Console'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1E293B]">
                Sign in to your account
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                {view === 'student'
                  ? 'Access your daily meal tray, live queue tokens, and dining credits'
                  : view === 'chef'
                  ? 'Enter your kitchen credentials to manage orders'
                  : 'Enter your admin credentials to access the dashboard'}
              </p>
            </div>

            {/* Chef / Admin Security Badges */}
            {view === 'chef' && (
              <div className="p-3 bg-amber-50/80 border border-amber-100 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <ChefHat className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Single-account authorized access for kitchen culinary staff.</span>
              </div>
            )}

            {view === 'admin' && (
              <div className="p-3 bg-cyan-50/80 border border-cyan-100 rounded-xl text-xs text-cyan-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                <span>Restricted campus dining governance & financial audit portal.</span>
              </div>
            )}

            {/* ============================================================= */}
            {/* STUDENT ONLY: 2-METHOD TOGGLE TABS (Password | Mobile OTP)    */}
            {/* ============================================================= */}
            {view === 'student' && (
              <div className="relative bg-[#F1F5F9] p-1 rounded-xl flex items-center">
                <div
                  className="absolute top-1 bottom-1 w-[calc((100%-8px)/2)] bg-white rounded-lg shadow-sm transition-all duration-200 ease-out"
                  style={{ left: studentLoginMethod === 'password' ? '4px' : 'calc(50% + 0px)' }}
                />

                <button
                  type="button"
                  onClick={() => setStudentLoginMethod('password')}
                  className={`relative z-10 flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 ${
                    studentLoginMethod === 'password' ? 'text-[#1E293B]' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <Mail className={`w-3.5 h-3.5 ${studentLoginMethod === 'password' ? 'text-[#6366F1]' : 'text-[#64748B]'}`} />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudentLoginMethod('otp')}
                  className={`relative z-10 flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-colors duration-150 ${
                    studentLoginMethod === 'otp' ? 'text-[#1E293B]' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <Smartphone className={`w-3.5 h-3.5 ${studentLoginMethod === 'otp' ? 'text-[#6366F1]' : 'text-[#64748B]'}`} />
                  <span>Mobile OTP</span>
                </button>
              </div>
            )}

            {/* ============================================================= */}
            {/* FORM 1: PASSWORD LOGIN (Student, Chef, Admin)                 */}
            {/* ============================================================= */}
            {(view !== 'student' || studentLoginMethod === 'password') && (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-4 animate-fade-in">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    {view === 'student' ? 'VIT Student Email' : `${view.charAt(0).toUpperCase() + view.slice(1)} Email`}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder={view === 'student' ? 'student@vitstudent.ac.in' : `${view}@campus.internal`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-10 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[#64748B] select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#6366F1] rounded border-slate-300 focus:ring-[#6366F1]"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => showToast('Please contact your mess administrator for password resets.', 'info')}
                    className="text-[#6366F1] font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-3 rounded-[10px] text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
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
            )}

            {/* ============================================================= */}
            {/* FORM 2: MOBILE OTP LOGIN (Student Only)                       */}
            {/* ============================================================= */}
            {view === 'student' && studentLoginMethod === 'otp' && (
              <div className="space-y-4 animate-fade-in">
                
                {!otpSent ? (
                  /* Step 1: Enter Phone Number */
                  <form onSubmit={handleSendLoginOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-[#1E293B]">
                        Registered Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value)}
                          className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                        />
                      </div>
                      <p className="text-[11px] text-[#64748B]">
                        We'll send a 6-digit verification code via Twilio Verify SMS to this number.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !otpPhone}
                      className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-3 rounded-[10px] text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send OTP via SMS</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: Enter 6-digit OTP */
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-slide-up">
                    
                    <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-[#6366F1]" />
                        <span className="text-xs text-[#1E293B]">
                          Sent to <strong>{maskPhoneNumber(otpPhone)}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                        className="text-xs font-semibold text-[#6366F1] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-[#1E293B]">
                          6-Digit Verification Code
                        </label>
                        <span className="text-xs font-mono font-bold text-[#6366F1]">
                          ⏱️ {countdown > 0 ? `0:${countdown < 10 ? '0' : ''}${countdown}` : 'Expired'}
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength="6"
                        required
                        autoFocus
                        placeholder="••••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] text-center font-mono text-xl tracking-[0.35em] py-2.5 rounded-[10px] focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-3 rounded-[10px] text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Verify OTP & Sign In</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-[#64748B] pt-0.5">
                      <span>Didn't receive SMS?</span>
                      <button
                        type="button"
                        onClick={handleResendLoginOtp}
                        disabled={countdown > 0 || resending}
                        className="font-semibold text-[#6366F1] hover:underline disabled:opacity-40 flex items-center gap-1"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                        <span>{resending ? 'Sending...' : 'Resend OTP'}</span>
                      </button>
                    </div>

                  </form>
                )}

              </div>
            )}

            {/* Bottom Registration Link (Student only) */}
            {view === 'student' && (
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-[#64748B]">
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => navigateTo('register', '/register')}
                    className="font-semibold text-[#6366F1] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* DIRECT 1-STEP STUDENT REGISTRATION CARD (route: "/register")        */}
      {/* =================================================================== */}
      {view === 'register' && (
        <div className="max-w-[480px] w-full my-auto space-y-4 animate-fade-in">
          
          {/* Back to Login Link */}
          <button
            type="button"
            onClick={() => navigateTo('student', '/login/student')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1E293B] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to login</span>
          </button>

          {/* White Register Card */}
          <div className="bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200/80 space-y-6">
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6366F1]">
                  Student Registration
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1E293B]">
                Create student account
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Enter your details to receive your 9,000 monthly dining credits
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                  />
                </div>
              </div>

              {/* VIT Student Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    VIT Student Email <span className="text-rose-500">*</span>
                  </label>
                  {email && (
                    <span className={`text-[11px] font-bold ${isVitEmail ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isVitEmail ? '✓ Valid VIT Email' : '✗ Must be @vitstudent.ac.in'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name2024@vitstudent.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Mobile Phone Number (Required & Collected) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Hostel Room (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  Hostel Room (Optional)
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. B-302"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-10 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    Confirm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-10 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Allowance Information Banner */}
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
                <span>Upon registration, <strong>9,000 monthly dining credits</strong> will be allocated immediately to your student wallet.</span>
              </div>

              {/* Primary Button */}
              <button
                type="submit"
                disabled={loading || !isVitEmail}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-3 rounded-[10px] text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
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

            {/* Bottom Link to Sign In */}
            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-[#64748B]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('student', '/login/student')}
                  className="font-semibold text-[#6366F1] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Bottom Footer Text */}
      <div className="mt-8 text-center text-xs text-[#94A3B8]">
        VIT University Campus Mess Network • 256-bit SSL Encrypted
      </div>

    </div>
  );
}
