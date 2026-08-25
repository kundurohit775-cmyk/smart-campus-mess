import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { TopupModal } from './TopupModal';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Clock, 
  Receipt, 
  ChefHat, 
  LayoutDashboard, 
  Users, 
  Sliders, 
  LogOut, 
  Coins,
  Plus,
  Sparkles
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { totalItemCount, setIsOpen } = useCart();
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  if (!user) return null;

  const isStudent = user.role === 'student' || user.isStudent;
  const isChef = user.role === 'chef' || user.isChef;
  const isAdmin = user.role === 'admin' || user.isAdmin;

  const remainingCredits = user?.credits?.remaining ?? 9000;
  const isLowBalance = remainingCredits < 500;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_-4px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand & Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setActiveTab(isStudent ? 'menu' : 'dashboard')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform duration-200">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  Smart<span className="text-orange-600">Mess</span>
                </span>
                <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full border ${
                  isAdmin ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                  isChef ? 'bg-amber-50 text-amber-800 border-amber-200/60' :
                  'bg-orange-50 text-orange-700 border-orange-200/60'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Campus Food & Credit Hub</p>
            </div>
          </div>

          {/* Desktop Navigation Links (Stripe Pill Tab Style) */}
          <nav className="hidden md:flex items-center p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl gap-0.5">
            {isStudent && (
              <>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'menu'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-orange-600" />
                  <span>Today's Menu</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'orders'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>My Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'transactions'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 text-orange-600" />
                  <span>Credit Ledger</span>
                </button>
              </>
            )}

            {isChef && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kitchen Queue</span>
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'inventory'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  <span>Stock Availability</span>
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-purple-600" />
                  <span>Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab('menu-mgr')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'menu-mgr'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-purple-600" />
                  <span>Menu Items</span>
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'students'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>Student Credits</span>
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    activeTab === 'audit'
                      ? 'bg-white text-slate-900 shadow-stripe-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5 text-purple-600" />
                  <span>Audit Logs</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Student Live Credit Balance Display & Razorpay Top-Up Trigger */}
            {isStudent && (
              <div className="flex items-center gap-1.5 bg-slate-50/80 p-1 rounded-2xl border border-slate-200/80 shadow-stripe-sm">
                <div
                  onClick={() => setActiveTab('transactions')}
                  className={`cursor-pointer flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                    isLowBalance
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                      : 'text-slate-800 hover:bg-white'
                  }`}
                  title="Click to view Credit Transaction Ledger"
                >
                  <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Coins className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">Credits</span>
                    <span className="text-xs font-black tabular-nums text-slate-900 leading-tight">
                      {remainingCredits.toLocaleString()} <span className="text-[10px] font-medium text-slate-400">/ 9k</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTopupOpen(true)}
                  className="py-1 px-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow-glow-orange transition-all duration-150 flex items-center gap-1 active:scale-95"
                  title="Buy Credits via Razorpay (₹1 = 1 Credit)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Top-up</span>
                </button>
              </div>
            )}

            {/* Student Tray / Cart Trigger */}
            {isStudent && (
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-stripe-sm hover:shadow-stripe-md active:scale-95"
                aria-label="Open food tray"
              >
                <ShoppingBag className="w-4 h-4 text-orange-400" />
                <span className="hidden sm:inline">Tray</span>
                {totalItemCount > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-slate-900 shadow-sm animate-scale-in">
                    {totalItemCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black text-xs flex items-center justify-center shadow-sm">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{user.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none truncate max-w-[100px]">
                    {isStudent ? (user.roomNumber || 'Hostel') : user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sub-nav (Stripe Pill Style) */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto gap-1">
          {isStudent && (
            <>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'menu' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'orders' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'transactions' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Credits Ledger
              </button>
            </>
          )}

          {isChef && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'dashboard' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Queue
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'inventory' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Stock Items
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'dashboard' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setActiveTab('menu-mgr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'menu-mgr' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'students' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'audit' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Audit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Topup Modal */}
      {isStudent && (
        <TopupModal
          isOpen={isTopupOpen}
          onClose={() => setIsTopupOpen(false)}
        />
      )}
    </header>
  );
}
