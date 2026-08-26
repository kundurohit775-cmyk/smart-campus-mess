import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Clock, 
  Coins, 
  ChefHat, 
  ShieldCheck, 
  LogOut, 
  User, 
  Plus, 
  Sparkles, 
  Layers, 
  Bell 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TopupModal } from './TopupModal';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  if (!user) return null;

  const isStudent = user.role === 'student' || user.isStudent;
  const isChef = user.role === 'chef' || user.isChef;
  const isAdmin = user.role === 'admin' || user.isAdmin;

  const remaining = user?.credits?.remaining ?? 9000;
  const isLow = remaining < 500;

  // Role Accent Styling
  const roleAccentColor = isStudent ? '#8B5CF6' : isChef ? '#F59E0B' : '#F43F5E';
  const roleBadgeBg = isStudent 
    ? 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30' 
    : isChef 
    ? 'bg-[#F59E0B]/15 text-amber-400 border-[#F59E0B]/30' 
    : 'bg-[#F43F5E]/15 text-rose-400 border-[#F43F5E]/30';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#131728]/90 border-b border-slate-800/80 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
            
            {/* 1. Left: Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] border border-white/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight text-[#F1F5F9] block font-heading">
                  Smart<span className="text-[#8B5CF6]">Mess</span>
                </span>
                <span className="text-[11px] text-[#06B6D4] font-medium block -mt-1 font-heading">
                  VIT Campus Hub
                </span>
              </div>
            </div>

            {/* 2. Middle: Navigation Links */}
            <nav className="flex items-center bg-[#0B0E1A] border border-slate-800 p-1 rounded-xl shadow-inner overflow-x-auto max-w-full">
              {isStudent && (
                <>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'menu'
                        ? 'bg-[#8B5CF6]/20 text-[#F1F5F9] border border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Food Menu</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'orders'
                        ? 'bg-[#8B5CF6]/20 text-[#F1F5F9] border border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Live Tracking</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'transactions'
                        ? 'bg-[#8B5CF6]/20 text-[#F1F5F9] border border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Credits Ledger</span>
                  </button>
                </>
              )}

              {isChef && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'dashboard'
                        ? 'bg-[#F59E0B]/20 text-[#F1F5F9] border border-[#F59E0B]/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Kitchen Queue</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'inventory'
                        ? 'bg-[#38BDF8]/20 text-[#F1F5F9] border border-[#38BDF8]/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Inventory Controls</span>
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'dashboard'
                        ? 'bg-[#F43F5E]/20 text-[#F1F5F9] border border-[#F43F5E]/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F43F5E]" />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('menu-mgr')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'menu-mgr'
                        ? 'bg-[#06B6D4]/20 text-[#F1F5F9] border border-[#06B6D4]/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Menu Catalog</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'students'
                        ? 'bg-[#F43F5E]/20 text-[#F1F5F9] border border-[#F43F5E]/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#F43F5E]" />
                    <span>Students</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'audit'
                        ? 'bg-[#06B6D4]/20 text-[#F1F5F9] border border-[#06B6D4]/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Audit Logs</span>
                  </button>
                </>
              )}
            </nav>

            {/* 3. Right: Balance (Student) + Notifications + Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              
              {/* Student Credit Balance Pill + Topup CTA */}
              {isStudent && (
                <div className="flex items-center gap-2 bg-[#0B0E1A] border border-[#10B981]/30 p-1 pl-3 rounded-xl shadow-inner">
                  <div className="flex items-center gap-1.5">
                    <Coins className={`w-3.5 h-3.5 ${isLow ? 'text-[#F43F5E]' : 'text-[#10B981]'}`} />
                    <span className="text-xs font-bold tabular-nums text-[#F1F5F9] font-heading">
                      {remaining.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#10B981] hidden sm:inline">
                      Cr
                    </span>
                  </div>

                  <button
                    onClick={() => setIsTopupOpen(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white font-semibold text-xs rounded-[8px] transition-all shadow-[0_0_14px_rgba(139,92,246,0.4)] flex items-center gap-1 active:scale-95 hover:scale-105"
                    title="Buy Credits via Razorpay"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Top-up</span>
                  </button>
                </div>
              )}

              {/* Notification Alert Bell */}
              <button
                type="button"
                onClick={() => {
                  if (isStudent && setActiveTab) setActiveTab('orders');
                }}
                className="w-9 h-9 rounded-xl bg-[#0B0E1A] border border-slate-800 text-[#94A3B8] hover:text-[#8B5CF6] hover:bg-white/5 flex items-center justify-center transition relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-[#06B6D4] absolute top-2 right-2 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-[#06B6D4] absolute top-2 right-2" />
              </button>

              {/* User Profile Avatar */}
              <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                <div 
                  className={`w-9 h-9 rounded-xl bg-[#0B0E1A] border flex items-center justify-center font-bold text-xs shadow-sm font-heading ${roleBadgeBg}`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="hidden lg:block text-left">
                  <span className="text-xs font-bold text-[#F1F5F9] block leading-tight truncate max-w-[120px] font-heading">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: roleAccentColor }}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-[#94A3B8] hover:text-[#F43F5E] hover:bg-white/5 rounded-xl transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Razorpay Top-up Modal */}
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </>
  );
}
