import React, { useState } from 'react';
import { X, PlusCircle, CreditCard, Sparkles, ShieldCheck, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
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
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
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
            confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white p-6 sm:p-7">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-orange-200 block">Instant Refill</span>
              <h2 className="text-xl font-black tracking-tight text-white">Buy Credits via Razorpay</h2>
            </div>
          </div>
          <p className="text-xs text-orange-100/90 leading-relaxed">
            Refill your meal balance anytime. <strong>₹1 = 1 Mess Credit</strong> instantly usable for all meals.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              Select Top-up Amount
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = !isCustom && selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`py-3 px-2 rounded-2xl font-black text-sm flex flex-col items-center justify-center transition border ${
                      isSelected
                        ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-md shadow-orange-500/15 scale-[1.02]'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>₹{amt}</span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">+{amt} Crs</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Option */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Or Enter Custom Amount (₹)
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
                className={`w-full pl-8 pr-4 py-3 bg-slate-50 border rounded-2xl text-base font-black text-slate-900 focus:outline-none focus:bg-white transition ${
                  isCustom && customAmount
                    ? 'border-orange-500 ring-2 ring-orange-500/20 bg-white'
                    : 'border-slate-200 focus:border-orange-500'
                }`}
              />
            </div>
          </div>

          {/* Credit Conversion Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/70 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-amber-900/80 block uppercase tracking-wide">You will receive</span>
                <span className="text-xl font-black text-slate-900">
                  {currentAmount.toLocaleString()} <span className="text-sm font-bold text-orange-600">Credits</span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Rate</span>
              <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-amber-200">
                ₹1 = 1 Credit
              </span>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>256-bit Encrypted Payments via <strong>Razorpay</strong></span>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handlePayment}
            disabled={loading || !isValidAmount}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Pay ₹{currentAmount.toLocaleString()} & Add Credits</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
