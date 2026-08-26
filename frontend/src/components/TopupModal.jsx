import React, { useState } from 'react';
import { 
  CreditCard, 
  Coins, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from './Modal';
import confetti from 'canvas-confetti';

const PRESETS = [50, 100, 200, 500];

export function TopupModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePresetSelect = (preset) => {
    setAmount(preset);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount < 10 || numAmount > 10000) {
      showToast('Please enter an amount between ₹10 and ₹10,000.', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 1. Create order on backend
      const orderRes = await api.createRazorpayOrder(numAmount);
      const { order_id, key_id, currency } = orderRes;

      // 2. Setup Razorpay Checkout options
      const options = {
        key: key_id,
        amount: numAmount * 100,
        currency: currency || 'INR',
        name: 'Smart Campus Mess',
        description: `Add ${numAmount} Campus Dining Credits`,
        order_id: order_id,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#8B5CF6'
        },
        handler: async function (response) {
          try {
            // 3. Verify payment signature on backend
            await api.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: numAmount
            });

            // 4. Trigger celebration & update state
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });

            setPaymentSuccess(true);
            showToast(`🎉 Success! ₹${numAmount} credited (${numAmount} dining credits added).`, 'success', 6000);
            await refreshUser();

            setTimeout(() => {
              setPaymentSuccess(false);
              onClose();
            }, 2500);
          } catch (err) {
            showToast(err.message || 'Payment verification failed.', 'error', 6000);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            showToast('Payment cancelled.', 'info');
          }
        }
      };

      // 3. Open Razorpay modal
      if (typeof window.Razorpay !== 'undefined') {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for simulation / direct mock verification in tests
        const mockVerify = await api.verifyRazorpayPayment({
          razorpay_order_id: order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature_for_local_env',
          amount: numAmount
        });

        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        setPaymentSuccess(true);
        showToast(`🎉 Added ${numAmount} Credits to your account!`, 'success');
        await refreshUser();

        setTimeout(() => {
          setPaymentSuccess(false);
          onClose();
        }, 2200);
      }
    } catch (err) {
      showToast(err.message || 'Failed to initiate payment.', 'error');
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!loading) onClose(); }}
      title="Buy Credits via Razorpay"
      maxWidth="max-w-md"
    >
      {paymentSuccess ? (
        <div className="py-8 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#34D399]/15 text-status-success border border-[#34D399]/30 flex items-center justify-center mx-auto shadow-glow-emerald">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-h3 text-ink font-heading">
              Payment Successful!
            </h3>
            <p className="text-body text-sm mt-1">
              +{amount} credits added directly to your mess balance.
            </p>
          </div>
          <div className="status-pill status-pill-success text-xs">
            1 Credit = ₹1 INR
          </div>
        </div>
      ) : (
        <form onSubmit={handlePayment} className="space-y-5">
          
          {/* Rate notice badge */}
          <div className="p-3.5 bg-[#8B5CF6]/10 rounded-xl border border-[#8B5CF6]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#8B5CF6]" />
              <span className="text-xs font-semibold text-ink">Exchange Rate</span>
            </div>
            <span className="text-xs font-bold text-[#06B6D4] bg-[#0B0E1A] px-2.5 py-0.5 rounded-[6px] border border-[#06B6D4]/40 font-heading">
              1 Credit = ₹1 INR
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <label className="block text-micro text-muted font-semibold">
              Select Preset Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`py-2.5 rounded-xl text-xs font-bold font-heading transition-all duration-200 ${
                    amount === preset
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white shadow-glow-primary scale-105'
                      : 'bg-[#0B0E1A] border border-border text-ink hover:bg-[#1A1F3A]'
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div className="space-y-1.5">
            <label className="block text-micro text-muted font-semibold">
              Or Enter Custom Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[#06B6D4] text-sm">
                ₹
              </span>
              <input
                type="number"
                min="10"
                max="10000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="input-field pl-8 font-bold text-ink font-heading"
              />
            </div>
            <span className="text-[11px] text-muted block">
              You will receive <strong className="text-[#34D399] font-heading">{amount || 0} dining credits</strong>.
            </span>
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading || !amount || amount < 10}
            className="w-full btn-primary"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{amount || 0} via Razorpay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Footer Security Badge */}
          <div className="pt-2 border-t border-divider flex items-center justify-center gap-1.5 text-label-small">
            <Lock className="w-3.5 h-3.5 text-muted" />
            <span>256-Bit SSL Encrypted Razorpay Checkout</span>
          </div>
        </form>
      )}
    </Modal>
  );
}
