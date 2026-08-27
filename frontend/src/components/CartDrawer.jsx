import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export function CartDrawer({ onOrderSuccess }) {
  const { cart = [], isOpen, setIsOpen, updateQuantity, removeFromCart, clearCart, totalAmount = 0, remainingCredits = 0, balanceAfterOrder = 0, isInsufficientCredit = false } = useCart();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const cartList = cart || [];

  const handlePlaceOrder = async () => {
    if (cartList.length === 0) return;
    if (isInsufficientCredit) {
      showToast('Insufficient credit balance to place this order.', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = cartList.map(item => ({
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
        className="absolute inset-0 bg-stone-900/40 transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FFFFFF] shadow-2xl border-l border-stone-200 flex flex-col justify-between animate-slide-up">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FFF7F0]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white text-[#FF6B35] border border-orange-200/80 flex items-center justify-center font-bold shadow-soft-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1E1B16] font-heading">Your Meal Tray</h2>
                <p className="text-xs text-[#6B6560] font-medium">{cartList.length} dish{cartList.length === 1 ? '' : 'es'} ready for checkout</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white border border-stone-200 text-[#6B6560] hover:text-[#1E1B16] flex items-center justify-center transition shadow-soft-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cartList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF7F0] text-[#FF6B35] border border-orange-200 flex items-center justify-center mx-auto shadow-soft-sm">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading">Your Tray is Empty</h3>
                  <p className="text-xs text-[#6B6560] mt-1 max-w-[220px]">
                    Browse today's dining menu and add delicious meals to your tray.
                  </p>
                </div>
              </div>
            ) : (
              cartList.map(item => (
                <div key={item.item_id} className="p-3.5 rounded-2xl bg-[#FFF7F0]/50 border border-stone-200/80 flex items-center justify-between gap-3 shadow-soft-sm">
                  <div className="flex items-center gap-3">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.item_name}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200/80 shrink-0"
                      />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-[#1E1B16] font-heading">{item.item_name}</h4>
                      <span className="text-xs font-bold text-[#FF6B35] font-heading tabular-nums">
                        {item.price} Cr
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-stone-200 p-1 rounded-xl shadow-soft-sm">
                      <button
                        onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-[#1E1B16] transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-[#1E1B16] px-1.5 tabular-nums font-heading">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-[#FF6B35] text-white flex items-center justify-center transition shadow-soft-sm"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.item_id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {cartList.length > 0 && (
            <div className="p-5 border-t border-stone-100 bg-[#FFF7F0] space-y-4">
              
              {/* Financial Balance Breakdown */}
              <div className="p-3.5 bg-white rounded-xl border border-stone-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-[#6B6560]">
                  <span>Current Available Balance:</span>
                  <span className="font-bold text-[#1E1B16] tabular-nums font-heading">{remainingCredits.toLocaleString()} Credits</span>
                </div>
                <div className="flex justify-between text-[#6B6560]">
                  <span>Meal Tray Subtotal:</span>
                  <span className="font-bold text-[#FF6B35] tabular-nums font-heading">-{totalAmount} Credits</span>
                </div>
                <div className="pt-2 border-t border-stone-100 flex justify-between font-bold">
                  <span className="text-[#1E1B16]">Balance After Order:</span>
                  <span className={`tabular-nums font-heading ${isInsufficientCredit ? 'text-red-600' : 'text-[#16A34A]'}`}>
                    {balanceAfterOrder.toLocaleString()} Credits
                  </span>
                </div>
              </div>

              {isInsufficientCredit && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 flex items-center gap-2 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>You do not have enough credits to complete this order.</span>
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || isInsufficientCredit || cartList.length === 0}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm shadow-btn-orange"
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
