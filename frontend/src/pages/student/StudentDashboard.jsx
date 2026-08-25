import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Filter, RefreshCw, ShoppingBag, Clock, ArrowRight, CreditCard, PlusCircle, Coins, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { MenuCard } from '../../components/MenuCard';
import { TopupModal } from '../../components/TopupModal';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages'];

export function StudentDashboard({ onNavigateToOrders }) {
  const { user } = useAuth();
  const { setIsOpen, totalItemCount } = useCart();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  const fetchMenu = async () => {
    try {
      const data = await api.getMenu();
      setMenuItems(data.items || []);
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    // Live polling every 8s to keep inventory in sync
    const interval = setInterval(fetchMenu, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMenu();
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || 
        (item.category && item.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());
      const query = (searchQuery || '').trim().toLowerCase();
      const matchesSearch = !query || 
        (item.item_name && item.item_name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Hero Welcome Banner (Stripe Light Glass Card Style) */}
      <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-stripe-md p-6 sm:p-9 overflow-hidden">
        {/* Soft background ambient gradient glow */}
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-gradient-to-br from-orange-400/15 via-amber-300/10 to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-orange-700 text-[11px] font-bold uppercase tracking-wider shadow-stripe-sm">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span>Digital Mess Hub • VIT Campus</span>
          </div>

          <h1 className="text-2xl sm:text-3.5xl font-black tracking-tight text-slate-900 leading-tight">
            Craving Good Food, <span className="text-orange-600">{user?.name?.split(' ')[0] || 'Student'}</span>?
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
            Order fresh breakfast, lunch, snacks, and dinner directly from your phone. Zero queue time, live kitchen status tracking, and 1:1 instant credit top-ups.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-stripe-sm hover:shadow-stripe-md transition-all duration-150 flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              <span>View Tray ({totalItemCount})</span>
            </button>

            <button
              onClick={() => setIsTopupOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange transition-all duration-150 flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buy Credits (₹1 = 1 Cr)</span>
            </button>

            <button
              onClick={onNavigateToOrders}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200/80 shadow-stripe-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Track Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Credits Promo Card (Hi-Tech Light Stripe FinTech Style) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-stripe border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shadow-stripe-sm shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm sm:text-base text-slate-900">Need Extra Mess Credits?</h3>
              <span className="bg-orange-50 text-orange-700 border border-orange-200/60 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                ₹1 = 1 Credit
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant balance refill via UPI, Cards, NetBanking with Razorpay.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto relative z-10">
          {[50, 100, 200, 500].map(amt => (
            <button
              key={amt}
              type="button"
              onClick={() => setIsTopupOpen(true)}
              className="flex-1 md:flex-none px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-xs font-black text-slate-700 border border-slate-200/80 transition-all duration-150 active:scale-95 text-center shadow-stripe-sm tabular-nums"
            >
              +₹{amt}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsTopupOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-black text-white shadow-stripe-sm hover:shadow-glow-orange transition-all duration-150 flex items-center gap-1 shrink-0 active:scale-95"
          >
            <span>Top Up</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills (Stripe Tab Style) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/60 rounded-2xl overflow-x-auto scrollbar-none shadow-stripe-sm">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-150 ${
                selectedCategory === category
                  ? 'bg-white text-slate-900 shadow-stripe-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search & Live Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes or beverages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition"
            />
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 bg-white border border-slate-200/80 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-stripe-sm ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh menu stock"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2.5xl p-4 border border-slate-200/80 shadow-stripe animate-pulse space-y-3">
              <div className="h-44 bg-slate-100 rounded-xl w-full" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-9 bg-slate-100 rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-stripe p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center mx-auto shadow-stripe-sm">
            <Filter className="w-7 h-7 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No dishes found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any dishes matching "{searchQuery}". Try selecting another category or clearing your search.
          </p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map(item => (
            <MenuCard key={item.item_id} item={item} />
          ))}
        </div>
      )}

      {/* Topup Modal */}
      <TopupModal
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        onSuccess={() => fetchMenu()}
      />
    </div>
  );
}
