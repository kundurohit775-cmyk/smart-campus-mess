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
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

export function Login() {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  // Determine current view from pathname: 'role_select' | 'student' | 'chef' | 'admin' | 'register'
  const getViewFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/register')) return 'register';
    if (path.includes('/login/chef')) return 'chef';
    if (path.includes('/login/admin')) return 'admin';
    if (path.includes('/login/student') || path === '/login') return 'student';
    return 'role_select'; // default for '/'
  };

  const [view, setView] = useState(getViewFromPath);

  // Common login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

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
    window.history.pushState({}, '', routePath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Login Submit Handler
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
      showToast('Welcome back to Smart Campus Mess!', 'success');
    } catch (err) {
      showToast(err.message || 'Authentication failed. Please verify credentials.', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  // Register Submit Handler (Student Only)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      showToast('Please fill in all required fields.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
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
      showToast('🎉 Account created successfully! 9,000 monthly dining credits granted.', 'success', 7000);
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error', 6000);
    } finally {
      setLoading(false);
    }
  };

  const isVitEmail = email.trim().toLowerCase().endsWith('@vitstudent.ac.in');

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
      {/* STEP 1: ROLE SELECTION VIEW (route: "/")                           */}
      {/* =================================================================== */}
      {view === 'role_select' && (
        <div className="max-w-[540px] w-full my-auto space-y-5 animate-fade-in">
          
          <div className="text-center space-y-1 mb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">
              Who are you signing in as?
            </h2>
            <p className="text-xs text-[#64748B]">
              Select your role to access your dedicated portal
            </p>
          </div>

          {/* Three Stacked Role Cards */}
          <div className="space-y-4">
            
            {/* Card 1: Student */}
            <div
              onClick={() => navigateTo('student', '/login/student')}
              className="group cursor-pointer bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-200/80 hover:border-[#6366F1]/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#6366F1] border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] group-hover:text-[#6366F1] transition-colors">
                    Student
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5 font-normal">
                    Order food & manage your credits
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-md">
                    9k+ students
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 group-hover:bg-[#6366F1] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 text-slate-400 shrink-0">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Card 2: Chef */}
            <div
              onClick={() => navigateTo('chef', '/login/chef')}
              className="group cursor-pointer bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-200/80 hover:border-amber-400 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] group-hover:text-amber-600 transition-colors">
                    Chef
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5 font-normal">
                    Manage kitchen orders & menu
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-100/80 px-2 py-0.5 rounded-md">
                    Kitchen access
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 group-hover:bg-amber-500 group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 text-slate-400 shrink-0">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Card 3: Admin */}
            <div
              onClick={() => navigateTo('admin', '/login/admin')}
              className="group cursor-pointer bg-white rounded-2xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-200/80 hover:border-cyan-400 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E293B] group-hover:text-cyan-600 transition-colors">
                    Admin
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5 font-normal">
                    Full platform management
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-100/80 px-2 py-0.5 rounded-md">
                    Full Access
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 group-hover:bg-cyan-500 group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 text-slate-400 shrink-0">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* STEP 2: DEDICATED LOGIN CARDS (Student, Chef, Admin)                */}
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
            
            {/* Heading & Role-Aware Subtext */}
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
                  ? 'Enter your student credentials to access your meal tray & credits'
                  : view === 'chef'
                  ? 'Enter your kitchen credentials to manage orders'
                  : 'Enter your admin credentials to access the dashboard'}
              </p>
            </div>

            {/* Notice for Chef / Admin */}
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

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Email Field with Left Icon */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  {view === 'student' ? 'Student Email' : `${view.charAt(0).toUpperCase() + view.slice(1)} Email`}
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

              {/* Password Field with Eye Toggle */}
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

              {/* Full-Width Primary Button */}
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
      {/* STEP 3: REGISTER STUDENT VIEW (route: "/register")                  */}
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
                  Full Name
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
                    VIT Student Email
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

              {/* Hostel Room & Phone (2-column) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    Hostel Room
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

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#1E293B]">
                    Mobile Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      placeholder="+91-9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#1E293B]">
                  Confirm Password
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

              {/* Monthly Allowance Note */}
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
                <span>Direct registration grants <strong>9,000 monthly dining credits</strong> immediately with zero OTP required.</span>
              </div>

              {/* Full-width Primary Button */}
              <button
                type="submit"
                disabled={loading || !isVitEmail}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-3 rounded-[10px] text-sm shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
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
