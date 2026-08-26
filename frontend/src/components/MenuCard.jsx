import React from 'react';
import { Plus, Minus, Check, Sparkles, Utensils, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function MenuCard({ item }) {
  const { cart = [], addToCart, updateQuantity } = useCart();
  const cartList = cart || [];
  const cartItem = cartList.find(i => i.item_id === item?.item_id);
  const isOutOfStock = (item?.available_quantity ?? 0) <= 0;
  const isLowStock = (item?.available_quantity ?? 0) > 0 && item.available_quantity <= 5;

  if (!item) return null;

  return (
    <div className="card flex flex-col justify-between overflow-hidden relative group">
      
      {/* Top Image Section */}
      <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden bg-slate-100">
        <img
          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
          alt={item.item_name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            isOutOfStock ? 'grayscale opacity-60' : ''
          }`}
          loading="lazy"
        />

        {/* Category Pill on top-left */}
        <div className="absolute top-3 left-3">
          <span className="status-pill bg-white/90 text-ink backdrop-blur-md border border-border shadow-level-1 text-[11px]">
            {item.category}
          </span>
        </div>

        {/* Stock Badge on top-right */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="status-pill status-pill-danger text-[11px] backdrop-blur-md shadow-level-1">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="status-pill status-pill-warning text-[11px] backdrop-blur-md shadow-level-1">
              Only {item.available_quantity} left
            </span>
          ) : (
            <span className="status-pill status-pill-success text-[11px] backdrop-blur-md shadow-level-1">
              In Stock
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-2 flex-1">
        <h3 className="text-h3 text-ink leading-tight">
          {item.item_name}
        </h3>
        
        <p className="text-body text-xs line-clamp-2">
          {item.description || 'Freshly prepared delicious campus meal.'}
        </p>
      </div>

      {/* Bottom Price and Add CTA */}
      <div className="mt-4 pt-3 border-t border-divider flex items-center justify-between gap-2">
        <div>
          <span className="text-micro text-muted block">Price</span>
          <div className="text-xl font-bold text-[#FF6B35] tabular-nums">
            {item.price} <span className="text-xs font-semibold text-muted">Credits</span>
          </div>
        </div>

        <div>
          {isOutOfStock ? (
            <button
              disabled
              className="px-3.5 py-2 bg-slate-100 text-muted font-semibold text-xs rounded-btn cursor-not-allowed border border-border"
            >
              Unavailable
            </button>
          ) : cartItem ? (
            <div className="flex items-center gap-2 bg-[#FAFAFB] border border-border p-1 rounded-btn shadow-level-1">
              <button
                type="button"
                onClick={() => updateQuantity && updateQuantity(item.item_id, cartItem.quantity - 1)}
                className="w-7 h-7 rounded-[8px] bg-white border border-border text-ink hover:bg-slate-50 flex items-center justify-center transition active:scale-95 shadow-level-1"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-xs tabular-nums text-ink px-1.5 min-w-[18px] text-center">
                {cartItem.quantity}
              </span>
              <button
                type="button"
                onClick={() => addToCart && addToCart(item)}
                disabled={cartItem.quantity >= item.available_quantity}
                className="w-7 h-7 rounded-[8px] bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white flex items-center justify-center transition active:scale-95 disabled:opacity-40 shadow-level-4"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart && addToCart(item)}
              className="btn-primary py-2 px-3.5 text-xs"
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
