import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
  AlertCircle,
  Coins
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { totalItemCount, setIsOpen } = useCart();

  if (!user) return null;

  const isStudent = user.role === 'student' || user.isStudent;
  const isChef = user.role === 'chef' || user.isChef;
  const isAdmin = user.role === 'admin' || user.isAdmin;

  const remainingCredits = user?.credits?.remaining ?? 9000;
  const isLowBalance = remainingCredits < 500;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(isStudent ? 'menu' : 'dashboard')}>
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900">
                  Smart<span className="text-orange-600">Mess</span>
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isAdmin ? 'bg-purple-100 text-purple-700' :
                  isChef ? 'bg-amber-100 text-amber-800' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Campus Food & Credit Hub</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {isStudent && (
              <>
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'menu'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Today's Menu
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'orders'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  My Orders & Live Status
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'transactions'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Credit Ledger
                </button>
              </>
            )}

            {isChef && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'dashboard'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                  Kitchen Queue
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'inventory'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  Stock Availability
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'dashboard'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('menu-mgr')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'menu-mgr'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  Menu Items
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'students'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Student Credits
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === 'audit'
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Audit Logs
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Student Live Credit Balance Display */}
            {isStudent && (
              <div
                onClick={() => setActiveTab('transactions')}
                className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border font-bold text-sm transition shadow-sm ${
                  isLowBalance
                    ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200/80 text-amber-900 hover:border-amber-400'
                }`}
                title="Click to view Credit Transaction Ledger"
              >
                <Coins className={`w-4 h-4 ${isLowBalance ? 'text-rose-600' : 'text-amber-600'}`} />
                <div className="flex flex-col text-left leading-tight">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Balance</span>
                  <span className="text-sm font-extrabold">
                    {remainingCredits.toLocaleString()} <span className="text-xs font-medium text-slate-500">/ 9k</span>
                  </span>
                </div>
              </div>
            )}

            {/* Student Cart Drawer Trigger */}
            {isStudent && (
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2.5 sm:px-3.5 sm:py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold flex items-center gap-2 transition shadow-md shadow-orange-500/20 active:scale-95"
                aria-label="Open food tray"
              >
                <ShoppingBag className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Tray</span>
                {totalItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {totalItemCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-500 leading-tight truncate max-w-[120px]">
                  {isStudent ? (user.roomNumber || 'Hostel') : user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sub-nav */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-slate-100 overflow-x-auto gap-1">
          {isStudent && (
            <>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'menu' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'orders' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'transactions' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                Credits
              </button>
            </>
          )}

          {isChef && (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                Queue
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'inventory' ? 'bg-orange-500 text-white' : 'text-slate-600'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setActiveTab('menu-mgr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'menu-mgr' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'students' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                Students
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  activeTab === 'audit' ? 'bg-orange-500 text-white' : 'text-slate-600'
                }`}
              >
                Audit
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
