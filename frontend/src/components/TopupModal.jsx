import React, { useState } from 'react';
import { X, CreditCard, Sparkles, ShieldCheck, ArrowRight, Coins, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import confetti from 'canvas-confetti';

const PRESET_AMOUNTS = [50, 100, 200, 500];

// Helper to load Razorpay Checkout SDK dynamically
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function TopupModal({ isOpen, onClose, onSuccess }) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [selectedAmount, setSelectedAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentAmount = isCustom ? (parseInt(customAmount, 10) || 0) : selectedAmount;
  const isValidAmount = currentAmount >= 1 && currentAmount <= 50000;

  const handleSelectPreset = (amt) => {
    setSelectedAmount(amt);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setIsCustom(true);
  };

  const handlePayment = async () => {
    if (!isValidAmount) {
      showToast('Please enter an amount between ₹1 and ₹50,000.', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 1. Create Razorpay Order via Backend API
      const orderData = await api.createPaymentOrder(currentAmount);

      // 2. Load Razorpay Checkout.js SDK
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded && !orderData.isSimulated) {
        throw new Error('Failed to load Razorpay Payment SDK. Please check your internet connection.');
      }

      // 3. Handle Development Simulated Mode (When no live Razorpay keys are configured)
      if (orderData.isSimulated || !window.Razorpay) {
        const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const verifyRes = await api.verifyPayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: simPaymentId,
          razorpay_signature: 'simulated_signature',
          amount: currentAmount
        });

        // Trigger celebratory confetti
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        showToast(`🎉 Top-up successful! Added ₹${currentAmount} (${currentAmount} Credits) to your account.`, 'success', 6000);

        if (refreshUser) await refreshUser();
        if (onSuccess) onSuccess(verifyRes);
        onClose();
        return;
      }

      // 4. Launch Official Razorpay Checkout Modal
      const razorpayKey = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Smart Campus Mess',
        description: `Top-up ${currentAmount} Mess Credits (₹1 = 1 Credit)`,
        image: 'https://cdn-icons-png.flaticon.com/512/562/562678.png',
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#ea580c'
        },
        handler: async function (response) {
          try {
            const verifyRes = await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: currentAmount
            });

            // Trigger celebratory confetti
            confetti({ particleCount: 90, spread: 85, origin: { y: 0.6 } });
            showToast(`🎉 Top-up successful! Added ₹${currentAmount} (${currentAmount} Credits) to your account.`, 'success', 6000);

            if (refreshUser) await refreshUser();
            if (onSuccess) onSuccess(verifyRes);
            onClose();
          } catch (err) {
            showToast(err.message || 'Payment signature verification failed.', 'error', 6000);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            showToast('Top-up window closed.', 'info', 2500);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        showToast(`Payment failed: ${response.error?.description || 'Transaction unsuccessful'}`, 'error', 6000);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment initialization error:', err);
      showToast(err.message || 'Failed to initiate Razorpay checkout', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-stripe-lg border border-slate-200/90 max-w-md w-full overflow-hidden animate-scale-in relative">
        
        {/* Top subtle highlight */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200/80 text-orange-600 flex items-center justify-center shadow-stripe-sm">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-orange-600 block">Instant Refill</span>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Buy Mess Credits</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 sm:px-7 pb-7 space-y-5">
          <p className="text-xs text-slate-500 leading-relaxed">
            Refill your credit balance securely via Razorpay. <strong className="text-slate-800">1 Rupee (₹1) = 1 Mess Credit</strong>.
          </p>

          {/* Preset Buttons */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Preset Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = !isCustom && selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-3 px-2 rounded-2xl font-black text-sm flex flex-col items-center justify-center transition-all duration-150 border ${
                      isSelected
                        ? 'bg-orange-50/90 border-orange-500 text-orange-700 shadow-stripe-sm ring-2 ring-orange-500/20 scale-[1.02]'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="tabular-nums">₹{amt}</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-0.5">+{amt} Crs</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Option */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Or Custom Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-extrabold text-slate-400">
                ₹
              </span>
              <input
                type="text"
                placeholder="e.g. 250, 1000"
                value={customAmount}
                onChange={handleCustomChange}
                className={`w-full pl-8 pr-4 py-2.5 bg-slate-50 border rounded-xl text-base font-black text-slate-900 focus:outline-none focus:bg-white transition ${
                  isCustom && customAmount
                    ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white'
                    : 'border-slate-200 focus:border-orange-500'
                }`}
              />
            </div>
          </div>

          {/* Credit Conversion Summary Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-200/70 flex items-center justify-between shadow-stripe-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-900/80 block uppercase tracking-wider">Credits Added</span>
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  +{currentAmount.toLocaleString()} <span className="text-xs font-bold text-orange-600">Credits</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Rate</span>
              <span className="text-xs font-extrabold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-amber-200/80 shadow-stripe-sm">
                ₹1 = 1 Cr
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handlePayment}
            disabled={loading || !isValidAmount}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-stripe-md hover:shadow-glow-orange flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Pay ₹{currentAmount.toLocaleString()} & Add Credits</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Security Guarantee Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>256-bit Encrypted Checkout via <strong>Razorpay</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
