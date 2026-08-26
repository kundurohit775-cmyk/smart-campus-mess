import React from 'react';
import { 
  UtensilsCrossed, 
  GraduationCap, 
  ChefHat, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';

export function LandingRoleSelect({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient background glow blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#06B6D4]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

      {/* Top Brand Header */}
      <div className="max-w-4xl mx-auto w-full text-center relative z-10 pt-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-level-4 mx-auto mb-4 border border-white/20">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#131728]/80 border border-border text-[#06B6D4] text-micro shadow-level-1 mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>VIT Campus Space-Tech Dining Hub</span>
        </div>

        <h1 className="text-display sm:text-5xl text-ink">
          Smart<span className="text-gradient">Mess</span> Portal
        </h1>
        <p className="mt-2 text-body max-w-lg mx-auto text-sm sm:text-base">
          Select your portal to initialize authenticated session and access dining networks
        </p>
      </div>

      {/* Three Role Cards in a Row (Stack on Mobile, min 280px wide) */}
      <div className="max-w-5xl mx-auto w-full my-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Role Card 1: Student Portal */}
          <div 
            onClick={() => onSelectRole('student')}
            className="group cursor-pointer card hover:border-[#8B5CF6]/60 hover:shadow-glow-primary flex flex-col justify-between min-w-[280px] relative overflow-hidden"
          >
            {/* Top gradient highlight strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center border border-[#8B5CF6]/30 shadow-level-1 group-hover:scale-105 group-hover:shadow-glow-primary transition-all duration-200">
                <GraduationCap className="w-6 h-6" />
              </div>

              <div>
                <span className="text-micro text-[#8B5CF6] block mb-1">Campus Diners</span>
                <h3 className="text-h3 text-ink group-hover:text-[#F1F5F9] transition-colors">Student Portal</h3>
                <p className="text-body text-sm mt-1.5 leading-relaxed">
                  Order meals, manage daily tray, access 9,000 monthly credits & top-up via Razorpay.
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
                  <span>Direct VIT registration (@vitstudent.ac.in)</span>
                </div>
              </div>
            </div>

            {/* Bottom Button / Affordance */}
            <div className="mt-6 pt-3 border-t border-divider flex items-center justify-between">
              <span className="text-sm font-semibold text-ink group-hover:text-[#8B5CF6] transition-colors">
                Enter Student Portal
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0B0E1A] border border-border group-hover:bg-gradient-to-r group-hover:from-[#8B5CF6] group-hover:to-[#06B6D4] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-level-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Role Card 2: Chef Kitchen Portal */}
          <div 
            onClick={() => onSelectRole('chef')}
            className="group cursor-pointer card hover:border-[#06B6D4]/60 hover:shadow-glow-secondary flex flex-col justify-between min-w-[280px] relative overflow-hidden"
          >
            {/* Top gradient highlight strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center border border-[#06B6D4]/30 shadow-level-1 group-hover:scale-105 group-hover:shadow-glow-secondary transition-all duration-200">
                <ChefHat className="w-6 h-6" />
              </div>

              <div>
                <span className="text-micro text-[#06B6D4] block mb-1">Kitchen Operations</span>
                <h3 className="text-h3 text-ink group-hover:text-[#F1F5F9] transition-colors">Chef Portal</h3>
                <p className="text-body text-sm mt-1.5 leading-relaxed">
                  Real-time live queue management, kitchen status progression, and portion inventory.
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
              <span className="text-sm font-semibold text-ink group-hover:text-[#06B6D4] transition-colors">
                Enter Chef Portal
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0B0E1A] border border-border group-hover:bg-gradient-to-r group-hover:from-[#06B6D4] group-hover:to-[#34D399] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-level-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Role Card 3: Admin Management Portal */}
          <div 
            onClick={() => onSelectRole('admin')}
            className="group cursor-pointer card hover:border-[#8B5CF6]/60 hover:shadow-glow-primary flex flex-col justify-between min-w-[280px] relative overflow-hidden"
          >
            {/* Top gradient highlight strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center border border-[#8B5CF6]/30 shadow-level-1 group-hover:scale-105 group-hover:shadow-glow-primary transition-all duration-200">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-micro text-[#8B5CF6] block mb-1">Administration</span>
                <h3 className="text-h3 text-ink group-hover:text-[#F1F5F9] transition-colors">Admin Portal</h3>
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
              <span className="text-sm font-semibold text-ink group-hover:text-[#8B5CF6] transition-colors">
                Enter Admin Portal
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0B0E1A] border border-border group-hover:bg-gradient-to-r group-hover:from-[#8B5CF6] group-hover:to-[#06B6D4] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-level-1">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Security Badge */}
      <div className="max-w-md mx-auto w-full text-center relative z-10 pb-4">
        <div className="inline-flex items-center gap-2 text-label-small text-muted bg-[#131728]/60 px-4 py-1.5 rounded-full border border-border">
          <Lock className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Space-Tech Dining Protocol • 256-bit Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
