import React from 'react';
import { Plus, Minus, Check, Sparkles, Utensils, AlertCircle, Flame } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function MenuCard({ item, healthMode = false, consumedToday = 0, dailyCalorieGoal = null }) {
  const { cart = [], totalCalories = 0, addToCart, updateQuantity } = useCart();
  const cartList = cart || [];
  const cartItem = cartList.find(i => i.item_id === item?.item_id);
  const isOutOfStock = (item?.available_quantity ?? 0) <= 0;
  const isLowStock = (item?.available_quantity ?? 0) > 0 && item.available_quantity <= 5;

  const itemCalories = item?.calories || 250;
  const wouldExceedGoal = healthMode && dailyCalorieGoal && (consumedToday + totalCalories + itemCalories > dailyCalorieGoal);

  if (!item) return null;

  return (
    <div className="card flex flex-col justify-between overflow-hidden relative group hover:border-orange-300 transition-all duration-200">
      
      {/* Top Image Section */}
      <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden bg-stone-100">
        <img
          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
          alt={item.item_name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-50' : ''
          }`}
          loading="lazy"
        />

        {/* Category & Health Badges on top-left */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <span className="bg-white/95 text-[#1E1B16] font-semibold px-2.5 py-1 rounded-full border border-stone-200/80 shadow-soft-sm text-[11px]">
            {item.category}
          </span>

          {healthMode && (
            <span className="bg-orange-500 text-white font-bold px-2 py-0.5 rounded-full shadow-soft-sm text-[10px] flex items-center gap-1 font-heading animate-fade-in">
              <Flame className="w-3 h-3 fill-current text-white" />
              <span>{itemCalories} kcal</span>
            </span>
          )}
        </div>

        {/* Stock Badge on top-right */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {isOutOfStock ? (
            <span className="status-pill status-pill-danger text-[11px] bg-white shadow-soft-sm">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="status-pill status-pill-warning text-[11px] bg-white shadow-soft-sm">
              Only {item.available_quantity} left
            </span>
          ) : (
            <span className="status-pill status-pill-success text-[11px] bg-white shadow-soft-sm">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-1.5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-[#1E1B16] leading-tight font-heading group-hover:text-[#FF6B35] transition-colors">
            {item.item_name}
          </h3>
        </div>
        
        <p className="text-xs text-[#6B6560] line-clamp-2 leading-relaxed">
          {item.description || 'Freshly prepared delicious campus meal.'}
        </p>

        {/* Non-blocking Over-Goal Warning */}
        {wouldExceedGoal && (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D97706] bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg">
              <AlertCircle className="w-3 h-3 text-[#D97706]" />
              <span>Will exceed daily goal</span>
            </span>
          </div>
        )}
      </div>

      {/* Bottom Price, Calories & Add CTA */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-semibold text-[#9B9590] uppercase tracking-wider block">Price</span>
          <div className="text-lg font-bold text-[#1E1B16] tabular-nums font-heading flex items-baseline gap-1.5">
            <span>{item.price}</span>
            <span className="text-xs font-semibold text-[#6B6560]">Credits</span>
          </div>
        </div>

        <div>
          {isOutOfStock ? (
            <button
              disabled
              className="px-3.5 py-2 bg-stone-100 text-[#9B9590] font-semibold text-xs rounded-xl cursor-not-allowed border border-stone-200"
            >
              Unavailable
            </button>
          ) : cartItem ? (
            <div className="flex items-center gap-1.5 bg-[#FFF7F0] border border-orange-200/80 p-1 rounded-xl shadow-soft-sm">
              <button
                type="button"
                onClick={() => updateQuantity && updateQuantity(item.item_id, cartItem.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-white border border-stone-200 text-[#1E1B16] hover:bg-stone-50 flex items-center justify-center transition active:scale-95 shadow-soft-sm"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-xs tabular-nums text-[#1E1B16] px-1.5 min-w-[18px] text-center font-heading">
                {cartItem.quantity}
              </span>
              <button
                type="button"
                onClick={() => addToCart && addToCart(item)}
                disabled={cartItem.quantity >= item.available_quantity}
                className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 shadow-soft-sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart && addToCart(item)}
              className="btn-primary py-2 px-3.5 text-xs shadow-btn-orange"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Tray</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
