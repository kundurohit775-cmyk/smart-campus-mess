import React, { useState } from 'react';
import { Sparkles, Calendar, Plus, Minus, Flame, AlertCircle, CheckCircle2, Coins } from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function PreOrderModal({ item, isOpen, onClose, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const remaining = item.remaining_stock ?? item.special_stock_limit ?? 0;
  const isSoldOut = remaining <= 0;
  const price = item.price || 0;
  const totalCost = price * quantity;
  const currentCredits = user?.credits?.remaining ?? 9000;
  const hasEnoughCredits = currentCredits >= totalCost;

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setQuantity(val);
    } else if (e.target.value === '') {
      setQuantity(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      showToast('Quantity must be at least 1.', 'warning');
      return;
    }

    if (!hasEnoughCredits) {
      showToast(`Insufficient credits. You need ${totalCost} Cr, available: ${currentCredits} Cr.`, 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.placePreOrder(item.item_id, quantity);
      showToast(`Pre-order confirmed! Token: ${res.preOrder?.pickup_token}`, 'success', 4000);
      if (refreshUser) refreshUser();
      if (onSuccess) onSuccess(res.preOrder);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to place pre-order', 'error', 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const scheduledDate = item.special_available_date 
    ? new Date(item.special_available_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : 'Tomorrow';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reserve Special Dish (Next-Day Pickup)">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Dish Info Card */}
        <div className="flex gap-3.5 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
          <img
            src={item.display_image_url || item.image_url || item.fallback_image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'}
            alt={item.item_name}
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'; }}
            className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-soft-sm shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-heading flex items-center gap-1 shadow-soft-sm">
                <Sparkles className="w-2.5 h-2.5" />
                Special Batch
              </span>
              {item.calories && (
                <span className="text-[10px] font-bold text-[#FF6B35] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-md font-heading">
                  🔥 {item.calories} kcal
                </span>
              )}
            </div>
            <h4 className="font-bold text-sm text-[#1E1B16] truncate font-heading">{item.item_name}</h4>
            <p className="text-xs text-[#6B6560] font-heading font-semibold mt-0.5">
              {price} Credits / unit
            </p>
          </div>
        </div>

        {/* Date & Urgency Notice */}
        <div className="p-3 bg-[#FFF7F0] rounded-xl border border-orange-200 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5 text-[#1E1B16] font-heading">
              <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
              Pickup Date:
            </span>
            <span className="text-[#FF6B35] font-bold font-heading">{scheduledDate}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6B6560]">Remaining Batch Stock:</span>
            <span className={`font-bold font-heading ${isSoldOut ? 'text-[#DC2626]' : 'text-[#FF6B35]'}`}>
              {isSoldOut ? 'Sold Out for Tomorrow' : `Only ${remaining} unit${remaining !== 1 ? 's' : ''} left`}
            </span>
          </div>
        </div>

        {/* Quantity Selector */}
        {!isSoldOut ? (
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-[#1E1B16]">Select Quantity to Reserve</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-stone-200 rounded-xl bg-white shadow-soft-sm p-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#1E1B16] flex items-center justify-center transition disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-16 text-center font-bold font-heading text-sm text-[#1E1B16] bg-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#1E1B16] flex items-center justify-center transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-[#6B6560]">
                {quantity > remaining && (
                  <span className="text-[#D97706] font-semibold block">
                    ⚠️ Exceeds current remaining stock ({remaining})
                  </span>
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-[#DC2626] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>This special dish has reached maximum capacity and sold out for tomorrow.</span>
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="pt-2 border-t border-stone-100 space-y-1 text-xs">
          <div className="flex justify-between text-[#6B6560]">
            <span>Total Credit Cost ({quantity}x {price} Cr):</span>
            <span className="font-bold text-[#1E1B16] tabular-nums font-heading">{totalCost} Credits</span>
          </div>
          <div className="flex justify-between text-[#6B6560]">
            <span>Your Available Balance:</span>
            <span className="font-bold text-[#1E1B16] tabular-nums font-heading">{currentCredits.toLocaleString()} Credits</span>
          </div>
          {!hasEnoughCredits && (
            <p className="text-[11px] text-[#DC2626] font-semibold pt-1">
              ⚠️ You do not have enough credits to complete this pre-order.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 px-4 text-xs"
          >
            Cancel
          </button>
          {!isSoldOut && (
            <button
              type="submit"
              disabled={submitting || !hasEnoughCredits || isSoldOut}
              className="btn-primary py-2 px-5 text-xs shadow-btn-orange"
            >
              {submitting ? 'Reserving...' : `Confirm Pre-Order (${totalCost} Cr)`}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
