import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertTriangle, Coins, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export function CartDrawer({ onOrderSuccess }) {
  const { cart, isOpen, setIsOpen, updateQuantity, removeFromCart, clearCart, totalAmount, remainingCredits, balanceAfterOrder, isInsufficientCredit } = useCart();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (isInsufficientCredit) {
      showToast('Insufficient credit balance to place this order.', 'error');
      return;
    }

    setLoading(true);
    try {
      const orderPayload = cart.map(item => ({
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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-level-3 border-l border-border flex flex-col justify-between animate-slide-up">
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-divider flex items-center justify-between bg-[#FAFAFB]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B35] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-h3 text-ink">Your Meal Tray</h2>
                <p className="text-xs text-muted font-medium">{cart.length} dish{cart.length === 1 ? '' : 'es'} ready for checkout</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white border border-border text-muted hover:text-ink hover:bg-slate-100 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6B35] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-h3 text-ink">Your Tray is Empty</h3>
                  <p className="text-body text-xs mt-1 max-w-[220px]">
                    Browse today's mess menu and add delicious meals to your tray.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-primary py-2.5 px-5 text-xs mx-auto"
                >
                  Browse Food Menu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div
                    key={item.item_id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border shadow-level-1 hover:shadow-level-2 transition-all duration-150"
                  >
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-ink truncate">{item.item_name}</h4>
                      <p className="text-xs font-bold text-[#FF6B35] mt-0.5 tabular-nums">
                        {item.price} Credits <span className="text-[10px] text-muted font-normal">each</span>
                      </p>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.item_id, item.quantity - 1)}
                          className="w-6 h-6 rounded-[6px] bg-[#FAFAFB] border border-border flex items-center justify-center text-ink hover:bg-slate-100 active:scale-95 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-ink px-1 tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.item_id, item.quantity + 1)}
                          disabled={item.quantity >= item.available_quantity}
                          className="w-6 h-6 rounded-[6px] bg-[#FF6B35] disabled:bg-slate-200 text-white flex items-center justify-center font-bold hover:bg-[#E85A2A] active:scale-95 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-between items-end h-12">
                      <span className="font-bold text-sm text-ink tabular-nums">
                        {item.price * item.quantity} Cr
                      </span>
                      <button
                        onClick={() => removeFromCart(item.item_id)}
                        className="text-muted hover:text-status-danger transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={clearCart}
                  className="w-full text-center text-xs font-semibold text-muted hover:text-status-danger py-1 transition"
                >
                  Clear all items
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-divider bg-[#FAFAFB] space-y-4">
              {/* Credit Calculation Box */}
              <div className="bg-white rounded-xl p-4 border border-border shadow-level-1 space-y-2 text-xs">
                <div className="flex justify-between text-muted font-medium">
                  <span>Available Balance:</span>
                  <span className="font-bold text-ink tabular-nums">{remainingCredits.toLocaleString()} Credits</span>
                </div>
                <div className="flex justify-between text-muted font-medium">
                  <span>Tray Total:</span>
                  <span className="font-bold text-[#FF6B35] tabular-nums">- {totalAmount.toLocaleString()} Credits</span>
                </div>
                <div className="pt-2 border-t border-divider flex justify-between font-bold text-sm">
                  <span className="text-ink">Balance After Order:</span>
                  <span className={`tabular-nums ${isInsufficientCredit ? 'text-status-danger' : 'text-status-success'}`}>
                    {balanceAfterOrder.toLocaleString()} Credits
                  </span>
                </div>
              </div>

              {/* Insufficient Credit Warning */}
              {isInsufficientCredit && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-status-danger font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>You need {totalAmount - remainingCredits} more credits for this order.</span>
                </div>
              )}

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || isInsufficientCredit}
                className="w-full btn-primary"
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
