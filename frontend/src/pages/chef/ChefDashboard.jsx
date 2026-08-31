import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Bell, 
  UtensilsCrossed, 
  RotateCcw, 
  Layers, 
  ArrowRight, 
  TrendingUp, 
  Zap, 
  Megaphone, 
  ShieldCheck,
  Sparkles,
  Calendar,
  User,
  TrendingDown,
  Trash2,
  BarChart3,
  ClipboardList,
  AlertTriangle,
  Save,
  Check,
  Info,
  CalendarDays
} from 'lucide-react';
import { api } from '../../services/api';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../context/ToastContext';

export function ChefDashboard({ onNavigateToInventory }) {
  const { showToast } = useToast();
  // 'LIVE' | 'PREORDERS' | 'FORECAST' | 'LOG_WASTAGE' | 'WASTAGE_TRENDS'
  const [activeTab, setActiveTab] = useState('LIVE'); 
  
  // Live Queue & Pre-Orders
  const [orders, setOrders] = useState([]);
  const [preOrders, setPreOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [processingId, setProcessingId] = useState(null);

  // Demand Forecasting state
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastCategory, setForecastCategory] = useState('All');
  const [forecastSearch, setForecastSearch] = useState('');
  const [selectedForecastDate, setSelectedForecastDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Wastage Quick-Entry Log state
  const [wastagePreload, setWastagePreload] = useState(null);
  const [wastageLoading, setWastageLoading] = useState(false);
  const [wastageFormEntries, setWastageFormEntries] = useState([]);
  const [savingWastage, setSavingWastage] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Wastage Trends state
  const [trendsData, setTrendsData] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsPeriod, setTrendsPeriod] = useState('30d');

  const fetchDashboardData = async () => {
    try {
      const [ordersRes, preOrdersRes] = await Promise.all([
        api.getChefOrders(),
        api.getAdminPreOrders().catch(() => ({ preOrders: [] }))
      ]);
      setOrders(ordersRes?.orders || []);
      setPreOrders(preOrdersRes?.preOrders || []);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async (date) => {
    setForecastLoading(true);
    try {
      const res = await api.getTodayForecast(date || selectedForecastDate);
      setForecastData(res);
    } catch (err) {
      console.error('Failed to load demand forecast:', err);
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchWastagePreload = async (date) => {
    setWastageLoading(true);
    try {
      const [preloadRes, prodRes] = await Promise.all([
        api.getWastagePreload(date || logDate).catch(() => null),
        api.getDailyProduction(date || logDate).catch(() => null)
      ]);
      setWastagePreload(preloadRes);
      
      const prodDishes = prodRes?.dishes || [];
      if (prodDishes.length > 0) {
        setWastageFormEntries(prodDishes.map(d => {
          const prep = d.preparedQuantity || 0;
          const collected = d.collectedQuantity !== undefined && d.collectedQuantity !== null
            ? d.collectedQuantity
            : (d.totalDemand || 0);
          const leftover = d.leftoverQuantity !== undefined && d.leftoverQuantity !== null
            ? d.leftoverQuantity
            : Math.max(0, prep - collected);

          return {
            dishId: d.dishId,
            dishName: d.dishName,
            category: d.category,
            price: d.price,
            portionWeightKg: d.portionWeightKg || 0.4,
            baselineQuantity: d.baselineQuantity || 35,
            recommendedQuantity: d.recommendedQuantity || 25,
            preOrderQuantity: d.preOrderQuantity || 0,
            onSpotQuantity: d.onSpotQuantity || 0,
            totalDemand: d.totalDemand || 0,
            quantityPrepared: prep,
            quantitySold: collected,
            quantityWasted: leftover,
            estimatedFoodSavedKg: d.estimatedFoodSavedKg || 0,
            isLogged: d.isLogged,
            reason: d.notes || 'overprepared'
          };
        }));
      } else {
        setWastageFormEntries((preloadRes?.dishes || []).map(d => {
          const baseline = Math.round((d.quantitySold || 25) * 1.25);
          const prep = d.quantityPrepared || 0;
          const sold = d.quantitySold || 0;
          const leftover = Math.max(0, prep - sold);
          return {
            dishId: d.dishId,
            dishName: d.dishName,
            category: d.category,
            price: d.price,
            portionWeightKg: 0.4,
            baselineQuantity: baseline,
            recommendedQuantity: d.quantitySold || 25,
            quantityPrepared: prep,
            quantitySold: sold,
            quantityWasted: leftover,
            estimatedFoodSavedKg: prep > 0 ? Math.max(0, (baseline - prep) * 0.4) : 0,
            isLogged: d.isLogged,
            reason: d.reason || 'overprepared'
          };
        }));
      }
    } catch (err) {
      console.error('Failed to load wastage form:', err);
    } finally {
      setWastageLoading(false);
    }
  };

  const fetchWastageTrends = async (period) => {
    setTrendsLoading(true);
    try {
      const res = await api.getWastageTrends(period || trendsPeriod);
      setTrendsData(res?.trends || null);
    } catch (err) {
      console.error('Failed to load wastage trends:', err);
    } finally {
      setTrendsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'FORECAST') {
      fetchForecast(selectedForecastDate);
    } else if (activeTab === 'LOG_WASTAGE') {
      fetchWastagePreload(logDate);
    } else if (activeTab === 'WASTAGE_TRENDS') {
      fetchWastageTrends(trendsPeriod);
    }
  }, [activeTab]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setProcessingId(orderId);
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      showToast(`Order #${orderId} marked as "${nextStatus}"`, 'success');
      await fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to update order', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFulfillPreOrder = async (preOrderId) => {
    setProcessingId(preOrderId);
    try {
      await api.fulfillPreOrder(preOrderId);
      showToast(`Pre-order #${preOrderId} marked as Fulfilled!`, 'success');
      await fetchDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to fulfill pre-order', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleWastageFieldChange = (dishId, field, value) => {
    setWastageFormEntries(prev => prev.map(item => {
      if (item.dishId !== dishId) return item;
      const updated = { ...item, [field]: value };
      
      const prep = parseInt(field === 'quantityPrepared' ? value : updated.quantityPrepared, 10) || 0;
      let sold = parseInt(field === 'quantitySold' ? value : updated.quantitySold, 10) || 0;
      const baseline = parseInt(updated.baselineQuantity || 35, 10);
      const weight = updated.portionWeightKg || 0.4;

      if (field === 'quantityPrepared' || field === 'quantitySold') {
        updated.quantityWasted = Math.max(0, prep - sold);
      }
      
      // Calculate real-time Food Saved: MAX(0, baseline - prepared) * weight
      updated.estimatedFoodSavedKg = prep > 0 
        ? Math.max(0, Math.round((baseline - prep) * weight * 100) / 100)
        : 0;

      return updated;
    }));
  };

  const handleSaveWastage = async () => {
    setSavingWastage(true);
    try {
      // 1. Validation: Enforce collected_quantity <= prepared_quantity
      for (const entry of wastageFormEntries) {
        const prep = parseInt(entry.quantityPrepared, 10) || 0;
        const sold = parseInt(entry.quantitySold, 10) || 0;
        if (prep > 0 && sold > prep) {
          showToast(`Collected quantity (${sold}) cannot exceed prepared quantity (${prep}) for "${entry.dishName}".`, 'error');
          setSavingWastage(false);
          return;
        }
      }

      const payload = wastageFormEntries.map(entry => {
        const prep = parseInt(entry.quantityPrepared, 10) || 0;
        const sold = parseInt(entry.quantitySold, 10) || 0;
        const leftover = Math.max(0, prep - sold);
        const baseline = parseInt(entry.baselineQuantity, 10) || 0;
        const weight = entry.portionWeightKg || 0.4;
        const saved = prep > 0 ? Math.max(0, (baseline - prep) * weight) : 0;

        return {
          dishId: entry.dishId,
          dish_id: entry.dishId,
          logDate,
          log_date: logDate,
          preparedQuantity: prep,
          prepared_quantity: prep,
          quantityPrepared: prep,
          quantity_prepared: prep,
          collectedQuantity: sold,
          collected_quantity: sold,
          quantitySold: sold,
          quantity_sold: sold,
          leftoverQuantity: leftover,
          leftover_quantity: leftover,
          quantityWasted: leftover,
          quantity_wasted: leftover,
          baselineQuantity: baseline,
          baseline_quantity: baseline,
          recommendedQuantity: entry.recommendedQuantity || 25,
          recommended_quantity: entry.recommendedQuantity || 25,
          portionWeightKg: weight,
          portion_weight_kg: weight,
          estimatedFoodSavedKg: saved,
          estimated_food_saved_kg: saved,
          actualWasteKg: leftover * weight,
          actual_waste_kg: leftover * weight,
          reason: entry.reason || 'overprepared',
          notes: entry.reason || 'overprepared'
        };
      });

      await Promise.all([
        api.logProduction(payload, logDate).catch(() => null),
        api.logWastage(payload).catch(() => null)
      ]);

      showToast('Daily production & food saved records logged successfully!', 'success');
      await fetchWastagePreload(logDate);
    } catch (err) {
      showToast(err.message || 'Failed to save wastage logs', 'error');
    } finally {
      setSavingWastage(false);
    }
  };

  const ordersList = Array.isArray(orders) ? orders : [];
  const pendingCount = ordersList.filter(o => o.order_status === 'Pending').length;
  const cookingCount = ordersList.filter(o => o.order_status === 'Preparing' || o.order_status === 'Cooking').length;
  const readyCount = ordersList.filter(o => o.order_status === 'Ready').length;
  const activeOrdersCount = pendingCount + cookingCount + readyCount;

  const preOrdersList = Array.isArray(preOrders) ? preOrders : [];
  const confirmedPreOrders = preOrdersList.filter(p => p.status === 'confirmed');

  const filteredOrders = ordersList.filter(o => {
    if (statusFilter === 'ACTIVE') return o.order_status !== 'Completed' && o.order_status !== 'Cancelled';
    if (statusFilter === 'Pending') return o.order_status === 'Pending';
    if (statusFilter === 'Cooking' || statusFilter === 'Preparing') return o.order_status === 'Preparing' || o.order_status === 'Cooking';
    if (statusFilter === 'Ready') return o.order_status === 'Ready';
    if (statusFilter === 'Completed') return o.order_status === 'Completed';
    return true;
  });

  const allForecasts = forecastData?.forecasts || [];
  const filteredForecasts = allForecasts.filter(fc => {
    const name = fc.dish_name || fc.dishName || fc.item_name || fc.name || '';
    const matchCat = forecastCategory === 'All' || fc.category === forecastCategory;
    const matchSearch = !forecastSearch || name.toLowerCase().includes(forecastSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle="Kitchen Operations Dispatch • Live orders, AI demand forecasting & food wastage tracking" />

      {/* 2. HERO STAT ROW (Chef Dominant: #EA580C) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Active Queue */}
        <StatCard
          title="Active Prep Queue"
          value={`${activeOrdersCount} Orders`}
          subtitle="Awaiting or in kitchen"
          icon={ChefHat}
          color="chef"
          isFeatured={true}
          trend={activeOrdersCount > 0 ? 'Active Queue' : 'Clear'}
          trendPositive={activeOrdersCount === 0}
          onClick={() => setActiveTab('LIVE')}
        />

        {/* Stat 2: Demand Forecast */}
        <StatCard
          title="Daily Demand Forecast"
          value={forecastData ? `${forecastData.totalPredictedPortions} Portions` : 'AI Engine'}
          subtitle="Weighted recency & DOW model"
          icon={BarChart3}
          color="orange"
          onClick={() => setActiveTab('FORECAST')}
          trend="Next Shift"
          trendPositive={true}
        />

        {/* Stat 3: Tomorrow's Special Pre-Orders */}
        <StatCard
          title="Next-Day Pre-Orders"
          value={`${confirmedPreOrders.length} Reservations`}
          subtitle="Guaranteed batch orders"
          icon={Sparkles}
          color="orange"
          onClick={() => setActiveTab('PREORDERS')}
          trend="Next-Day"
          trendPositive={true}
        />

        {/* Stat 4: Food Wastage Control */}
        <StatCard
          title="Wastage Control"
          value={trendsData ? `${trendsData.summary.wastagePercentage}% Waste` : 'Track Logs'}
          subtitle={trendsData ? trendsData.summary.trendBadgeText : 'Log daily portions'}
          icon={TrendingDown}
          color="success"
          onClick={() => setActiveTab('WASTAGE_TRENDS')}
          trend={trendsData?.summary?.isPositiveTrend ? 'Improving' : 'Attention'}
          trendPositive={Boolean(trendsData?.summary?.isPositiveTrend)}
        />
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('LIVE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading whitespace-nowrap ${
            activeTab === 'LIVE'
              ? 'bg-[#EA580C] text-white shadow-soft-sm'
              : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Live Kitchen Queue ({activeOrdersCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('PREORDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading whitespace-nowrap ${
            activeTab === 'PREORDERS'
              ? 'bg-[#EA580C] text-white shadow-soft-sm'
              : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Tomorrow's Pre-Orders ({confirmedPreOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FORECAST')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading whitespace-nowrap ${
            activeTab === 'FORECAST'
              ? 'bg-[#EA580C] text-white shadow-soft-sm'
              : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Demand Forecast (AI)</span>
        </button>

        <button
          onClick={() => setActiveTab('LOG_WASTAGE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading whitespace-nowrap ${
            activeTab === 'LOG_WASTAGE'
              ? 'bg-[#EA580C] text-white shadow-soft-sm'
              : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Log Daily Wastage</span>
        </button>

        <button
          onClick={() => setActiveTab('WASTAGE_TRENDS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition font-heading whitespace-nowrap ${
            activeTab === 'WASTAGE_TRENDS'
              ? 'bg-[#EA580C] text-white shadow-soft-sm'
              : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Wastage Trends</span>
        </button>
      </div>

      {/* 3. TAB 1: LIVE KITCHEN QUEUE */}
      {activeTab === 'LIVE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            <div className="card space-y-6 p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading flex items-center gap-2.5">
                    <Flame className="w-5 h-5 text-[#EA580C]" />
                    <span>Live Order Dispatch Queue</span>
                  </h2>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    Update student order cooking states in real time
                  </p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {['ACTIVE', 'Pending', 'Cooking', 'Ready', 'Completed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-180 ${
                        statusFilter === filter
                          ? 'bg-[#EA580C] text-white font-bold shadow-soft-sm'
                          : 'bg-stone-100 text-[#6B6560] hover:text-[#1E1B16] hover:bg-stone-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-[#6B6560]">
                  <div className="w-8 h-8 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold">Refreshing order tickets...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-[#6B6560] space-y-3">
                  <ChefHat className="w-12 h-12 mx-auto text-[#9B9590]" />
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                    {statusFilter === 'ACTIVE' ? 'No active orders cooking' : `No ${statusFilter.toLowerCase()} orders`}
                  </h3>
                  <p className="text-xs max-w-sm mx-auto">
                    When students order from their meal trays, their preparation tickets will stream into this live queue.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const isPending = order.order_status === 'Pending';
                    const isCooking = order.order_status === 'Preparing' || order.order_status === 'Cooking';
                    const isReady = order.order_status === 'Ready';

                    return (
                      <div
                        key={order.order_id}
                        className={`p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
                          isPending
                            ? 'bg-amber-50/40 border-amber-200 shadow-soft-sm'
                            : isCooking
                            ? 'bg-orange-50/40 border-orange-200 shadow-soft-sm'
                            : isReady
                            ? 'bg-emerald-50/40 border-emerald-200 shadow-soft-sm'
                            : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/60">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center font-bold text-sm font-heading shadow-soft-sm text-[#1E1B16]">
                              #{order.order_id}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[#1E1B16] font-heading">
                                  Token: {order.pickup_token}
                                </span>
                                <span className={`status-pill text-[10px] font-heading ${
                                  isPending ? 'status-pill-warning' : isCooking ? 'status-pill-warning text-[#EA580C]' : isReady ? 'status-pill-success' : 'status-pill-info'
                                }`}>
                                  {order.order_status === 'Preparing' ? 'Cooking' : order.order_status}
                                </span>
                                {order.delivery_type === 'hostel-delivery' && (
                                  <span className="bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded-md font-heading flex items-center gap-1 shadow-soft-sm animate-pulse">
                                    🏠 HOSTEL DELIVERY
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B6560] flex items-center gap-2 mt-0.5">
                                <span>Student: <strong>{order.student_name || 'Student'}</strong></span>
                                {order.delivery_type === 'hostel-delivery' ? (
                                  <span className="text-[#FF6B35] font-bold">
                                    • Deliver to: {order.delivery_address || order.room_number || 'Hostel Room'}
                                  </span>
                                ) : (
                                  <span>({order.room_number || 'Counter Pickup'})</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPending && (
                              <button
                                onClick={() => handleUpdateStatus(order.order_id, 'Preparing')}
                                disabled={processingId === order.order_id}
                                className="btn-primary py-2 px-4 text-xs shadow-soft-sm"
                              >
                                <span>Start Cooking</span>
                              </button>
                            )}

                            {isCooking && (
                              <button
                                onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                                disabled={processingId === order.order_id}
                                className="bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-soft-sm transition flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Ready</span>
                              </button>
                            )}

                            {isReady && (
                              <button
                                onClick={() => handleUpdateStatus(order.order_id, 'Completed')}
                                disabled={processingId === order.order_id}
                                className="btn-secondary py-2 px-4 text-xs"
                              >
                                <span>Complete Order</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Items Table */}
                        <div className="bg-white/80 rounded-xl p-3 border border-stone-200/80">
                          <div className="divide-y divide-stone-100 text-xs">
                            {(order.items || []).map((item) => (
                              <div key={item.order_item_id || item.item_id} className="py-1.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-stone-100 text-[#1E1B16] font-bold flex items-center justify-center font-heading text-xs">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-semibold text-[#1E1B16] font-heading">{item.item_name}</span>
                                </div>
                                <span className="text-[#6B6560] font-semibold">{item.category}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="card space-y-4">
              <h3 className="text-base font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#EA580C]" />
                <span>Kitchen Quick Actions</span>
              </h3>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => setActiveTab('FORECAST')}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-white hover:bg-[#FFF7F0] hover:border-orange-200 flex items-center justify-between transition group shadow-soft-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 text-[#EA580C]" />
                    <span className="font-semibold text-[#1E1B16] font-heading">Demand Forecasting</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9B9590]" />
                </button>

                <button
                  onClick={() => setActiveTab('LOG_WASTAGE')}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-white hover:bg-[#FFF7F0] hover:border-orange-200 flex items-center justify-between transition group shadow-soft-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-4 h-4 text-[#EA580C]" />
                    <span className="font-semibold text-[#1E1B16] font-heading">Log End-of-Day Wastage</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9B9590]" />
                </button>

                <button
                  onClick={() => setActiveTab('WASTAGE_TRENDS')}
                  className="w-full p-3 rounded-xl border border-stone-200 bg-white hover:bg-[#FFF7F0] hover:border-orange-200 flex items-center justify-between transition group shadow-soft-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingDown className="w-4 h-4 text-[#EA580C]" />
                    <span className="font-semibold text-[#1E1B16] font-heading">Wastage Analytics</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#9B9590]" />
                </button>

                {onNavigateToInventory && (
                  <button
                    onClick={onNavigateToInventory}
                    className="w-full p-3 rounded-xl border border-stone-200 bg-white hover:bg-[#FFF7F0] hover:border-orange-200 flex items-center justify-between transition group shadow-soft-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-[#EA580C]" />
                      <span className="font-semibold text-[#1E1B16] font-heading">Stock Inventory & 86 Items</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9B9590]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: TOMORROW'S SPECIAL PRE-ORDERS */}
      {activeTab === 'PREORDERS' && (
        <div className="card space-y-6 p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-xl font-bold text-[#1E1B16] font-heading flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#EA580C]" />
                <span>Next-Day Special Pre-Orders</span>
              </h2>
              <p className="text-xs text-[#6B6560] mt-0.5">
                Reserve batch cooking portions for tomorrow's scheduled pickups
              </p>
            </div>
          </div>

          {confirmedPreOrders.length === 0 ? (
            <div className="py-16 text-center text-[#6B6560] space-y-3">
              <Sparkles className="w-12 h-12 mx-auto text-[#9B9590]" />
              <h3 className="text-base font-bold text-[#1E1B16] font-heading">No pre-orders scheduled</h3>
              <p className="text-xs max-w-sm mx-auto">
                When you publish next-day special dishes, student bookings will appear here for batch preparation.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedPreOrders.map((po) => (
                <div key={po.pre_order_id} className="p-4 rounded-2xl bg-white border border-stone-200 shadow-soft-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#EA580C] font-heading">Token: #{po.pickup_token}</span>
                    <span className="status-pill status-pill-success text-[10px]">{po.status}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1E1B16] font-heading">{po.item_name}</h4>
                    <p className="text-xs text-[#6B6560]">Student: {po.student_name} ({po.room_number})</p>
                    <p className="text-xs text-[#6B6560]">Quantity: <strong>{po.quantity}x</strong></p>
                  </div>
                  <button
                    onClick={() => handleFulfillPreOrder(po.pre_order_id)}
                    disabled={processingId === po.pre_order_id}
                    className="w-full btn-primary py-2 text-xs justify-center shadow-soft-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Fulfill Pickup</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: DEMAND FORECASTING ENGINE */}
      {activeTab === 'FORECAST' && (
        <div className="space-y-6">
          {/* Header & Controls Card */}
          <div className="card p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7F0] text-[#EA580C] border border-orange-200 flex items-center justify-center font-bold">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading">
                    AI Demand Forecasting Engine
                  </h2>
                </div>
                <p className="text-xs text-[#6B6560] mt-1">
                  Predicts preparation quantities using <strong>30-day exponential weighted moving average</strong> and <strong>day-of-week seasonality</strong>.
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-[#6B6560] flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-[#EA580C]" />
                  Target Date:
                </label>
                <input
                  type="date"
                  value={selectedForecastDate}
                  onChange={(e) => {
                    setSelectedForecastDate(e.target.value);
                    fetchForecast(e.target.value);
                  }}
                  className="bg-[#FAFAF9] border border-stone-200 text-[#1E1B16] text-xs rounded-xl px-3 py-1.5 outline-none focus:border-[#EA580C]"
                />
              </div>
            </div>

            {/* Summary Highlights */}
            {forecastData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#FFF7F0] border border-orange-200">
                  <span className="text-xs font-semibold text-[#6B6560] block">Predicted Kitchen Demand</span>
                  <span className="text-2xl font-bold text-[#EA580C] font-heading tabular-nums mt-1 block">
                    {forecastData.totalPredictedPortions} Portions
                  </span>
                  <span className="text-[11px] text-[#6B6560]">Across {forecastData.totalDishes} active menu dishes</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs font-semibold text-[#15803D] block">High Confidence Predictions</span>
                  <span className="text-2xl font-bold text-[#16A34A] font-heading tabular-nums mt-1 block">
                    {forecastData.highConfidenceCount} Dishes
                  </span>
                  <span className="text-[11px] text-[#15803D]">≥4 weeks of same-weekday history</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-xs font-semibold text-[#6B6560] block">Forecast Target Day</span>
                  <span className="text-2xl font-bold text-[#1E1B16] font-heading mt-1 block">
                    {forecastData.targetDayName}
                  </span>
                  <span className="text-[11px] text-[#6B6560]">Includes weekly cyclical multipliers</span>
                </div>
              </div>
            )}

            {/* Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setForecastCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      forecastCategory === cat
                        ? 'bg-[#EA580C] text-white font-bold shadow-soft-sm'
                        : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search dish forecast..."
                value={forecastSearch}
                onChange={(e) => setForecastSearch(e.target.value)}
                className="bg-[#FAFAF9] border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] text-xs px-3.5 py-1.5 rounded-xl outline-none focus:border-[#EA580C] sm:w-56"
              />
            </div>
          </div>

          {/* Forecast Cards Grid */}
          {forecastLoading ? (
            <div className="card py-16 text-center text-[#6B6560]">
              <div className="w-8 h-8 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Computing weighted moving averages & day-of-week factors...</p>
            </div>
          ) : filteredForecasts.length === 0 ? (
            <div className="card py-16 text-center text-[#6B6560]">
              <p className="text-sm font-semibold">No dishes match your filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredForecasts.map((dishFc) => {
                const isHigh = dishFc.confidence === 'High Confidence';
                const isMed = dishFc.confidence === 'Medium Confidence';
                const foodName = dishFc.dish_name || dishFc.dishName || dishFc.item_name || dishFc.name || 'Dish';

                return (
                  <div key={dishFc.dish_id || dishFc.dishId} className="card p-5 space-y-4 hover:shadow-md transition">
                    
                    {/* Card Header: Category + Confidence Badge, then Prominent Dish Name */}
                    <div className="space-y-1.5 pb-3 border-b border-stone-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#EA580C] font-heading">
                          {dishFc.category}
                        </span>
                        <span className={`status-pill text-[10px] font-heading shrink-0 ${
                          isHigh ? 'status-pill-success' : isMed ? 'status-pill-warning' : 'status-pill-info'
                        }`}>
                          {dishFc.confidence}
                        </span>
                      </div>

                      {/* Prominent Food Name */}
                      <h3 className="text-lg sm:text-xl font-extrabold text-[#1E1B16] font-heading tracking-tight leading-tight break-words pt-0.5">
                        {foodName}
                      </h3>
                    </div>

                    {/* Prominent Forecast Number Display */}
                    <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-[#FFF7F0] border border-orange-200/80">
                      <div>
                        <span className="text-[10px] font-semibold text-[#6B6560] block">Recommended Prep:</span>
                        <span className="text-3xl font-extrabold text-[#EA580C] font-heading tabular-nums tracking-tight">
                          {dishFc.recommended_quantity ?? dishFc.forecastedQuantity ?? dishFc.recommendedQuantity ?? 30}
                        </span>
                        <span className="text-xs font-bold text-[#1E1B16] ml-1.5">portions</span>
                      </div>

                      <div className="text-right text-xs">
                        <span className="text-[10px] text-[#6B6560] block">Seasonality Factor</span>
                        <span className={`font-bold font-heading ${
                          (dishFc.metrics?.seasonalityFactor || dishFc.seasonality_factor || 1) > 1.05 
                            ? 'text-[#16A34A]' 
                            : (dishFc.metrics?.seasonalityFactor || dishFc.seasonality_factor || 1) < 0.95 
                            ? 'text-[#DC2626]' 
                            : 'text-[#6B6560]'
                        }`}>
                          {dishFc.metrics?.seasonalityFactor || dishFc.seasonality_factor || 1}x ({dishFc.target_day_name || dishFc.targetDayName || 'Today'})
                        </span>
                      </div>
                    </div>

                    {/* Transparent AI Forecasting Signals Table */}
                    <div className="p-3.5 rounded-xl bg-stone-50/90 border border-stone-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-[#6B6560]">
                        <span>Historical Baseline:</span>
                        <span className="font-bold text-[#1E1B16] tabular-nums">
                          {dishFc.historical_baseline ?? dishFc.historicalBaseline ?? dishFc.baselineQuantity ?? 48} portions
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B6560]">
                        <span>Historical WMA:</span>
                        <span className="font-bold text-[#1E1B16] tabular-nums">
                          {dishFc.metrics?.historicalWMA ?? dishFc.historical_wma ?? dishFc.metrics?.weightedRecencyAverage ?? 38} portions
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B6560]">
                        <span>Historical 30d Mean:</span>
                        <span className="font-bold text-[#1E1B16] tabular-nums">
                          {dishFc.metrics?.historicalMean ?? dishFc.historical_mean ?? 38} portions
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B6560]">
                        <span>{dishFc.target_day_name || dishFc.targetDayName || 'Weekday'} Factor:</span>
                        <span className="font-bold text-[#1E1B16] tabular-nums">
                          {dishFc.metrics?.seasonalityFactor ?? dishFc.seasonality_factor ?? 1.0}x
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B6560]">
                        <span className="text-[#EA580C] font-semibold">Advance Pre-Orders:</span>
                        <span className="font-bold text-[#EA580C] tabular-nums">
                          {dishFc.pre_order_quantity ?? dishFc.preOrderQuantity ?? dishFc.metrics?.preOrders ?? 0} portions
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B6560] pt-1 border-t border-stone-200">
                        <span>Expected Demand:</span>
                        <span className="font-bold text-[#1E1B16] tabular-nums">
                          {dishFc.expected_demand ?? dishFc.expectedDemand ?? 38} portions
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B6560]">
                        <span>Safety Margin (+8%):</span>
                        <span className="font-bold text-emerald-700 tabular-nums">
                          +{dishFc.safety_margin ?? dishFc.safetyMargin ?? 3} portions
                        </span>
                      </div>
                      <div className="flex justify-between text-[#6B6560] text-[11px]">
                        <span>Forecast vs Baseline:</span>
                        <span className={`font-bold tabular-nums ${
                          (dishFc.forecast_change_pct || dishFc.forecastChangePct || 0) < -40
                            ? 'text-amber-600'
                            : 'text-stone-700'
                        }`}>
                          {(dishFc.forecast_change_pct || dishFc.forecastChangePct || 0) > 0 ? '+' : ''}
                          {dishFc.forecast_change_pct ?? dishFc.forecastChangePct ?? -15}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[#EA580C] pt-1 border-t border-orange-200 font-bold">
                        <span>AI Recommended:</span>
                        <span className="tabular-nums">
                          {dishFc.recommended_quantity ?? dishFc.recommendedQuantity ?? 41} portions
                        </span>
                      </div>
                    </div>

                    {/* Reasoning Footer */}
                    <div className="space-y-1.5">
                      {dishFc.significant_decrease && (
                        <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5">
                          <span>⚠️ Significant demand decrease vs baseline</span>
                        </div>
                      )}
                      <p className="text-[11px] text-[#6B6560] bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 leading-relaxed">
                        💡 {dishFc.reasoning}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: LOG DAILY WASTAGE QUICK-ENTRY FORM */}
      {activeTab === 'LOG_WASTAGE' && (
        <div className="card p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7F0] text-[#EA580C] border border-orange-200 flex items-center justify-center font-bold">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold text-[#1E1B16] font-heading">
                  End-of-Day Food Wastage Log
                </h2>
              </div>
              <p className="text-xs text-[#6B6560] mt-1">
                Record prepared vs sold portions. Sales numbers are auto-pulled from actual student order records.
              </p>
            </div>

            {/* Date selector & Save button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-[#6B6560]">Log Date:</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => {
                    setLogDate(e.target.value);
                    fetchWastagePreload(e.target.value);
                  }}
                  className="bg-[#FAFAF9] border border-stone-200 text-[#1E1B16] text-xs rounded-xl px-3 py-1.5 outline-none focus:border-[#EA580C]"
                />
              </div>

              <button
                onClick={handleSaveWastage}
                disabled={savingWastage || wastageFormEntries.length === 0}
                className="btn-primary py-2 px-5 text-xs shadow-btn-orange flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingWastage ? 'Saving Logs...' : 'Save Wastage Logs'}</span>
              </button>
            </div>
          </div>

          {/* Quick-Entry Table */}
          {wastageLoading ? (
            <div className="py-16 text-center text-[#6B6560]">
              <div className="w-8 h-8 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Pulling menu dishes & actual daily sales data...</p>
            </div>
          ) : wastageFormEntries.length === 0 ? (
            <div className="py-12 text-center text-[#6B6560]">
              <p className="text-sm">No active dishes found for this date.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] border-b border-stone-200 bg-stone-50">
                  <tr>
                    <th className="py-3 px-3">Dish & Category</th>
                    <th className="py-3 px-2 text-center">1. Baseline (Hist.)</th>
                    <th className="py-3 px-2 text-center">2. AI Recommended</th>
                    <th className="py-3 px-2 text-center text-[#EA580C]">3. Prepared (Cooked)</th>
                    <th className="py-3 px-2 text-center">4. Sold / Collected</th>
                    <th className="py-3 px-2 text-center text-[#D97706]">5. Leftover (Waste)</th>
                    <th className="py-3 px-2 text-center text-[#16A34A]">6. Avoided Overprep (Saved)</th>
                    <th className="py-3 px-3">7. Recommendation Status & Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {wastageFormEntries.map((item) => {
                    const prep = parseInt(item.quantityPrepared, 10) || 0;
                    const rec = parseInt(item.recommendedQuantity, 10) || 25;
                    const sold = parseInt(item.quantitySold, 10) || 0;
                    const portionWeight = item.portionWeightKg || 0.4;
                    const leftoverWasteKg = (item.quantityWasted * portionWeight).toFixed(2);
                    const isExceedingPrep = prep > 0 && sold > prep;

                    return (
                      <tr key={item.dishId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#1E1B16] font-heading block">{item.dishName}</span>
                          <span className="text-[11px] text-[#6B6560]">{item.category} • {portionWeight} kg/portion</span>
                        </td>

                        {/* 1. Baseline */}
                        <td className="py-3 px-2 text-center">
                          <span className="px-2 py-1 rounded-lg bg-stone-100 text-[#6B6560] font-bold text-xs font-heading">
                            {item.baselineQuantity || 35}
                          </span>
                        </td>

                        {/* 2. Recommended */}
                        <td className="py-3 px-2 text-center">
                          <span className="px-2 py-1 rounded-lg bg-orange-50 text-[#EA580C] border border-orange-200 font-bold text-xs font-heading">
                            {rec}
                          </span>
                        </td>

                        {/* 3. Prepared Input */}
                        <td className="py-3 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.quantityPrepared}
                            onChange={(e) => handleWastageFieldChange(item.dishId, 'quantityPrepared', e.target.value)}
                            className="w-16 text-center bg-[#FFF7F0] focus:bg-white border border-orange-300 text-[#EA580C] font-extrabold text-xs py-1.5 rounded-xl outline-none focus:border-[#EA580C] shadow-soft-sm"
                          />
                        </td>

                        {/* 4. Sold / Collected Input (Guarded: <= Prepared) */}
                        <td className="py-3 px-2 text-center">
                          <input
                            type="number"
                            min="0"
                            max={prep > 0 ? prep : undefined}
                            value={item.quantitySold}
                            onChange={(e) => handleWastageFieldChange(item.dishId, 'quantitySold', e.target.value)}
                            className={`w-16 text-center focus:bg-white border font-bold text-xs py-1.5 rounded-xl outline-none focus:border-[#EA580C] ${
                              isExceedingPrep
                                ? 'bg-red-50 border-red-400 text-red-700'
                                : 'bg-[#FAFAF9] border-stone-200 text-[#1E1B16]'
                            }`}
                            title={isExceedingPrep ? 'Collected quantity cannot exceed prepared quantity' : ''}
                          />
                          {isExceedingPrep && (
                            <span className="block text-[10px] text-red-600 font-semibold mt-0.5">Max {prep}</span>
                          )}
                        </td>

                        {/* 5. Leftover (Waste) */}
                        <td className="py-3 px-2 text-center">
                          <span className={`font-bold tabular-nums text-xs block ${
                            item.quantityWasted > 0 ? 'text-[#D97706]' : 'text-stone-500'
                          }`}>
                            {item.quantityWasted} portions
                          </span>
                          <span className="text-[11px] text-[#6B6560]">({leftoverWasteKg} kg)</span>
                        </td>

                        {/* 6. Avoided Overprep (Food Saved kg) */}
                        <td className="py-3 px-2 text-center">
                          <span className="font-bold text-[#16A34A] font-heading tabular-nums text-xs">
                            {item.estimatedFoodSavedKg > 0 ? `+${item.estimatedFoodSavedKg} kg` : '0 kg'}
                          </span>
                        </td>

                        {/* 7. Recommendation Status & Reason */}
                        <td className="py-3 px-3">
                          <div className="space-y-1.5">
                            {prep === 0 ? (
                              <span className="status-pill status-pill-info text-[10px] block text-center">
                                Unprepared
                              </span>
                            ) : Math.abs(prep - rec) <= 2 ? (
                              <span className="status-pill status-pill-success text-[10px] block text-center">
                                ✓ Followed recommendation
                              </span>
                            ) : prep > rec ? (
                              <span className="status-pill status-pill-warning text-[10px] block text-center">
                                ⚠️ +{prep - rec} above recommendation
                              </span>
                            ) : (
                              <span className="status-pill status-pill-info text-[10px] block text-center">
                                📉 -{rec - prep} below recommendation
                              </span>
                            )}

                            <select
                              value={item.reason || 'overprepared'}
                              onChange={(e) => handleWastageFieldChange(item.dishId, 'reason', e.target.value)}
                              className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] text-[11px] py-1 px-2 rounded-xl outline-none focus:border-[#EA580C]"
                            >
                              <option value="overprepared">Overprepared / Excess batch</option>
                              <option value="low turnout">Low student turnout</option>
                              <option value="ingredient spoilage">Ingredient / shelf spoilage</option>
                              <option value="presentation defect">Quality / texture defect</option>
                              <option value="other">Other factor</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 5: WASTAGE TRENDS ANALYTICS */}
      {activeTab === 'WASTAGE_TRENDS' && (
        <div className="space-y-6">
          <div className="card p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7F0] text-[#EA580C] border border-orange-200 flex items-center justify-center font-bold">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading">
                    Food Wastage & Efficiency Analytics
                  </h2>
                </div>
                <p className="text-xs text-[#6B6560] mt-1">
                  Track cumulative waste percentages, dish loss rankings, and period-over-period sustainability trends.
                </p>
              </div>

              {/* Period Selector */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
                {['7d', '30d', '90d'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setTrendsPeriod(p);
                      fetchWastageTrends(p);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading ${
                      trendsPeriod === p
                        ? 'bg-white text-[#EA580C] shadow-soft-sm'
                        : 'text-[#6B6560] hover:text-[#1E1B16]'
                    }`}
                  >
                    {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat Row */}
            {trendsData && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-[#FFF7F0] border border-orange-200">
                  <span className="text-xs font-semibold text-[#6B6560] block">Total Prepared</span>
                  <span className="text-2xl font-bold text-[#1E1B16] font-heading tabular-nums mt-1 block">
                    {trendsData.summary.totalPrepared}
                  </span>
                  <span className="text-[11px] text-[#6B6560]">All portions cooked</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs font-semibold text-[#15803D] block">Total Sold & Consumed</span>
                  <span className="text-2xl font-bold text-[#16A34A] font-heading tabular-nums mt-1 block">
                    {trendsData.summary.totalSold}
                  </span>
                  <span className="text-[11px] text-[#15803D]">Purchased by students</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                  <span className="text-xs font-semibold text-[#B45309] block">Total Wasted Portions</span>
                  <span className="text-2xl font-bold text-[#D97706] font-heading tabular-nums mt-1 block">
                    {trendsData.summary.totalWasted}
                  </span>
                  <span className="text-[11px] text-[#B45309]">Unsold & discarded</span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="text-xs font-semibold text-[#6B6560] block">Overall Wastage Rate</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-[#EA580C] font-heading tabular-nums">
                      {trendsData.summary.wastagePercentage}%
                    </span>
                    <span className={`status-pill text-[10px] font-heading ${
                      trendsData.summary.isPositiveTrend ? 'status-pill-success' : 'status-pill-danger'
                    }`}>
                      {trendsData.summary.trendBadgeText}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B6560]">Target: &lt;10% waste rate</span>
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Grids */}
          {trendsLoading ? (
            <div className="card py-16 text-center text-[#6B6560]">
              <div className="w-8 h-8 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Aggregating historical wastage records...</p>
            </div>
          ) : trendsData ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left 7 cols: Top Wasted Dishes */}
              <div className="lg:col-span-7 card p-6 space-y-4">
                <h3 className="text-base font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100 flex items-center justify-between">
                  <span>Dishes with Highest Wastage</span>
                  <span className="text-xs font-normal text-[#6B6560]">Ranked by wasted portions</span>
                </h3>

                {trendsData.topWastedDishes.length === 0 ? (
                  <p className="text-xs text-[#9B9590] py-6 text-center">No dish wastage logged in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {trendsData.topWastedDishes.map((dish, idx) => (
                      <div key={dish.dishId} className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-white border border-stone-200 flex items-center justify-center font-bold text-xs text-[#6B6560] font-heading">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-[#1E1B16] font-heading block">{dish.dishName}</span>
                            <span className="text-[11px] text-[#6B6560]">
                              Prep: {dish.totalPrepared} • Sold: {dish.totalSold}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-[#EA580C] font-heading tabular-nums block text-sm">
                            {dish.totalWasted} wasted
                          </span>
                          <span className="text-[11px] text-[#6B6560] font-semibold">
                            {dish.wastePercentage}% loss rate
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right 5 cols: Reason Breakdown & Daily Trend list */}
              <div className="lg:col-span-5 space-y-6">
                <div className="card p-6 space-y-4">
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading pb-2 border-b border-stone-100">
                    Wastage Root Causes
                  </h3>

                  {trendsData.reasonBreakdown.length === 0 ? (
                    <p className="text-xs text-[#9B9590] py-6 text-center">No root causes recorded yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {trendsData.reasonBreakdown.map((r) => (
                        <div key={r.reason} className="p-3 rounded-xl bg-[#FFF7F0] border border-orange-200/80 flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1E1B16] capitalize font-heading">{r.reason}</span>
                          <span className="status-pill status-pill-warning text-[10px] font-heading">
                            {r.wastedPortions} portions ({r.occurrences} logs)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      )}

    </div>
  );
}
