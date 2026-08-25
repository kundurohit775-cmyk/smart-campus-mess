import React from 'react';
import { Plus, Minus, AlertCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function MenuCard({ item }) {
  const { items, addItem, updateQuantity } = useCart();

  const cartItem = items.find(i => i.item_id === item.item_id);
  const isSoldOut = item.available_quantity <= 0 || item.is_sold_out === 1;

  const categoryColors = {
    Breakfast: 'bg-amber-500/90 text-white border-white/20',
    Lunch: 'bg-emerald-500/90 text-white border-white/20',
    Snacks: 'bg-orange-500/90 text-white border-white/20',
    Dinner: 'bg-indigo-500/90 text-white border-white/20',
    Beverages: 'bg-sky-500/90 text-white border-white/20',
  };

  const badgeClass = categoryColors[item.category] || 'bg-slate-700/90 text-white border-white/20';

  return (
    <div className={`group bg-white rounded-2.5xl border border-slate-200/80 shadow-stripe hover:shadow-stripe-hover transition-all duration-200 flex flex-col overflow-hidden ${
      isSoldOut ? 'opacity-70 grayscale-[20%]' : 'hover:-translate-y-1'
    }`}>
      {/* Food Image with Category & Stock Badges */}
      <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
        <img
          src={item.image_url}
          alt={item.item_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/10" />

        {/* Category Pill */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm backdrop-blur-md ${badgeClass}`}>
          {item.category}
        </span>

        {/* Live Availability Badge */}
        <div className="absolute top-3 right-3">
          {isSoldOut ? (
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-600/95 text-white shadow-md flex items-center gap-1 backdrop-blur-md">
              <AlertCircle className="w-3.5 h-3.5" /> Sold Out
            </span>
          ) : item.available_quantity <= 10 ? (
            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/95 text-white shadow-md backdrop-blur-md animate-pulse">
              Only {item.available_quantity} left
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-white/90 text-slate-800 shadow-sm backdrop-blur-md border border-white/40">
              {item.available_quantity} in stock
            </span>
          )}
        </div>

        {/* Price Pill Floating */}
        <div className="absolute bottom-3 left-3 bg-white/95 text-slate-900 px-3 py-1 rounded-xl font-black text-sm shadow-sm backdrop-blur-md flex items-center gap-1.5 border border-white/60">
          <span className="text-orange-600 font-black tabular-nums">{item.price}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Credits</span>
        </div>
      </div>

      {/* Details & Cart Action */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between gap-4">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-orange-600 transition leading-snug">
            {item.item_name}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {isSoldOut ? (
            <button
              disabled
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed uppercase tracking-wider text-center"
            >
              Unavailable Today
            </button>
          ) : cartItem ? (
            <div className="w-full flex items-center justify-between bg-orange-50/80 border border-orange-200/80 rounded-xl p-1.5 shadow-stripe-sm">
              <button
                onClick={() => updateQuantity(item.item_id, cartItem.quantity - 1)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-orange-100 text-orange-700 flex items-center justify-center font-bold shadow-stripe-sm transition active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-xs sm:text-sm text-orange-950 px-3 tabular-nums">
                {cartItem.quantity} in tray
              </span>
              <button
                onClick={() => updateQuantity(item.item_id, cartItem.quantity + 1)}
                disabled={cartItem.quantity >= item.available_quantity}
                className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center font-bold shadow-sm transition active:scale-95"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item, 1)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 shadow-stripe-sm hover:shadow-glow-orange active:scale-95 group/btn"
            >
              <ShoppingBag className="w-4 h-4 text-orange-400 group-hover/btn:text-white transition" />
              <span>Add to Tray</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
