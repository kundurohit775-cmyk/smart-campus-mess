import React, { useState, useEffect } from 'react';
import { 
  UtensilsCrossed, 
  Search, 
  Sparkles, 
  ShoppingBag, 
  Coins, 
  CreditCard, 
  Clock, 
  Plus, 
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { StatCard } from '../../components/StatCard';
import { MenuCard } from '../../components/MenuCard';
import { TopupModal } from '../../components/TopupModal';

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages'];

export function StudentDashboard({ onNavigateToOrders }) {
  const { user } = useAuth();
  const { cart = [], totalAmount = 0, totalCount = 0, setIsOpen: setCartOpen } = useCart();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await api.getMenu();
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const remainingCredits = user?.credits?.remaining ?? 9000;
  const usedCredits = user?.credits?.used ?? 0;
  const isLow = remainingCredits < 500;

  const filteredItems = (items || []).filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* 1. HERO STAT STRIP (4 Stat Cards in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Stat 1: Available Balance */}
        <StatCard
          title="Available Balance"
          value={`${remainingCredits.toLocaleString()}`}
          subtitle="9,000 monthly allowance"
          icon={Coins}
          color={isLow ? 'rose' : 'violet'}
          trend={isLow ? 'Low Balance' : 'Active'}
          trendPositive={!isLow}
        />

        {/* Stat 2: Used Monthly Credits */}
        <StatCard
          title="Used This Cycle"
          value={`${usedCredits.toLocaleString()}`}
          subtitle="Monthly dining spend"
          icon={CreditCard}
          color="cyan"
        />

        {/* Stat 3: Active Meal Tray */}
        <StatCard
          title="Meal Tray Items"
          value={`${totalCount || (cart || []).length} ${(totalCount || (cart || []).length) === 1 ? 'dish' : 'dishes'}`}
          subtitle={totalAmount > 0 ? `Subtotal: ${totalAmount} credits` : 'Tray is empty'}
          icon={ShoppingBag}
          color="emerald"
          onClick={() => setCartOpen(true)}
        />

        {/* Stat 4: Mess Status */}
        <StatCard
          title="Campus Mess Status"
          value="Kitchen Open"
          subtitle="Accepting meal orders"
          icon={Sparkles}
          color="amber"
          trend="Live Queue"
          trendPositive={true}
        />
      </div>

      {/* 2. MAIN CONTENT AREA: 2-Column Grid (Main 70% + Sidebar Widget 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 70% (col-span-8): Menu Filter & Catalog Grid */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Filter Bar & Search */}
          <div className="card-static flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
            
            {/* Category Segmented Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
              {(CATEGORIES || []).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-glow-primary'
                      : 'bg-[#0B0E1A] text-body hover:text-ink hover:bg-[#1A1F3A] border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9 h-9 text-xs"
              />
            </div>
          </div>

          {/* Dishes Catalog Grid */}
          {loading ? (
            <div className="card text-center py-16 text-muted">
              <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3 shadow-glow-primary" />
              <p className="text-xs font-semibold">Loading daily fresh menu...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="card text-center py-16 text-muted space-y-2">
              <UtensilsCrossed className="w-10 h-10 mx-auto text-muted" />
              <h3 className="text-h3 text-ink font-heading">No dishes found</h3>
              <p className="text-body text-xs">Try selecting a different meal category or clearing your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {(filteredItems || []).map((item) => (
                <MenuCard key={item.item_id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT 30% (col-span-4): Sidebar Tray & Razorpay Refill Widget */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Active Tray Summary Card */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="text-h3 text-ink font-heading">Your Meal Tray</h3>
              </div>
              <span className="status-pill status-pill-info text-[11px]">
                {(cart || []).length} items
              </span>
            </div>

            {(cart || []).length === 0 ? (
              <div className="py-6 text-center text-muted text-xs space-y-1">
                <p>Your meal tray is currently empty.</p>
                <p className="text-[11px]">Select items from the daily catalog to order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto divide-y divide-divider text-xs">
                  {(cart || []).map((i) => (
                    <div key={i.item_id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-ink block font-heading">{i.item_name}</span>
                        <span className="text-muted text-[11px]">{i.quantity} × {i.price} credits</span>
                      </div>
                      <span className="font-bold text-ink tabular-nums font-heading">
                        {i.quantity * i.price} Cr
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-divider flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted uppercase">Total Amount</span>
                  <span className="text-xl font-bold text-gradient tabular-nums font-heading">
                    {totalAmount} Credits
                  </span>
                </div>

                <button
                  onClick={() => setCartOpen(true)}
                  className="w-full btn-primary py-2.5 text-xs"
                >
                  <span>Review Tray & Checkout</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Credit Refill Promo Card */}
          <div className="card bg-gradient-to-br from-[#1A1F3A] via-[#131728] to-[#0B0E1A] border-[#8B5CF6]/30 shadow-glow-primary space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#06B6D4] text-white flex items-center justify-center shadow-glow-primary">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink font-heading">Buy Dining Credits</h3>
                <span className="text-[11px] text-[#06B6D4] font-medium">Instant Razorpay Top-Up</span>
              </div>
            </div>

            <p className="text-body text-xs leading-relaxed">
              Top up your balance instantly using UPI, NetBanking, or Debit Card. ₹1 = 1 Credit.
            </p>

            <button
              onClick={() => setIsTopupOpen(true)}
              className="w-full btn-secondary text-xs py-2 justify-center"
            >
              <Plus className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Add Credits Now</span>
            </button>
          </div>

          {/* Live Pickup Orders Link */}
          <div className="card p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#34D399]/15 text-status-success border border-[#34D399]/30 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-ink block font-heading">Track Orders Live</span>
                <span className="text-[11px] text-muted">View tokens & prep stage</span>
              </div>
            </div>

            <button
              onClick={onNavigateToOrders}
              className="w-8 h-8 rounded-full bg-[#0B0E1A] border border-border text-ink hover:bg-gradient-to-r hover:from-[#8B5CF6] hover:to-[#06B6D4] hover:text-white hover:border-transparent flex items-center justify-center transition shadow-level-1"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Razorpay Top-Up Modal */}
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
