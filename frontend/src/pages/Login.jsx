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
  GraduationCap, 
  ChefHat, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

const ROLES = [
  { id: 'student', label: 'Student', icon: GraduationCap, color: '#6366F1' },
  { id: 'chef', label: 'Chef', icon: ChefHat, color: '#6366F1' },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, color: '#6366F1' }
];

export function Login() {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  // Mode: 'login' | 'register'
  const isRegisterInitial = window.location.pathname.toLowerCase().includes('/register');
  const [isRegister, setIsRegister] = useState(isRegisterInitial);

  // Selected role for 3-way toggle: 'student' | 'chef' | 'admin'
  const [selectedRole, setSelectedRole] = useState('student');

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register-only fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Handle URL history state
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      setIsRegister(path.includes('/register'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToRegister = () => {
    setIsRegister(true);
    window.history.pushState({}, '', '/register');
  };

  const navigateToLogin = () => {
    setIsRegister(false);
    window.history.pushState({}, '', '/login');
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

    // STRICT VIT STUDENT DOMAIN RESTRICTION
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
  const roleIndex = ROLES.findIndex(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#1E293B] font-sans flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative selection:bg-[#6366F1] selection:text-white">
      
      {/* Top Centered Brand Logo & App Name */}
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
      {/* VIEW A: SIGN IN CARD                                                */}
      {/* =================================================================== */}
      {!isRegister ? (
        <div className="max-w-[460px] w-full bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200/80 space-y-6">
          
          {/* 3-Way Segmented Pill Toggle: Student | Chef | Admin */}
          <div className="relative bg-[#F1F5F9] p-1 rounded-xl flex items-center">
            {/* Sliding White Background Indicator */}
            <div
              className="absolute top-1 bottom-1 w-[calc((100%-8px)/3)] bg-white rounded-lg shadow-sm transition-all duration-200 ease-out"
              style={{ left: `calc(4px + ${roleIndex} * ((100% - 8px) / 3))` }}
            />

            {ROLES.map((role) => {
              const isSelected = selectedRole === role.id;
              const Icon = role.icon;

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`relative z-10 flex-1 py-2 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors duration-150 ${
                    isSelected ? 'text-[#1E293B]' : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#6366F1]' : 'text-[#64748B]'}`} />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>

          {/* Heading & Subtext */}
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">
              Sign in to your account
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              {selectedRole === 'student'
                ? 'Enter your student credentials to access your meal tray & credits'
                : selectedRole === 'chef'
                ? 'Authorized culinary staff portal for live kitchen dispatch'
                : 'Restricted campus governance and financial audit portal'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Field with Left Icon */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1E293B]">
                {selectedRole === 'student' ? 'Student Email' : `${ROLES.find(r=>r.id===selectedRole)?.label} Email`}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={selectedRole === 'student' ? 'student@vitstudent.ac.in' : `${selectedRole}@campus.internal`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 text-[#1E293B] placeholder-[#94A3B8] pl-10 pr-3.5 py-2.5 rounded-[10px] text-sm focus:bg-white focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none transition"
                />
              </div>
            </div>

            {/* Password Field with Left Icon & Right Show/Hide Eye Toggle */}
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

            {/* Remember Me Checkbox & Forgot Password Link */}
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
                onClick={() => showToast('Please contact your mess admin for password resets.', 'info')}
                className="text-[#6366F1] font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Full-width Primary Button */}
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

          {/* Bottom Divider & Registration Link (Student only) */}
          {selectedRole === 'student' && (
            <div className="pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-[#64748B]">
                New here?{' '}
                <button
                  type="button"
                  onClick={navigateToRegister}
                  className="font-semibold text-[#6366F1] hover:underline"
                >
                  Create an account
                </button>
              </p>
            </div>
          )}

          {selectedRole !== 'student' && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-[#94A3B8]">
                Single-account authorized access. Self-registration is restricted.
              </p>
            </div>
          )}

        </div>
      ) : (
        /* =================================================================== */
        /* VIEW B: CREATE STUDENT ACCOUNT CARD                                 */
        /* =================================================================== */
        <div className="max-w-[480px] w-full bg-white rounded-2xl p-7 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-200/80 space-y-6">
          
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

            {/* Monthly Allowance Information Banner */}
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
                onClick={navigateToLogin}
                className="font-semibold text-[#6366F1] hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>

        </div>
      )}

      {/* Subtle Footer Note */}
      <div className="mt-8 text-center text-xs text-[#94A3B8]">
        VIT University Campus Mess Network • 256-bit SSL Encrypted
      </div>

    </div>
  );
}
