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
  ChevronRight,
  TrendingUp
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

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#131728]/85 border-b border-border shadow-level-1 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
            
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center text-white shadow-glow-primary border border-white/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight text-ink block font-heading">
                  Smart<span className="text-gradient">Mess</span>
                </span>
                <span className="text-[11px] text-[#06B6D4] font-medium block -mt-1">
                  VIT Space-Tech Dining
                </span>
              </div>
            </div>

            {/* Middle: Role Segmented Navigation Tabs */}
            <nav className="flex items-center bg-[#0B0E1A] border border-border p-1 rounded-xl shadow-level-1 overflow-x-auto max-w-full">
              {isStudent && (
                <>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'menu'
                        ? 'bg-gradient-to-r from-[#8B5CF6]/30 to-[#06B6D4]/30 text-white border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Food Menu</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'orders'
                        ? 'bg-gradient-to-r from-[#8B5CF6]/30 to-[#06B6D4]/30 text-white border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Live Tracking</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'transactions'
                        ? 'bg-gradient-to-r from-[#8B5CF6]/30 to-[#06B6D4]/30 text-white border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-[#34D399]" />
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
                        ? 'bg-gradient-to-r from-[#FBBF24]/30 to-[#06B6D4]/30 text-white border border-[#FBBF24]/40 shadow-glow-amber'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>Kitchen Queue</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'inventory'
                        ? 'bg-gradient-to-r from-[#FBBF24]/30 to-[#06B6D4]/30 text-white border border-[#FBBF24]/40 shadow-glow-amber'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
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
                        ? 'bg-gradient-to-r from-[#8B5CF6]/30 to-[#06B6D4]/30 text-white border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('menu-mgr')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'menu-mgr'
                        ? 'bg-gradient-to-r from-[#8B5CF6]/30 to-[#06B6D4]/30 text-white border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Menu Catalog</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'students'
                        ? 'bg-gradient-to-r from-[#8B5CF6]/30 to-[#06B6D4]/30 text-white border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-[#34D399]" />
                    <span>Students</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      activeTab === 'audit'
                        ? 'bg-gradient-to-r from-[#8B5CF6]/30 to-[#06B6D4]/30 text-white border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-[#FBBF24]" />
                    <span>Audit Logs</span>
                  </button>
                </>
              )}
            </nav>

            {/* Right: Balance Pill (Student) & User Avatar with Role Badge */}
            <div className="flex items-center gap-3 shrink-0">
              
              {/* Student Credit Balance Pill + Topup CTA */}
              {isStudent && (
                <div className="flex items-center gap-2 bg-[#0B0E1A] border border-border p-1 pl-3 rounded-xl shadow-level-1">
                  <div className="flex items-center gap-1.5">
                    <Coins className={`w-3.5 h-3.5 ${isLow ? 'text-status-danger' : 'text-[#34D399]'}`} />
                    <span className="text-xs font-bold tabular-nums text-ink font-heading">
                      {remaining.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-muted hidden sm:inline">
                      Credits
                    </span>
                  </div>

                  <button
                    onClick={() => setIsTopupOpen(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white font-semibold text-xs rounded-[8px] transition-all shadow-glow-primary flex items-center gap-1 active:scale-95 hover:scale-105"
                    title="Buy Credits via Razorpay"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Top-up</span>
                  </button>
                </div>
              )}

              {/* User Profile Pill */}
              <div className="flex items-center gap-2.5 pl-1">
                <div className="w-9 h-9 rounded-xl bg-[#0B0E1A] border border-border text-[#8B5CF6] flex items-center justify-center font-bold text-xs shadow-level-1">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="hidden lg:block text-left">
                  <span className="text-xs font-bold text-ink block leading-tight truncate max-w-[120px]">
                    {user.name || user.email}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider block ${
                    isChef ? 'text-[#FBBF24]' : isAdmin ? 'text-[#8B5CF6]' : 'text-[#06B6D4]'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-muted hover:text-status-danger hover:bg-white/5 rounded-xl transition"
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
