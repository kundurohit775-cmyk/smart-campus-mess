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
    <div className="min-h-screen bg-space-mesh bg-starfield flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient background glow blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#8B5CF6]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#06B6D4]/15 rounded-full blur-[100px] pointer-events-none animate-pulse-glow" />

      {/* 1. Centered Logo + App Name + Tagline */}
      <div className="max-w-4xl mx-auto w-full text-center relative z-10 pt-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_32px_rgba(139,92,246,0.5)] mx-auto mb-4 border border-white/20">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#131728]/80 border border-border text-[#06B6D4] text-micro shadow-level-1 mb-3 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>VIT Campus Smart Mess Network</span>
        </div>

        <h1 className="text-display sm:text-5xl text-ink font-heading tracking-tight">
          Smart<span className="text-gradient">Mess</span>
        </h1>
        <p className="mt-2 text-body max-w-lg mx-auto text-sm sm:text-base font-normal">
          Campus Food & Credit Platform
        </p>
      </div>

      {/* 2. Three Equal-Size Glass Cards (Horizontal on Desktop, Stack on Mobile) */}
      <div className="max-w-5xl mx-auto w-full my-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch">
          
          {/* Card 1: Student (Violet #8B5CF6) */}
          <div 
            onClick={() => onSelectRole('student')}
            className="group cursor-pointer card p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-[#8B5CF6]/80 hover:shadow-[0_8px_32px_rgba(139,92,246,0.35)] relative overflow-hidden"
          >
            {/* Top accent glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-4">
              {/* Glowing circle icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center border border-[#8B5CF6]/30 shadow-glow-primary group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(139,92,246,0.6)] transition-all duration-300">
                <GraduationCap className="w-7 h-7 group-hover:animate-pulse" />
              </div>

              <div>
                <span className="text-micro text-[#8B5CF6] block mb-1">Campus Diners</span>
                <h3 className="text-xl font-bold text-ink font-heading group-hover:text-white transition-colors">
                  Student
                </h3>
                <p className="text-body text-xs sm:text-sm mt-1.5 leading-relaxed">
                  Order meals, track live prep tokens, access 9,000 monthly credits, and top-up anytime.
                </p>
              </div>

              <div className="pt-3 border-t border-divider space-y-2 text-xs text-body font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Meal tray ordering & live tokens</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>9,000 monthly dining allowance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Direct @vitstudent.ac.in access</span>
                </div>
              </div>
            </div>

            {/* Bottom Button / Affordance */}
            <div className="mt-6 pt-4 border-t border-divider flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-[#8B5CF6] transition-colors font-heading">
                Enter Student Portal
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0B0E1A] border border-border group-hover:bg-gradient-to-r group-hover:from-[#8B5CF6] group-hover:to-[#6366F1] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-level-1">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 2: Chef (Amber/Orange #F59E0B) */}
          <div 
            onClick={() => onSelectRole('chef')}
            className="group cursor-pointer card p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-[#F59E0B]/80 hover:shadow-[0_8px_32px_rgba(245,158,11,0.35)] relative overflow-hidden"
          >
            {/* Top accent glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-4">
              {/* Glowing circle icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/15 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30 shadow-glow-amber group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(245,158,11,0.6)] transition-all duration-300">
                <ChefHat className="w-7 h-7 group-hover:animate-pulse" />
              </div>

              <div>
                <span className="text-micro text-[#F59E0B] block mb-1">Kitchen Operations</span>
                <h3 className="text-xl font-bold text-ink font-heading group-hover:text-white transition-colors">
                  Chef
                </h3>
                <p className="text-body text-xs sm:text-sm mt-1.5 leading-relaxed">
                  Manage active kitchen queue, advance cooking stages, and control portion availability.
                </p>
              </div>

              <div className="pt-3 border-t border-divider space-y-2 text-xs text-body font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Real-time kitchen prep dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>1-click restock & sold-out controls</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Counter token pickup verification</span>
                </div>
              </div>
            </div>

            {/* Bottom Button / Affordance */}
            <div className="mt-6 pt-4 border-t border-divider flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-[#F59E0B] transition-colors font-heading">
                Enter Chef Station
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0B0E1A] border border-border group-hover:bg-gradient-to-r group-hover:from-[#F59E0B] group-hover:to-[#EA580C] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-level-1">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card 3: Admin (Cyan #06B6D4) */}
          <div 
            onClick={() => onSelectRole('admin')}
            className="group cursor-pointer card p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:border-[#06B6D4]/80 hover:shadow-[0_8px_32px_rgba(6,182,212,0.35)] relative overflow-hidden"
          >
            {/* Top accent glow line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="space-y-4">
              {/* Glowing circle icon */}
              <div className="w-14 h-14 rounded-2xl bg-[#06B6D4]/15 text-[#06B6D4] flex items-center justify-center border border-[#06B6D4]/30 shadow-glow-secondary group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(6,182,212,0.6)] transition-all duration-300">
                <ShieldCheck className="w-7 h-7 group-hover:animate-pulse" />
              </div>

              <div>
                <span className="text-micro text-[#06B6D4] block mb-1">Campus Governance</span>
                <h3 className="text-xl font-bold text-ink font-heading group-hover:text-white transition-colors">
                  Admin
                </h3>
                <p className="text-body text-xs sm:text-sm mt-1.5 leading-relaxed">
                  Audit campus dining records, adjust student credits, and manage catalog dish pricing.
                </p>
              </div>

              <div className="pt-3 border-t border-divider space-y-2 text-xs text-body font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Student 9k resets & balance grants</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Menu catalog pricing & activation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-status-success shrink-0" />
                  <span>Immutable financial & meal audit logs</span>
                </div>
              </div>
            </div>

            {/* Bottom Button / Affordance */}
            <div className="mt-6 pt-4 border-t border-divider flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-ink group-hover:text-[#06B6D4] transition-colors font-heading">
                Enter Admin Console
              </span>
              <div className="w-8 h-8 rounded-full bg-[#0B0E1A] border border-border group-hover:bg-gradient-to-r group-hover:from-[#06B6D4] group-hover:to-[#2563EB] group-hover:text-white group-hover:border-transparent flex items-center justify-center transition-all duration-200 shadow-level-1">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Subtle, Minimal Footer */}
      <div className="max-w-md mx-auto w-full text-center relative z-10 pb-4">
        <div className="inline-flex items-center gap-2 text-xs text-muted bg-[#131728]/60 px-4 py-1.5 rounded-full border border-border">
          <Lock className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>VIT Campus Smart Mess • Secure Authentication Protocol</span>
        </div>
      </div>
    </div>
  );
}
