import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export function CartDrawer({ onOrderSuccess }) {
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, totalAmount, remainingCredits, balanceAfterOrder, isInsufficientCredit } = useCart();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (isInsufficientCredit) {
      showToast('Insufficient credit balance to place this order.', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = items.map(item => ({
        itemId: item.item_id,
        quantity: item.quantity
      }));

      const res = await api.placeOrder(orderPayload);

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      showToast(`Order Placed! Pickup Token: ${res.order.pickupToken}`, 'success', 5000);
      clearCart();
      await refreshUser();
      setIsOpen(false);

      if (onOrderSuccess) {
        onOrderSuccess(res.order.orderId);
      }
    } catch (err) {
      showToast(err.message || 'Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-stripe-lg border-l border-slate-200/80 flex flex-col justify-between animate-slide-up">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center font-bold shadow-stripe-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Your Meal Tray</h2>
                <p className="text-xs text-slate-400 font-medium">{items.length} item{items.length === 1 ? '' : 's'} ready for pickup</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-400">
                  <ShoppingBag className="w-9 h-9 stroke-1" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Your Tray is Empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                    Browse today's mess menu and add delicious meals to your tray.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-stripe-sm transition"
                >
                  Browse Today's Menu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.item_id}
                    className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-stripe-sm hover:shadow-stripe transition-all duration-150"
                  >
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.item_name}</h4>
                      <p className="text-xs font-bold text-orange-600 mt-0.5 tabular-nums">
                        {item.price} Credits <span className="text-[10px] text-slate-400 font-normal">each</span>
                      </p>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-slate-900 px-1 tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                          disabled={item.quantity >= item.available_quantity}
                          className="w-6 h-6 rounded-lg bg-orange-600 disabled:bg-slate-200 text-white flex items-center justify-center font-bold hover:bg-orange-700 active:scale-95 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end h-14">
                      <span className="font-black text-sm text-slate-900 tabular-nums">
                        {item.price * item.quantity} Crs
                      </span>
                      <button
                        onClick={() => removeItem(item.item_id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs font-semibold text-slate-400 hover:text-rose-600 py-1 transition"
                >
                  Clear all items
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-4">
              {/* Credit Calculation Box */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-stripe-sm space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Available Balance:</span>
                  <span className="font-bold text-slate-800 tabular-nums">{remainingCredits.toLocaleString()} Credits</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Tray Total:</span>
                  <span className="font-bold text-orange-600 tabular-nums">- {totalAmount.toLocaleString()} Credits</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-black text-sm">
                  <span className="text-slate-900">Balance After Order:</span>
                  <span className={`tabular-nums ${isInsufficientCredit ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {balanceAfterOrder.toLocaleString()} Credits
                  </span>
                </div>
              </div>

              {/* Insufficient Credit Warning */}
              {isInsufficientCredit && (
                <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>You need {totalAmount - remainingCredits} more credits for this order.</span>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || isInsufficientCredit}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl shadow-stripe-md hover:shadow-glow-orange flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirm Order ({totalAmount} Credits)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
