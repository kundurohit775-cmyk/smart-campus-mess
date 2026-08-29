import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Sparkles, 
  TrendingUp, 
  Users, 
  CloudRain, 
  Wind, 
  Share2, 
  Check, 
  ArrowRight, 
  UtensilsCrossed, 
  Calendar,
  ExternalLink,
  Award,
  Heart
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

// Simple smooth count-up hook for numbers
function useCountUp(targetNumber, durationMs = 1600) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!targetNumber || targetNumber <= 0) {
      setCurrent(0);
      return;
    }

    let start = 0;
    const end = targetNumber;
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const val = start + (end - start) * easeOutProgress;

      setCurrent(val);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCurrent(end);
      }
    };

    requestAnimationFrame(updateCount);
  }, [targetNumber, durationMs]);

  return current;
}

export function SustainabilityImpact({ onNavigateHome }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getPublicFoodSavedStats()
      .then(res => setData(res))
      .catch(err => console.error('Failed to load sustainability metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  const allTimeKg = data?.metrics?.allTimeKgSaved || 0;
  const animatedKg = useCountUp(allTimeKg, 1800);

  const handleCopyLink = () => {
    const url = window.location.origin + '/impact';
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        showToast('Link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => showToast('Failed to copy link', 'error'));
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🌱 SmartMess Sustainability Impact: Together, we have avoided ${allTimeKg} kg of food waste through Next-Day Special Pre-Orders on campus! See live impact: ${window.location.origin}/impact`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `🌱 SmartMess has avoided ${allTimeKg} kg of food waste across campus dining through Next-Day Special Pre-Orders! 🌍 Check the live sustainability counter:`
    );
    const url = encodeURIComponent(window.location.origin + '/impact');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B16] flex flex-col selection:bg-[#FF6B35] selection:text-white">
      
      {/* Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-soft-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            <div 
              onClick={onNavigateHome ? onNavigateHome : () => { window.location.href = '/'; }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#F7931E] flex items-center justify-center text-white shadow-soft-sm group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-[#1E1B16] block font-heading">
                  Smart<span className="text-[#FF6B35]">Mess</span>
                </span>
                <span className="text-[11px] text-[#16A34A] font-bold block -mt-1 font-heading flex items-center gap-1">
                  <Leaf className="w-3 h-3 fill-[#16A34A]" />
                  Sustainability Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 shadow-soft-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                onClick={onNavigateHome ? onNavigateHome : () => { window.location.href = '/'; }}
                className="btn-primary py-2 px-4 text-xs shadow-btn-orange flex items-center gap-1.5"
              >
                <span>Dining Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 sm:py-16 space-y-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HERO SECTION: LIVE COUNTER */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#15803D] text-xs font-bold font-heading shadow-soft-sm">
            <Leaf className="w-4 h-4 text-[#16A34A] fill-[#16A34A]" />
            <span>CAMPUS FOOD WASTE AVOIDANCE COUNTER</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E1B16] font-heading tracking-tight max-w-2xl mx-auto leading-tight">
              Pre-Order Precision. Zero Guesswork.
            </h1>
            <p className="text-sm sm:text-base text-[#6B6560] max-w-xl mx-auto leading-relaxed">
              Every time you pre-order a special dish, our kitchen prepares exactly what's needed — avoiding overproduction and conserving campus dining resources.
            </p>
          </div>

          {/* Prominent Animated Counter Box */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#FFF7F0] via-white to-emerald-50/40 border border-orange-200 shadow-xl max-w-2xl mx-auto relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest font-heading block">
                Total Cumulative Food Saved
              </span>

              {loading ? (
                <div className="h-20 flex items-center justify-center">
                  <div className="w-10 h-10 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl sm:text-7xl font-extrabold text-[#1E1B16] font-heading tabular-nums tracking-tight">
                    {animatedKg.toFixed(1)}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] font-heading">
                    kg
                  </span>
                </div>
              )}

              <p className="text-xs text-[#6B6560] font-medium pt-1">
                Equivalent to ~<strong>{data?.metrics?.mealsEquivalent || 0} full meal portions</strong> saved from landfill
              </p>
            </div>
          </div>
        </section>

        {/* 2. SUPPORTING IMPACT METRICS */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-soft-sm space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold text-[#6B6560]">This Month</span>
              <Calendar className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <span className="text-2xl font-bold text-[#1E1B16] font-heading tabular-nums block pt-1">
              {data?.metrics?.thisMonthKgSaved || 0} kg
            </span>
            <span className="text-[11px] text-[#16A34A] font-semibold">Active Cycle</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-soft-sm space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold text-[#6B6560]">This Week</span>
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <span className="text-2xl font-bold text-[#1E1B16] font-heading tabular-nums block pt-1">
              {data?.metrics?.thisWeekKgSaved || 0} kg
            </span>
            <span className="text-[11px] text-[#6B6560]">Current Week</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-soft-sm space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold text-[#6B6560]">CO₂e Avoided</span>
              <Wind className="w-4 h-4 text-[#16A34A]" />
            </div>
            <span className="text-2xl font-bold text-[#16A34A] font-heading tabular-nums block pt-1">
              {data?.metrics?.co2AvoidedKg || 0} kg
            </span>
            <span className="text-[11px] text-[#6B6560]">Greenhouse emissions</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-soft-sm space-y-1">
            <div className="flex items-center justify-between text-stone-400">
              <span className="text-xs font-semibold text-[#6B6560]">Students Engaged</span>
              <Users className="w-4 h-4 text-[#FF6B35]" />
            </div>
            <span className="text-2xl font-bold text-[#1E1B16] font-heading tabular-nums block pt-1">
              {data?.metrics?.uniqueStudentsCount || 0}
            </span>
            <span className="text-[11px] text-[#6B6560]">Participating diners</span>
          </div>

        </section>

        {/* 3. TIMELINE & TOP DISHES GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Weekly Trend Timeline */}
          <div className="lg:col-span-7 card p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                  Weekly Food Waste Reduction Timeline
                </h3>
                <p className="text-xs text-[#6B6560] mt-0.5">Kilograms saved across recent academic weeks</p>
              </div>
              <span className="status-pill status-pill-success text-[10px] font-heading">
                Weekly History
              </span>
            </div>

            {(!data?.timeline || data.timeline.length === 0) ? (
              <p className="py-8 text-center text-xs text-[#9B9590]">Timeline syncing with verified pre-order logs...</p>
            ) : (
              <div className="space-y-3.5">
                {data.timeline.map((item, idx) => {
                  const maxKg = Math.max(...data.timeline.map(t => t.kgSaved), 1);
                  const barWidth = Math.max(12, Math.round((item.kgSaved / maxKg) * 100));

                  return (
                    <div key={item.weekStart || idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#1E1B16] font-heading">{item.weekLabel}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#16A34A] font-bold">{item.kgSaved} kg saved</span>
                          <span className="text-[#9B9590] text-[11px]">({item.portionsPreordered} portions)</span>
                        </div>
                      </div>

                      <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#FF6B35] to-[#16A34A] h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Top Contributing Dishes */}
          <div className="lg:col-span-5 card p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                  Top Impact Dishes
                </h3>
                <p className="text-xs text-[#6B6560] mt-0.5">Special meals preventing the most waste</p>
              </div>
              <Award className="w-4 h-4 text-[#FF6B35]" />
            </div>

            {(!data?.topDishes || data.topDishes.length === 0) ? (
              <p className="py-8 text-center text-xs text-[#9B9590]">No special dish batches recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.topDishes.map((dish, idx) => (
                  <div key={dish.dishId || idx} className="p-3 rounded-2xl bg-[#FFF7F0]/60 border border-orange-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#1E1B16] font-heading block">{dish.dishName}</span>
                      <span className="text-[11px] text-[#6B6560]">
                        {dish.portionsPreordered} portions pre-ordered
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#16A34A] font-heading tabular-nums text-sm block">
                        +{dish.kgSaved} kg
                      </span>
                      <span className="text-[10px] text-[#6B6560] font-medium">waste avoided</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </section>

        {/* 4. METHODOLOGY & DEFENSIVE SCIENCE CARD */}
        <section className="card p-6 sm:p-8 bg-stone-50 border border-stone-200/80 space-y-4 text-xs text-[#6B6560]">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-200">
            <Award className="w-4 h-4 text-[#16A34A]" />
            <h4 className="font-bold text-sm text-[#1E1B16] font-heading">
              Calculation Methodology & Scientific Assumptions
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 bg-white rounded-xl border border-stone-200/80 space-y-1">
              <span className="font-bold text-[#1E1B16] block font-heading">1. Overproduction Benchmark</span>
              <p className="text-[11px] leading-relaxed">
                Institutional dining kitchens historically buffer special dishes by <strong>25%</strong> when guessing walk-in attendance to avoid running out.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-stone-200/80 space-y-1">
              <span className="font-bold text-[#1E1B16] block font-heading">2. Pre-Order Precision</span>
              <p className="text-[11px] leading-relaxed">
                Pre-orders enforce 1:1 cooking targets. The avoided 25% overprep is converted into kilograms based on dish portion weights (~450g).
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-stone-200/80 space-y-1">
              <span className="font-bold text-[#1E1B16] block font-heading">3. EPA / FAO Environmental Multipliers</span>
              <p className="text-[11px] leading-relaxed">
                Every 1 kg of avoided food waste prevents <strong>2.5 kg CO₂e</strong> of greenhouse emissions and conserves <strong>180 L</strong> of agricultural water.
              </p>
            </div>
          </div>
        </section>

        {/* 5. SHARE & SPREAD THE WORD */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold font-heading">Help Campus Dining Reach 1,000 kg Saved!</h3>
            <p className="text-xs text-white/90 max-w-md">
              Share the live impact counter with your hostel block and encourage pre-ordering next-day chef specials.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShareWhatsApp}
              className="bg-white text-[#1E1B16] hover:bg-stone-50 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-soft-sm font-heading"
            >
              Share on WhatsApp
            </button>
            <button
              onClick={handleShareTwitter}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-soft-sm font-heading"
            >
              Post on X
            </button>
          </div>
        </section>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-stone-200 bg-[#FAFAF9] py-8 text-center text-xs text-[#9B9590] space-y-2">
        <p>SmartMess Campus Dining • VIT Food Sustainability & Waste Reduction Initiative</p>
        <p className="text-[11px]">Real-time data powered by student pre-order allocations and kitchen batch logs.</p>
      </footer>

    </div>
  );
}
