import React from 'react';
import { 
  UtensilsCrossed, 
  GraduationCap, 
  ChefHat, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Sparkles 
} from 'lucide-react';

export function LandingRoleSelect({ onSelectRole }) {
  return (
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col justify-between items-center py-10 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Ambient background glow blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#06B6D4]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

      {/* Top Brand Area */}
      <div className="w-full text-center relative z-10 pt-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_24px_rgba(139,92,246,0.5)] mx-auto mb-3 border border-white/20">
          <UtensilsCrossed className="w-7 h-7" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-bold text-ink font-heading tracking-tight">
          Smart<span className="text-gradient">Mess</span>
        </h1>
        <p className="mt-1 text-body text-xs sm:text-sm font-normal">
          Campus Food & Credit Platform
        </p>
      </div>

      {/* Single Centered Glass Card (max-w ~440px) */}
      <div className="max-w-[440px] w-full my-auto py-4 relative z-10 animate-slide-up">
        <div className="card p-6 sm:p-7 shadow-level-3 space-y-5 border-[#8B5CF6]/20 bg-[#131728]/85 backdrop-blur-xl">
          
          <div className="text-center pb-1">
            <h2 className="text-lg sm:text-xl font-bold text-ink font-heading">
              Who are you signing in as?
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Select your campus dining portal to continue
            </p>
          </div>

          {/* Three Role Rows Stacked Vertically */}
          <div className="divide-y divide-border/60 rounded-xl overflow-hidden border border-border/80 bg-[#0B0E1A]/60">
            
            {/* Row 1: Student (Violet #8B5CF6) */}
            <div
              onClick={() => onSelectRole('student')}
              className="group cursor-pointer p-4 flex items-center justify-between transition-all duration-200 hover:bg-[#8B5CF6]/[0.08]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center border border-[#8B5CF6]/30 shadow-glow-primary group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.6)] transition-all duration-200 shrink-0">
                  <GraduationCap className="w-5 h-5 group-hover:animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-ink font-heading group-hover:text-white transition-colors">
                    Student
                  </h3>
                  <p className="text-[11px] text-muted font-medium">
                    Campus Diner & 9k Credit Allowance
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#131728] border border-border group-hover:bg-[#8B5CF6] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 text-muted shadow-level-1 shrink-0">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Row 2: Chef (Amber #F59E0B) */}
            <div
              onClick={() => onSelectRole('chef')}
              className="group cursor-pointer p-4 flex items-center justify-between transition-all duration-200 hover:bg-[#F59E0B]/[0.08]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30 shadow-glow-amber group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.6)] transition-all duration-200 shrink-0">
                  <ChefHat className="w-5 h-5 group-hover:animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-ink font-heading group-hover:text-white transition-colors">
                    Chef
                  </h3>
                  <p className="text-[11px] text-muted font-medium">
                    Kitchen Queue & Portion Dispatch
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#131728] border border-border group-hover:bg-[#F59E0B] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 text-muted shadow-level-1 shrink-0">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Row 3: Admin (Cyan #06B6D4) */}
            <div
              onClick={() => onSelectRole('admin')}
              className="group cursor-pointer p-4 flex items-center justify-between transition-all duration-200 hover:bg-[#06B6D4]/[0.08]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center border border-[#06B6D4]/30 shadow-glow-secondary group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] transition-all duration-200 shrink-0">
                  <ShieldCheck className="w-5 h-5 group-hover:animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-ink font-heading group-hover:text-white transition-colors">
                    Admin
                  </h3>
                  <p className="text-[11px] text-muted font-medium">
                    Campus Governance & Audit Ledger
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#131728] border border-border group-hover:bg-[#06B6D4] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 text-muted shadow-level-1 shrink-0">
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Subtle, Minimal Footer */}
      <div className="w-full text-center relative z-10 pb-2">
        <div className="inline-flex items-center gap-2 text-[11px] text-muted bg-[#131728]/60 px-3.5 py-1 rounded-full border border-border/80">
          <Lock className="w-3 h-3 text-[#8B5CF6]" />
          <span>VIT Campus Smart Mess • Secure Authentication</span>
        </div>
      </div>
    </div>
  );
}
