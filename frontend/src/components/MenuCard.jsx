import React from 'react';
import { Plus, Minus, Check, AlertCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function MenuCard({ item }) {
  const { items, addItem, updateQuantity } = useCart();

  const cartItem = items.find(i => i.item_id === item.item_id);
  const isSoldOut = item.available_quantity <= 0 || item.is_sold_out === 1;

  const categoryColors = {
    Breakfast: 'bg-amber-100 text-amber-800 border-amber-200',
    Lunch: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Snacks: 'bg-orange-100 text-orange-800 border-orange-200',
    Dinner: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    Beverages: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  };

  const badgeClass = categoryColors[item.category] || 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <div className={`group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden ${
      isSoldOut ? 'opacity-75 grayscale-[25%]' : 'hover:-translate-y-1'
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

        {/* Category Pill */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border shadow-sm backdrop-blur-md ${badgeClass}`}>
          {item.category}
        </span>

        {/* Live Availability Badge */}
        <div className="absolute top-3 right-3">
          {isSoldOut ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-600/95 text-white shadow-md flex items-center gap-1 backdrop-blur-md">
              <AlertCircle className="w-3.5 h-3.5" /> Sold Out
            </span>
          ) : item.available_quantity <= 10 ? (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/95 text-white shadow-md backdrop-blur-md animate-pulse">
              Only {item.available_quantity} left
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/90 text-white shadow-md backdrop-blur-md">
              {item.available_quantity} in stock
            </span>
          )}
        </div>

        {/* Price Pill Floating */}
        <div className="absolute bottom-3 left-3 bg-white/95 text-slate-900 px-3 py-1 rounded-xl font-extrabold text-sm shadow-md backdrop-blur-md flex items-center gap-1.5 border border-white/50">
          <span className="text-orange-600 font-black">{item.price}</span>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight">Credits</span>
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
            <div className="w-full flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-1.5 shadow-sm">
              <button
                onClick={() => updateQuantity(item.item_id, cartItem.quantity - 1)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-orange-100 text-orange-700 flex items-center justify-center font-bold shadow-sm transition active:scale-95"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-sm text-orange-950 px-3">
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
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md shadow-slate-900/10 active:scale-95 group/btn"
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
