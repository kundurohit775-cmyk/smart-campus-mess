import React from 'react';
import { 
  UtensilsCrossed, 
  GraduationCap, 
  ChefHat, 
  ShieldCheck, 
  ArrowRight, 
  Coins, 
  Clock, 
  Sliders, 
  Sparkles, 
  Lock,
  CheckCircle2,
  Receipt
} from 'lucide-react';

export function LandingRoleSelect({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden subtle-mesh-bg">
      {/* Background ambient gradient glow shapes */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-orange-400/10 via-amber-300/10 to-purple-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="max-w-4xl mx-auto w-full text-center relative z-10 pt-4">
        <div className="w-14 h-14 rounded-2.5xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-stripe-md shadow-orange-500/20 mx-auto mb-4 border border-white/60">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-slate-200/80 text-slate-700 text-xs font-black uppercase tracking-wider shadow-stripe-sm mb-3">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>VIT Campus Food & Credit Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4.5xl font-black tracking-tight text-slate-900 leading-tight">
          Smart<span className="text-orange-600">Mess</span> Portal
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-lg mx-auto font-medium">
          Select your portal to continue to authenticated login and services
        </p>
      </div>

      {/* 3 Role Selection Cards */}
      <div className="max-w-5xl mx-auto w-full my-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Student Portal */}
          <div className="group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-stripe hover:shadow-stripe-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shadow-stripe-sm group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-600 block">Campus Diners</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Student Portal</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Browse daily menus, order meals with queue tokens, check 9,000 monthly credits, and top-up via Razorpay.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Meal tray checkout & token tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>9,000 monthly credit balance ledger</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>VIT student registration with Email OTP</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectRole('student')}
              className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
            >
              <span>Continue as Student</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Chef Kitchen Portal */}
          <div className="group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-stripe hover:shadow-stripe-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-stripe-sm group-hover:scale-105 transition-transform">
                <ChefHat className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 block">Kitchen Operations</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Chef Portal</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Real-time live queue management, order status progression (Cooking → Ready), and stock controls.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Live order preparation queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1-click stock restock & sold out toggle</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Order pickup token verification</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectRole('chef')}
              className="mt-6 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-stripe-sm hover:shadow-stripe-md flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
            >
              <span>Continue as Chef</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Admin Management Portal */}
          <div className="group bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-stripe hover:shadow-stripe-hover hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-600" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200/80 text-purple-700 flex items-center justify-center shadow-stripe-sm group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-purple-600 block">Administration</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Portal</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Credit allowances oversight, manual student balance adjustments, menu catalog, and system audit logs.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Student credit balance management & resets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dish pricing & menu items catalog</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Financial & transaction audit records</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectRole('admin')}
              className="mt-6 w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-indigo flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
            >
              <span>Continue as Admin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Footer Security Badge */}
      <div className="max-w-md mx-auto w-full text-center relative z-10 pb-4">
        <div className="inline-flex items-center gap-2 text-[11px] text-slate-400 font-medium">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Protected Campus Platform • 256-bit Encrypted Authentication</span>
        </div>
      </div>
    </div>
  );
}
