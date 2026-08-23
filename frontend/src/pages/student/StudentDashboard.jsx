import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, Filter, RefreshCw, ShoppingBag, Clock, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { MenuCard } from '../../components/MenuCard';
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
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-6 sm:p-10 shadow-xl shadow-orange-500/15">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 skew-x-12 pointer-events-none hidden md:block" />
        
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Digital Token Mess Ordering
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Craving Good Food, {user?.name?.split(' ')[0]}?
          </h1>
          <p className="text-sm sm:text-base text-orange-100 leading-relaxed">
            Order your favorite meals in seconds without waiting in long queues. Credits are deducted automatically from your 9,000 monthly allowance.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="px-5 py-2.5 bg-white text-orange-800 hover:bg-orange-50 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <span>View Food Tray ({totalItemCount})</span>
            </button>
            <button
              onClick={onNavigateToOrders}
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl backdrop-blur-md transition flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Track Active Orders</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition shadow-sm ${
                selectedCategory === category
                  ? 'bg-orange-600 text-white shadow-orange-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes or beverages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
            />
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-sm ${refreshing ? 'animate-spin' : ''}`}
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
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
              <div className="h-44 bg-slate-200 rounded-xl w-full" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-full" />
              <div className="h-8 bg-slate-200 rounded-xl w-full mt-4" />
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <Filter className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No dishes found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
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
    </div>
  );
}
