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
  Sparkles,
  Building2,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export function Login() {
  const { login, register, sendLoginOtp, loginWithOtp } = useAuth();
  const { showToast } = useToast();

  // View state: 'role_select' | 'student' | 'chef' | 'admin' | 'warden' | 'register'
  const getViewFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/register')) return 'register';
    if (path.includes('/login/chef')) return 'chef';
    if (path.includes('/login/admin')) return 'admin';
    if (path.includes('/login/warden')) return 'warden';
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

  // Role Accent Configurations for White & Orange Theme
  const isStudentView = view === 'student' || view === 'register';
  const isChefView = view === 'chef';
  const isWardenView = view === 'warden';
  const isAdminView = view === 'admin';

  const roleAccentColor = isStudentView ? '#FF6B35' : isChefView ? '#EA580C' : isWardenView ? '#D97706' : '#C2410C';
  const roleHoverBorder = isStudentView ? 'hover:border-[#FF6B35]/40' : isChefView ? 'hover:border-[#EA580C]/40' : isWardenView ? 'hover:border-[#D97706]/40' : 'hover:border-[#C2410C]/40';

  const roleBadgeStyle = isStudentView
    ? 'bg-[#FFF7F0] text-[#FF6B35] border border-orange-200'
    : isChefView
    ? 'bg-orange-50 text-[#EA580C] border border-orange-200'
    : isWardenView
    ? 'bg-amber-50 text-[#D97706] border border-amber-200'
    : 'bg-orange-50 text-[#C2410C] border border-orange-200';

  const rolePrimaryButton = isStudentView
    ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#E85A2A] hover:to-[#EA580C] text-white shadow-[0_2px_10px_rgba(255,107,53,0.25)] hover:shadow-[0_4px_16px_rgba(255,107,53,0.35)]'
    : isChefView
    ? 'bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#C2410C] hover:to-[#9A3412] text-white shadow-[0_2px_10px_rgba(234,88,12,0.25)] hover:shadow-[0_4px_16px_rgba(234,88,12,0.35)]'
    : isWardenView
    ? 'bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#92400E] text-white shadow-[0_2px_10px_rgba(217,119,6,0.25)] hover:shadow-[0_4px_16px_rgba(217,119,6,0.35)]'
    : 'bg-gradient-to-r from-[#C2410C] to-[#9A3412] hover:from-[#9A3412] hover:to-[#7C2D12] text-white shadow-[0_2px_10px_rgba(194,65,12,0.25)] hover:shadow-[0_4px_16px_rgba(194,65,12,0.35)]';

  const roleInputFocus = isStudentView
    ? 'focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15'
    : isChefView
    ? 'focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/15'
    : isWardenView
    ? 'focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/15'
    : 'focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15';

  // =========================================================================
  // VIEW 1: CLEAN WHITE & ORANGE ROLE-SELECTION LANDING PAGE (route: "/")
  // =========================================================================
  if (view === 'role_select') {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B16] font-sans relative overflow-x-hidden selection:bg-[#FF6B35] selection:text-white">
        
        {/* Very subtle warm gradient blob in far background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-orange-100/35 via-amber-50/20 to-transparent blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 lg:py-16 relative z-10 flex flex-col items-center">
          
          {/* Top Brand Logo + App Name */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(255,107,53,0.3)]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E1B16] font-heading">
              Smart<span className="text-[#FF6B35]">Mess</span>
            </span>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl space-y-6 animate-slide-up">
            
            {/* Badge Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF7F0] border border-orange-200 text-[#FF6B35] text-xs font-semibold shadow-soft-sm">
              <span className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
              <span>Campus Food & Credit Platform</span>
            </div>

            {/* Large Bold Headline (2 Lines) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] font-heading">
              <span className="text-[#1E1B16] block">Smart dining,</span>
              <span className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] bg-clip-text text-transparent block mt-1">
                seamlessly managed.
              </span>
            </h1>

            {/* Subtext Paragraph */}
            <p className="text-sm sm:text-base text-[#6B6560] max-w-xl mx-auto leading-relaxed font-normal">
              SmartMess connects students, chefs, and admins on one platform — from ordering to credit top-ups to kitchen management.
            </p>

            {/* Two Hero Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('role-selection-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#E85A2A] hover:to-[#EA580C] text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-[0_2px_10px_rgba(255,107,53,0.25)] hover:shadow-[0_4px_16px_rgba(255,107,53,0.35)] transition-all duration-200 active:scale-[0.98] flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  document.getElementById('role-selection-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white hover:bg-[#FFF7F0] border border-stone-200 hover:border-orange-300 text-[#1E1B16] hover:text-[#FF6B35] font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-200 shadow-soft-sm"
              >
                Learn More
              </button>
            </div>

          </div>

          {/* Subtle Horizontal Divider */}
          <div className="w-full max-w-4xl h-px bg-stone-200/80 my-14" />

          {/* Role Cards Section */}
          <div id="role-selection-section" className="w-full space-y-8 scroll-mt-8">
            
            <div className="text-center space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E1B16] font-heading">
                Choose how you'd like to sign in
              </h2>
              <p className="text-xs sm:text-sm text-[#6B6560]">
                Select your role to initialize your authenticated dining session
              </p>
            </div>

            {/* Four Clean White Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto w-full">
              
              {/* Card 1: Student (#FF6B35) */}
              <div
                onClick={() => navigateTo('student', '/login/student')}
                className="group cursor-pointer bg-[#FFFFFF] border border-stone-200 hover:border-[#FF6B35]/40 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF7F0] text-[#FF6B35] border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E1B16] font-heading group-hover:text-[#FF6B35] transition-colors">
                      Student
                    </h3>
                    <p className="text-xs text-[#6B6560] mt-1.5 leading-relaxed">
                      Order meals, track live queue tokens, and manage your 9,000 monthly credits.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                  <span className="text-xs font-semibold text-[#FF6B35] group-hover:text-[#E85A2A] transition-colors">
                    Student Portal
                  </span>
                  <div className="w-7 h-7 rounded-full bg-[#FFF7F0] border border-orange-100 group-hover:bg-[#FF6B35] group-hover:text-white flex items-center justify-center transition-all duration-200 text-[#FF6B35]">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 2: Chef (#EA580C) */}
              <div
                onClick={() => navigateTo('chef', '/login/chef')}
                className="group cursor-pointer bg-[#FFFFFF] border border-stone-200 hover:border-[#EA580C]/40 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#EA580C] border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E1B16] font-heading group-hover:text-[#EA580C] transition-colors">
                      Chef
                    </h3>
                    <p className="text-xs text-[#6B6560] mt-1.5 leading-relaxed">
                      Manage live orders, demand forecasts, and daily food wastage logs.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                  <span className="text-xs font-semibold text-[#EA580C] group-hover:text-[#C2410C] transition-colors">
                    Kitchen Queue
                  </span>
                  <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 group-hover:bg-[#EA580C] group-hover:text-white flex items-center justify-center transition-all duration-200 text-[#EA580C]">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 3: Hostel Warden (#D97706) */}
              <div
                onClick={() => navigateTo('warden', '/login/warden')}
                className="group cursor-pointer bg-[#FFFFFF] border border-stone-200 hover:border-[#D97706]/40 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D97706] border border-amber-200/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E1B16] font-heading group-hover:text-[#D97706] transition-colors">
                      Warden
                    </h3>
                    <p className="text-xs text-[#6B6560] mt-1.5 leading-relaxed">
                      Approve student sick-leave delivery requests for your assigned hostel block.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                  <span className="text-xs font-semibold text-[#D97706] group-hover:text-[#B45309] transition-colors">
                    Warden Portal
                  </span>
                  <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 group-hover:bg-[#D97706] group-hover:text-white flex items-center justify-center transition-all duration-200 text-[#D97706]">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 4: Admin (#C2410C) */}
              <div
                onClick={() => navigateTo('admin', '/login/admin')}
                className="group cursor-pointer bg-[#FFFFFF] border border-stone-200 hover:border-[#C2410C]/40 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#C2410C] border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E1B16] font-heading group-hover:text-[#C2410C] transition-colors">
                      Admin
                    </h3>
                    <p className="text-xs text-[#6B6560] mt-1.5 leading-relaxed">
                      Campus dining governance, student credit allotments, and audit logs.
                    </p>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                  <span className="text-xs font-semibold text-[#C2410C] group-hover:text-[#9A3412] transition-colors">
                    Admin Console
                  </span>
                  <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 group-hover:bg-[#C2410C] group-hover:text-white flex items-center justify-center transition-all duration-200 text-[#C2410C]">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Footer Note */}
          <div className="mt-16 text-center text-xs text-[#9B9590]">
            VIT University Campus Mess Network • Secure 256-bit SSL
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGIN PAGES (Student, Chef, Admin) & REGISTER (Student) — WHITE & ORANGE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FFF7F0] text-[#1E1B16] font-sans flex flex-col justify-between items-center py-12 px-4 sm:px-6 relative selection:bg-[#FF6B35] selection:text-white">
      
      {/* Top Centered Brand Header */}
      <div className="text-center mb-6 space-y-2 relative z-10 animate-fade-in">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(255,107,53,0.25)] mx-auto">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1E1B16] font-heading">
          Smart<span className="text-[#FF6B35]">Mess</span>
        </h1>
        <p className="text-xs text-[#6B6560] font-medium">
          Campus Food & Credit Platform
        </p>
      </div>

      {/* =================================================================== */}
      {/* LOGIN CARD (Student, Chef, Admin, Warden) — CLEAN WHITE CARD        */}
      {/* =================================================================== */}
      {(view === 'student' || view === 'chef' || view === 'admin' || view === 'warden') && (
        <div className="max-w-[460px] w-full my-auto space-y-4 relative z-10 animate-fade-in">
          
          {/* Back to Role Selection Link */}
          <button
            type="button"
            onClick={() => navigateTo('role_select', '/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6560] hover:text-[#1E1B16] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to role selection</span>
          </button>

          {/* Clean White Card */}
          <div className="bg-[#FFFFFF] rounded-2xl p-7 sm:p-8 border border-stone-200/80 shadow-card space-y-6">
            
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#FFF7F0', color: roleAccentColor }}
                >
                  {view === 'student' ? 'Student Portal' : view === 'chef' ? 'Chef Station' : view === 'warden' ? 'Warden Portal' : 'Admin Console'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1E1B16] font-heading">
                Sign in to your account
              </h2>
              <p className="text-xs text-[#6B6560] mt-1">
                {view === 'student'
                  ? 'Access your daily meal tray, live queue tokens, and dining credits'
                  : view === 'chef'
                  ? 'Enter kitchen credentials to dispatch and advance cooking orders'
                  : view === 'warden'
                  ? 'Sign in to review and authorize sick-leave delivery requests for your hostel block'
                  : 'Enter campus administrator credentials to access governance console'}
              </p>
            </div>

            {/* Chef / Admin / Warden Security Notice Banners */}
            {view === 'chef' && (
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-[#EA580C] flex items-start gap-2.5">
                <ChefHat className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <span>Single-account authorized portal for campus kitchen culinary staff.</span>
              </div>
            )}

            {view === 'warden' && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-[#D97706] flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>Hostel Warden portal: Authorized login to review and approve sick-leave meal delivery requests.</span>
              </div>
            )}

            {view === 'admin' && (
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-[#C2410C] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#C2410C] shrink-0 mt-0.5" />
                <span>Restricted campus dining governance & financial ledger console.</span>
              </div>
            )}

            {/* ============================================================= */}
            {/* STUDENT ONLY: 2-METHOD TOGGLE TABS (Password | Mobile OTP)    */}
            {/* ============================================================= */}
            {view === 'student' && (
              <div className="bg-[#FFF7F0] p-1 rounded-xl border border-stone-200 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStudentLoginMethod('password')}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all duration-180 ${
                    studentLoginMethod === 'password'
                      ? 'bg-[#FFFFFF] text-[#FF6B35] shadow-soft-sm font-bold border border-orange-100'
                      : 'text-[#6B6560] hover:text-[#1E1B16]'
                  }`}
                >
                  <Mail className={`w-3.5 h-3.5 ${studentLoginMethod === 'password' ? 'text-[#FF6B35]' : 'text-[#9B9590]'}`} />
                  <span>Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudentLoginMethod('otp')}
                  className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all duration-180 ${
                    studentLoginMethod === 'otp'
                      ? 'bg-[#FFFFFF] text-[#FF6B35] shadow-soft-sm font-bold border border-orange-100'
                      : 'text-[#6B6560] hover:text-[#1E1B16]'
                  }`}
                >
                  <Smartphone className={`w-3.5 h-3.5 ${studentLoginMethod === 'otp' ? 'text-[#FF6B35]' : 'text-[#9B9590]'}`} />
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
                  <label className="block text-xs font-semibold text-[#1E1B16]">
                    {view === 'student' ? 'VIT Student Email' : `${view.charAt(0).toUpperCase() + view.slice(1)} Email`}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder={view === 'student' ? 'student@vitstudent.ac.in' : view === 'warden' ? 'warden.blocka@vitstudent.ac.in' : `${view}@campus.internal`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-3.5 py-2.5 rounded-xl text-sm outline-none transition ${roleInputFocus}`}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E1B16]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition ${roleInputFocus}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9590] hover:text-[#1E1B16] p-1"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-[#6B6560] select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => showToast('Please contact your mess administrator for password resets.', 'info')}
                    className="font-semibold hover:underline"
                    style={{ color: roleAccentColor }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full font-semibold py-3 rounded-xl text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 ${rolePrimaryButton}`}
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
                      <label className="block text-xs font-semibold text-[#1E1B16]">
                        Registered Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={otpPhone}
                          onChange={(e) => setOtpPhone(e.target.value)}
                          className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                        />
                      </div>
                      <p className="text-[11px] text-[#6B6560]">
                        We'll send a 6-digit verification code via Twilio Verify SMS to this number.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !otpPhone}
                      className={`w-full font-semibold py-3 rounded-xl text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 ${rolePrimaryButton}`}
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
                    
                    <div className="p-3 bg-[#FFF7F0] border border-orange-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Smartphone className="w-4 h-4 text-[#FF6B35]" />
                        <span className="text-xs text-[#1E1B16]">
                          Sent to <strong>{maskPhoneNumber(otpPhone)}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                        className="text-xs font-semibold text-[#FF6B35] hover:underline"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-[#1E1B16]">
                          6-Digit Verification Code
                        </label>
                        <span className="text-xs font-mono font-bold text-[#FF6B35]">
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
                        className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] text-center font-mono text-xl tracking-[0.35em] py-2.5 rounded-xl focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className={`w-full font-semibold py-3 rounded-xl text-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 ${rolePrimaryButton}`}
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

                    <div className="flex items-center justify-between text-xs text-[#6B6560] pt-0.5">
                      <span>Didn't receive SMS?</span>
                      <button
                        type="button"
                        onClick={handleResendLoginOtp}
                        disabled={countdown > 0 || resending}
                        className="font-semibold text-[#FF6B35] hover:underline disabled:opacity-40 flex items-center gap-1"
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
              <div className="pt-4 border-t border-stone-100 text-center">
                <p className="text-xs text-[#6B6560]">
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => navigateTo('register', '/register')}
                    className="font-semibold text-[#FF6B35] hover:underline"
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
        <div className="max-w-[480px] w-full my-auto space-y-4 relative z-10 animate-fade-in">
          
          {/* Back to Login Link */}
          <button
            type="button"
            onClick={() => navigateTo('student', '/login/student')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6560] hover:text-[#1E1B16] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to login</span>
          </button>

          {/* Clean White Register Card */}
          <div className="bg-[#FFFFFF] rounded-2xl p-7 sm:p-8 border border-stone-200/80 shadow-card space-y-6">
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFF7F0] text-[#FF6B35] border border-orange-100">
                  Student Registration
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#1E1B16] font-heading">
                Create student account
              </h2>
              <p className="text-xs text-[#6B6560] mt-1">
                Enter your details to receive your 9,000 monthly dining credits
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E1B16]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Chen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                  />
                </div>
              </div>

              {/* VIT Student Email */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#1E1B16]">
                    VIT Student Email <span className="text-rose-500">*</span>
                  </label>
                  {email && (
                    <span className={`text-[11px] font-bold ${isVitEmail ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isVitEmail ? '✓ Valid VIT Email' : '✗ Must be @vitstudent.ac.in'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="name2024@vitstudent.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                  />
                </div>
              </div>

              {/* Mobile Phone Number (Required & Stored) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E1B16]">
                  Mobile Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                  />
                </div>
              </div>

              {/* Hostel Room (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E1B16]">
                  Hostel Room (Optional)
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. B-302"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-3.5 py-2.5 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E1B16]">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-10 py-2.5 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9590] hover:text-[#1E1B16] p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E1B16]">
                    Confirm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#FAFAF9] focus:bg-[#FFFFFF] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-10 pr-10 py-2.5 rounded-xl text-sm focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9590] hover:text-[#1E1B16] p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Allowance Information Banner */}
              <div className="p-3 bg-[#FFF7F0] border border-orange-200/80 rounded-xl text-xs text-[#FF6B35] flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
                <span>Upon registration, <strong>9,000 monthly dining credits</strong> will be allocated immediately to your student wallet.</span>
              </div>

              {/* Primary Button */}
              <button
                type="submit"
                disabled={loading || !isVitEmail}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#E85A2A] hover:to-[#EA580C] text-white font-semibold py-3 rounded-xl text-sm shadow-[0_2px_10px_rgba(255,107,53,0.25)] hover:shadow-[0_4px_16px_rgba(255,107,53,0.35)] transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="pt-3 border-t border-stone-100 text-center">
              <p className="text-xs text-[#6B6560]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigateTo('student', '/login/student')}
                  className="font-semibold text-[#FF6B35] hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Bottom Footer Text */}
      <div className="mt-8 text-center text-xs text-[#9B9590] relative z-10">
        VIT University Campus Mess Network • Secure 256-bit SSL
      </div>

    </div>
  );
}
