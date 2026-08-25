import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, BellRing, PackageCheck, AlertCircle, RefreshCw, Filter, User, Home, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STATUS_TABS = ['Active', 'Pending', 'Accepted', 'Preparing', 'Ready', 'Completed', 'All'];

export function ChefDashboard() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Active');
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.getOrders();
      setOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load chef orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000); // 3s polling for real-time kitchen queue
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await api.updateOrderStatus(orderId, newStatus);
      showToast(`Order #${orderId} moved to "${newStatus}"`, 'success', 2500);
      await fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'Active') {
      return ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(order.order_status);
    }
    if (activeTab === 'All') return true;
    return order.order_status === activeTab;
  });

  // Calculate summary stats
  const pendingCount = orders.filter(o => o.order_status === 'Pending').length;
  const preparingCount = orders.filter(o => o.order_status === 'Preparing' || o.order_status === 'Accepted').length;
  const readyCount = orders.filter(o => o.order_status === 'Ready').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Dashboard Top Header (Stripe Glass Card Style) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-stripe-md relative overflow-hidden">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2.5xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shadow-stripe-sm">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kitchen Preparation Queue
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live student orders management & single-click status progression
            </p>
          </div>
        </div>

        {/* Live Counters Pill (Stripe Soft Badges) */}
        <div className="flex items-center gap-2 flex-wrap relative z-10">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/80 text-orange-900 text-xs font-black shadow-stripe-sm">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="tabular-nums">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-black shadow-stripe-sm">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span className="tabular-nums">{preparingCount} Cooking</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-black shadow-stripe-sm">
            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
            <span className="tabular-nums">{readyCount} Ready</span>
          </div>

          <button
            onClick={handleManualRefresh}
            className={`p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-slate-600 transition shadow-stripe-sm ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs (Stripe Segmented Style) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/60 rounded-2xl overflow-x-auto scrollbar-none shadow-stripe-sm">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-150 ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-stripe-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            {tab} {tab === 'Pending' && pendingCount > 0 && `(${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Orders Grid / Kanban Stream */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-stripe animate-pulse space-y-4">
              <div className="h-6 bg-slate-100 rounded w-1/3" />
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-stripe p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-stripe-sm">
            <CheckCircle2 className="w-7 h-7 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Orders in this Queue</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All incoming student orders for this status filter have been attended to.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => {
            const isUpdating = updatingId === order.order_id;
            const isPending = order.order_status === 'Pending';
            const isAccepted = order.order_status === 'Accepted';
            const isPreparing = order.order_status === 'Preparing';
            const isReady = order.order_status === 'Ready';
            const isCompleted = order.order_status === 'Completed';
            const isCancelled = order.order_status === 'Cancelled';

            let statusBadge = 'bg-slate-50 text-slate-700 border-slate-200';
            if (isPending) statusBadge = 'bg-orange-50 text-orange-800 border-orange-200/80 font-extrabold animate-pulse';
            if (isAccepted) statusBadge = 'bg-sky-50 text-sky-800 border-sky-200/80';
            if (isPreparing) statusBadge = 'bg-amber-50 text-amber-800 border-amber-200/80';
            if (isReady) statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
            if (isCompleted) statusBadge = 'bg-slate-50 text-slate-600 border-slate-200/80';
            if (isCancelled) statusBadge = 'bg-rose-50 text-rose-700 border-rose-200/80';

            return (
              <div
                key={order.order_id}
                className={`bg-white rounded-3xl border shadow-stripe flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-stripe-hover ${
                  isPending ? 'border-orange-300 ring-2 ring-orange-500/10' :
                  isReady ? 'border-emerald-300 ring-2 ring-emerald-500/10' :
                  'border-slate-200/80'
                }`}
              >
                {/* Card Top */}
                <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span className="text-orange-600 font-black">
                        {order.pickup_token || `#${order.order_id}`}
                      </span>
                    </span>
                    <span className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border shadow-stripe-sm ${statusBadge}`}>
                      {order.order_status}
                    </span>
                  </div>

                  {/* Student Details */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.student_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.room_number || 'Hostel'}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                    <span>Order #{order.order_id}</span>
                    <span>{new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="p-5 flex-1 space-y-2.5">
                  <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Order Items</p>
                  <div className="space-y-1.5">
                    {order.items?.map(item => (
                      <div
                        key={item.order_item_id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs shadow-stripe-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-black flex items-center justify-center text-[10px]">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-800">{item.item_name}</span>
                        </div>
                        <span className="text-slate-400 font-medium text-[11px]">{item.category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Progression Action Buttons */}
                <div className="p-5 bg-slate-50/80 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-400 font-medium">Total Credits:</span>
                    <span className="font-black text-slate-900 tabular-nums">{order.total_amount} Credits</span>
                  </div>

                  {/* Progressive Actions */}
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Accepted')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-stripe-sm hover:shadow-glow-orange transition-all duration-150 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Order</span>
                    </button>
                  )}

                  {isAccepted && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Preparing')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-stripe-sm transition-all duration-150 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Preparing / Cooking</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-stripe-sm hover:shadow-glow-emerald transition-all duration-150 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Mark Ready for Pickup</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Completed')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-stripe-sm transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      <span>Handover & Complete Order</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="py-2 text-center text-xs font-bold text-slate-400 bg-slate-100/80 rounded-xl border border-slate-200/60">
                      ✓ Order Fulfilled
                    </div>
                  )}

                  {isCancelled && (
                    <div className="py-2 text-center text-xs font-bold text-rose-600 bg-rose-50 rounded-xl border border-rose-200/60">
                      ✕ Order Cancelled & Refunded
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
