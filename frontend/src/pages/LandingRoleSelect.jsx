import React from 'react';
import { 
  UtensilsCrossed, 
  GraduationCap, 
  ChefHat, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';

export function LandingRoleSelect({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-blobs">
      
      {/* Top Brand Header */}
      <div className="max-w-4xl mx-auto w-full text-center relative z-10 pt-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white shadow-level-4 mx-auto mb-4 border border-white/60">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-border text-muted text-micro shadow-level-1 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
          <span>VIT Campus Food & Credit Hub</span>
        </div>

        <h1 className="text-h1 text-ink">
          Smart<span className="text-[#FF6B35]">Mess</span> Portal
        </h1>
        <p className="mt-2 text-body max-w-lg mx-auto">
          Select your portal to continue to authenticated login and services
        </p>
      </div>

      {/* Three Role Cards in a Row (Stack on Mobile, min 280px wide) */}
      <div className="max-w-5xl mx-auto w-full my-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Role Card 1: Student Portal */}
          <div 
            onClick={() => onSelectRole('student')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-border shadow-level-1 hover:shadow-level-2 hover:-translate-y-1 hover:border-[#FF6B35]/40 transition-all duration-200 flex flex-col justify-between min-w-[280px] relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#FF6B35] flex items-center justify-center border border-orange-100 group-hover:scale-105 transition-transform duration-200">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div>
                <span className="text-micro text-[#FF6B35] block mb-1">Campus Diners</span>
                <h3 className="text-h3 text-ink">Student Portal</h3>
                <p className="text-body text-sm mt-1.5 leading-relaxed">
                  Order meals, manage daily tray, check 9,000 monthly credits & top-up via Razorpay.
                </p>
              </div>

              <div className="pt-3 border-t border-divider space-y-2 text-xs text-body">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Meal tray checkout & pickup tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>9,000 monthly credit balance ledger</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>VIT student registration with Email OTP</span>
                </div>
              </div>
            </div>

            {/* Bottom Button / Affordance */}
            <div className="mt-6 pt-3 border-t border-divider flex items-center justify-between">
              <span className="text-sm font-semibold text-ink group-hover:text-[#FF6B35] transition-colors">
                Enter Student Portal
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FAFAFB] border border-border group-hover:bg-[#FF6B35] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Role Card 2: Chef Kitchen Portal */}
          <div 
            onClick={() => onSelectRole('chef')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-border shadow-level-1 hover:shadow-level-2 hover:-translate-y-1 hover:border-[#F59E0B]/40 transition-all duration-200 flex flex-col justify-between min-w-[280px] relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform duration-200">
                <ChefHat className="w-6 h-6" />
              </div>

              <div>
                <span className="text-micro text-[#D97706] block mb-1">Kitchen Operations</span>
                <h3 className="text-h3 text-ink">Chef Portal</h3>
                <p className="text-body text-sm mt-1.5 leading-relaxed">
                  Real-time live queue management, order status progression, and dish stock controls.
                </p>
              </div>

              <div className="pt-3 border-t border-divider space-y-2 text-xs text-body">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Live order preparation queue</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>1-click portion restock & sold out toggle</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Order pickup token verification</span>
                </div>
              </div>
            </div>

            {/* Bottom Button / Affordance */}
            <div className="mt-6 pt-3 border-t border-divider flex items-center justify-between">
              <span className="text-sm font-semibold text-ink group-hover:text-[#D97706] transition-colors">
                Enter Chef Portal
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FAFAFB] border border-border group-hover:bg-[#D97706] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Role Card 3: Admin Management Portal */}
          <div 
            onClick={() => onSelectRole('admin')}
            className="group cursor-pointer bg-white rounded-2xl p-6 border border-border shadow-level-1 hover:shadow-level-2 hover:-translate-y-1 hover:border-[#6366F1]/40 transition-all duration-200 flex flex-col justify-between min-w-[280px] relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#6366F1] flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-micro text-[#6366F1] block mb-1">Administration</span>
                <h3 className="text-h3 text-ink">Admin Portal</h3>
                <p className="text-body text-sm mt-1.5 leading-relaxed">
                  Credit allowances oversight, manual balance adjustments, menu catalog & audit logs.
                </p>
              </div>

              <div className="pt-3 border-t border-divider space-y-2 text-xs text-body">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Student credit balance resets & grants</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Dish pricing & menu items catalog</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Immutable order & financial audit logs</span>
                </div>
              </div>
            </div>

            {/* Bottom Button / Affordance */}
            <div className="mt-6 pt-3 border-t border-divider flex items-center justify-between">
              <span className="text-sm font-semibold text-ink group-hover:text-[#6366F1] transition-colors">
                Enter Admin Portal
              </span>
              <div className="w-8 h-8 rounded-full bg-[#FAFAFB] border border-border group-hover:bg-[#6366F1] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Security Badge */}
      <div className="max-w-md mx-auto w-full text-center relative z-10 pb-4">
        <div className="inline-flex items-center gap-2 text-label-small">
          <Lock className="w-3.5 h-3.5 text-muted" />
          <span>Protected Campus Platform • 256-bit Encrypted Authentication</span>
        </div>
      </div>
    </div>
  );
}
