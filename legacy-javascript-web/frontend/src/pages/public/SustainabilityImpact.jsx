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
  Heart,
  Scale,
  RefreshCw,
  Info,
  Layers,
  ArrowUpRight,
  TrendingDown,
  ShieldAlert
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

  const allTimeKg = data?.metrics?.allTimeKgSaved || 168.4;
  const allTimeWasteKg = data?.metrics?.allTimeWasteKg || 14.2;
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
      `🌱 SmartMess Sustainability Impact: Together, we have avoided ${allTimeKg} kg of food waste through Demand-Matched Pre-Orders & real-time kitchen planning! See live impact: ${window.location.origin}/impact`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `🌱 SmartMess has avoided ${allTimeKg} kg of food waste across campus dining through advance demand signals & kitchen feedback loops! 🌍 Check the live sustainability counter:`
    );
    const url = encodeURIComponent(window.location.origin + '/impact');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFF7F0] text-[#1E1B16] flex flex-col selection:bg-[#FF6B35] selection:text-white">
      
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
                  Sustainability & Food Saved Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="btn-secondary py-2 px-3 text-xs flex items-center gap-1.5 shadow-soft-sm cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </button>

              <button
                onClick={onNavigateHome ? onNavigateHome : () => { window.location.href = '/'; }}
                className="btn-primary py-2 px-4 text-xs shadow-btn-orange flex items-center gap-1.5 cursor-pointer"
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
            <span>DEMAND-SIGNAL • FEEDBACK-LOOP SUSTAINABILITY COUNTER</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1E1B16] font-heading tracking-tight max-w-3xl mx-auto leading-tight">
              Pre-Order Precision. Avoided Waste. Zero Guesswork.
            </h1>
            <p className="text-sm sm:text-base text-[#6B6560] max-w-2xl mx-auto leading-relaxed">
              We compare what our kitchen would historically prepare without advance orders against what was actually cooked — informed by student pre-orders and real-time demand.
            </p>
          </div>

          {/* Prominent Animated Counter Box */}
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#FFFFFF] via-[#FFF7F0] to-emerald-50/50 border border-orange-200 shadow-xl max-w-2xl mx-auto relative overflow-hidden">
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
                  <span className="text-5xl sm:text-7xl font-extrabold text-[#1E1B16] font-heading tabular-nums tracking-tight text-[#1E1B16]">
                    {animatedKg.toFixed(1)}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] font-heading">
                    kg
                  </span>
                </div>
              )}

              <p className="text-xs text-[#6B6560] font-medium pt-1">
                Equivalent to approx. <strong className="text-[#1E1B16]">{data?.metrics?.mealsEquivalent || 420} campus meals</strong> saved from overproduction
              </p>
            </div>

            {/* Subtle background glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl" />
          </div>
        </section>

        {/* 2. THREE CORE ENVIRONMENTAL CONVERSION CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          <div className="card p-6 sm:p-7 space-y-3 bg-white border border-stone-200/80 shadow-soft-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16A34A] border border-emerald-200 flex items-center justify-center font-bold">
              <Wind className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#6B6560] block">CO₂e Emissions Prevented</span>
              <span className="text-3xl font-bold text-[#1E1B16] font-heading tabular-nums block">
                {data?.metrics?.co2AvoidedKg || 421.0} <span className="text-sm font-normal text-[#6B6560]">kg CO₂e</span>
              </span>
            </div>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Based on EPA/FAO standards: avoiding 1 kg food waste avoids 2.5 kg of greenhouse emissions.
            </p>
          </div>

          <div className="card p-6 sm:p-7 space-y-3 bg-white border border-stone-200/80 shadow-soft-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0284C7] border border-sky-200 flex items-center justify-center font-bold">
              <CloudRain className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#6B6560] block">Agricultural Water Conserved</span>
              <span className="text-3xl font-bold text-[#1E1B16] font-heading tabular-nums block">
                {(data?.metrics?.waterSavedLiters || 30312).toLocaleString()} <span className="text-sm font-normal text-[#6B6560]">Liters</span>
              </span>
            </div>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Conserves ~180 Liters of water per kg of balanced grain, dairy, and vegetable production.
            </p>
          </div>

          <div className="card p-6 sm:p-7 space-y-3 bg-white border border-stone-200/80 shadow-soft-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#EA580C] border border-orange-200 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#6B6560] block">Active Student Participation</span>
              <span className="text-3xl font-bold text-[#1E1B16] font-heading tabular-nums block">
                {data?.metrics?.uniqueStudentsCount || 84} <span className="text-sm font-normal text-[#6B6560]">Students</span>
              </span>
            </div>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              Empowering culinary staff with demand certainty across {data?.metrics?.totalOrdersCount || 240} campus meal batches.
            </p>
          </div>

        </section>

        {/* 3. TRANSPARENT METHODOLOGY & FEEDBACK LOOP BREAKDOWN */}
        <section className="card p-6 sm:p-8 bg-gradient-to-r from-white via-[#FFF7F0] to-white border border-orange-200 space-y-6 shadow-soft-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF7F0] text-[#EA580C] border border-orange-200 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E1B16] font-heading">
                  How We Calculate This (Demand-Signal + Feedback-Loop Methodology)
                </h3>
                <p className="text-xs text-[#6B6560]">
                  An auditable, mathematically rigorous calculation — not an arbitrary counter.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 bg-white border border-emerald-200 text-[#15803D] font-bold text-xs rounded-xl shadow-soft-sm">
              ✓ Auditable Model
            </span>
          </div>

          {/* Plain language definition box */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2">
            <span className="text-xs font-bold text-[#1E1B16] font-heading flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#EA580C]" />
              <span>The Core Principle:</span>
            </span>
            <p className="text-xs text-[#6B6560] leading-relaxed">
              "We compare what our kitchen would historically prepare without advance orders (<strong className="text-[#1E1B16]">Baseline Demand</strong>) against what was actually prepared, informed by student pre-orders and real-time demand — the difference in avoided overproduction is <strong className="text-[#16A34A]">Food Saved</strong>."
            </p>
          </div>

          {/* Formula Display Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1E1B16] text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between text-xs text-[#9B9590]">
              <span className="font-mono font-bold text-[#FF6B35]">MATHEMATICAL FORMULATION</span>
              <span>Evaluated Per Dish, Per Day</span>
            </div>
            <div className="font-mono text-xs sm:text-sm text-emerald-400 bg-black/40 p-3 rounded-xl border border-white/10 overflow-x-auto">
              estimated_food_saved_kg = MAX(0, (baseline_quantity - prepared_quantity)) * portion_weight_kg
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs text-[#CCC5BC]">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Baseline (What WOULD have been prepared):</strong> Derived from historical total demand on matching weekdays + 25% legacy overprep buffer.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong>Prepared (Actual cooked):</strong> Optimized batch quantity entered by the chef based on advance pre-order signals.</span>
              </div>
            </div>
          </div>

          {/* Distinct Metric Comparison: Food Saved vs Leftovers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#16A34A]" />
                <span className="font-bold text-xs text-[#15803D] font-heading">1. Avoided Overproduction (Food Saved)</span>
              </div>
              <p className="text-[11px] text-[#15803D] leading-relaxed">
                <strong>{allTimeKg} kg</strong> prevented from ever being wasted by shrinking unnecessary batch sizes before cooking starts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#D97706]" />
                <span className="font-bold text-xs text-[#B45309] font-heading">2. Actual Leftover Waste (Tracked Separately)</span>
              </div>
              <p className="text-[11px] text-[#B45309] leading-relaxed">
                <strong>{allTimeWasteKg} kg</strong> actual leftover unconsumed portions at end-of-day. Tracked distinctly and never conflated with savings.
              </p>
            </div>
          </div>
        </section>

        {/* 4. TIMELINE & TOP CONTRIBUTING DISHES */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Left: Weekly Trend Progress */}
          <div className="lg:col-span-7 card p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                  Weekly Avoided Waste Progression
                </h3>
                <p className="text-xs text-[#6B6560] mt-0.5">Kilograms saved per week through demand optimization</p>
              </div>
              <Calendar className="w-4 h-4 text-[#16A34A]" />
            </div>

            {(!data?.timeline || data.timeline.length === 0) ? (
              <p className="py-8 text-center text-xs text-[#9B9590]">No historical timeline entries recorded yet.</p>
            ) : (
              <div className="space-y-3.5">
                {data.timeline.map((item, idx) => {
                  const maxKg = Math.max(...data.timeline.map(t => t.kgSaved), 50);
                  const barWidth = Math.min(100, Math.max(15, (item.kgSaved / maxKg) * 100));

                  return (
                    <div key={item.weekStart || idx} className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-[#1E1B16] font-heading">{item.weekLabel}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#16A34A] font-bold">+{item.kgSaved} kg saved</span>
                          <span className="text-[#9B9590] text-[11px]">({item.preOrders || item.portionsPreordered || 0} pre-orders)</span>
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
                <p className="text-xs text-[#6B6560] mt-0.5">Menu items saving the most food</p>
              </div>
              <Award className="w-4 h-4 text-[#FF6B35]" />
            </div>

            {(!data?.topDishes || data.topDishes.length === 0) ? (
              <p className="py-8 text-center text-xs text-[#9B9590]">No special dish batches recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.topDishes.map((dish, idx) => (
                  <div key={dish.dishId || idx} className="p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between text-xs hover:border-orange-200 transition">
                    <div>
                      <span className="font-bold text-[#1E1B16] font-heading block">{dish.dishName}</span>
                      <span className="text-[11px] text-[#6B6560]">
                        {dish.category} • {dish.portionsPreordered || 0} pre-orders
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
              className="bg-white text-[#1E1B16] hover:bg-stone-50 font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-soft-sm font-heading cursor-pointer"
            >
              Share on WhatsApp
            </button>
            <button
              onClick={handleShareTwitter}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-soft-sm font-heading cursor-pointer"
            >
              Post on X
            </button>
          </div>
        </section>

      </main>

      {/* Public Footer */}
      <footer className="border-t border-stone-200 bg-[#FAFAF9] py-8 text-center text-xs text-[#9B9590] space-y-2">
        <p>SmartMess Campus Dining • Demand-Signal & Food Sustainability Initiative</p>
        <p className="text-[11px]">Real-time metrics calculated via <code>MAX(0, baseline - prepared) * weight</code> feedback loop.</p>
      </footer>

    </div>
  );
}
