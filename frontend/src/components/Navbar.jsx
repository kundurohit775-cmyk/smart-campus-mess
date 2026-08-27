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

  // Role Accent Colors
  const roleAccent = isStudent ? '#FF6B35' : isChef ? '#EA580C' : '#C2410C';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-stone-200/80 shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
            
            {/* 1. Left: Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white shadow-soft-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight text-[#1E1B16] block font-heading">
                  Smart<span className="text-[#FF6B35]">Mess</span>
                </span>
                <span className="text-[11px] text-[#6B6560] font-medium block -mt-1 font-heading">
                  VIT Campus Hub
                </span>
              </div>
            </div>

            {/* 2. Middle: Navigation Links */}
            <nav className="flex items-center bg-[#FFF7F0] border border-stone-200/70 p-1 rounded-xl shadow-soft-sm overflow-x-auto max-w-full">
              {isStudent && (
                <>
                  <button
                    onClick={() => setActiveTab('menu')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'menu'
                        ? 'bg-[#FFFFFF] text-[#FF6B35] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Food Menu</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'orders'
                        ? 'bg-[#FFFFFF] text-[#FF6B35] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Live Tracking</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('transactions')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'transactions'
                        ? 'bg-[#FFFFFF] text-[#FF6B35] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Credits Ledger</span>
                  </button>
                </>
              )}

              {isChef && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'dashboard'
                        ? 'bg-[#FFFFFF] text-[#EA580C] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Kitchen Queue</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'inventory'
                        ? 'bg-[#FFFFFF] text-[#EA580C] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Inventory Controls</span>
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'dashboard'
                        ? 'bg-[#FFFFFF] text-[#C2410C] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('menu-mgr')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'menu-mgr'
                        ? 'bg-[#FFFFFF] text-[#C2410C] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Menu Catalog</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'students'
                        ? 'bg-[#FFFFFF] text-[#C2410C] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Students</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                      activeTab === 'audit'
                        ? 'bg-[#FFFFFF] text-[#C2410C] shadow-soft-sm font-bold border border-orange-100'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Audit Logs</span>
                  </button>
                </>
              )}
            </nav>

            {/* 3. Right: Balance (Student) + Notifications + Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              
              {/* Student Credit Balance Pill + Topup CTA */}
              {isStudent && (
                <div className="flex items-center gap-2 bg-[#FFF7F0] border border-orange-200/80 p-1 pl-3 rounded-xl shadow-soft-sm">
                  <div className="flex items-center gap-1.5">
                    <Coins className={`w-3.5 h-3.5 ${isLow ? 'text-[#DC2626]' : 'text-[#FF6B35]'}`} />
                    <span className="text-xs font-bold tabular-nums text-[#1E1B16] font-heading">
                      {remaining.toLocaleString()}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#6B6560] hidden sm:inline">
                      Credits
                    </span>
                  </div>

                  <button
                    onClick={() => setIsTopupOpen(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-[#FF6B35] to-[#F7931E] hover:from-[#E85A2A] hover:to-[#EA580C] text-white font-semibold text-xs rounded-[8px] transition-all shadow-btn-orange flex items-center gap-1 active:scale-95"
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
                className="w-9 h-9 rounded-xl bg-[#FFFFFF] border border-stone-200 text-[#6B6560] hover:text-[#FF6B35] hover:border-orange-200 flex items-center justify-center transition relative shadow-soft-sm"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-[#FF6B35] absolute top-2 right-2 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-[#FF6B35] absolute top-2 right-2" />
              </button>

              {/* User Profile Avatar */}
              <div className="flex items-center gap-2 pl-1 border-l border-stone-200">
                <div 
                  className="w-9 h-9 rounded-xl bg-[#FFF7F0] border border-orange-200 flex items-center justify-center font-bold text-xs font-heading shadow-soft-sm"
                  style={{ color: roleAccent }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <div className="hidden lg:block text-left">
                  <span className="text-xs font-bold text-[#1E1B16] block leading-tight truncate max-w-[120px] font-heading">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block" style={{ color: roleAccent }}>
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-[#6B6560] hover:text-[#DC2626] hover:bg-red-50 rounded-xl transition"
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
