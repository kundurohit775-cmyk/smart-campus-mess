import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, CheckCircle2, Flame, BellRing, PackageCheck, AlertCircle, RefreshCw, Filter, User, Home } from 'lucide-react';
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
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Kitchen Preparation Queue
            </h1>
            <p className="text-xs text-slate-500">
              Live orders management & instant status progression
            </p>
          </div>
        </div>

        {/* Live Counters Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>{preparingCount} Cooking</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
            <BellRing className="w-3.5 h-3.5 text-emerald-600" />
            <span>{readyCount} Ready</span>
          </div>

          <button
            onClick={handleManualRefresh}
            className={`p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition shadow-sm ${
              activeTab === tab
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
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
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3" />
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Orders in this Queue</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
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

            let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
            if (isPending) statusBadge = 'bg-orange-100 text-orange-800 border-orange-300 font-extrabold animate-pulse';
            if (isAccepted) statusBadge = 'bg-blue-100 text-blue-800 border-blue-200';
            if (isPreparing) statusBadge = 'bg-amber-100 text-amber-800 border-amber-300';
            if (isReady) statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
            if (isCompleted) statusBadge = 'bg-slate-100 text-slate-600 border-slate-200';
            if (isCancelled) statusBadge = 'bg-rose-100 text-rose-700 border-rose-200';

            return (
              <div
                key={order.order_id}
                className={`bg-white rounded-3xl border shadow-sm flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                  isPending ? 'border-orange-400 ring-2 ring-orange-100' :
                  isReady ? 'border-emerald-400 ring-2 ring-emerald-100' :
                  'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Top */}
                <div className="p-5 border-b border-slate-100 space-y-3 bg-slate-50/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span className="text-orange-600 font-extrabold">
                        {order.pickup_token || `#${order.order_id}`}
                      </span>
                    </span>
                    <span className={`text-[11px] uppercase font-extrabold px-3 py-1 rounded-xl border ${statusBadge}`}>
                      {order.order_status}
                    </span>
                  </div>

                  {/* Student Details */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.student_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Home className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.room_number || 'Hostel'}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Order #{order.order_id}</span>
                    <span>{new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="p-5 flex-1 space-y-2.5">
                  <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Order Items</p>
                  <div className="space-y-1.5">
                    {order.items?.map(item => (
                      <div
                        key={item.order_item_id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 font-extrabold flex items-center justify-center text-[11px]">
                            {item.quantity}x
                          </span>
                          <span className="font-bold text-slate-800">{item.item_name}</span>
                        </div>
                        <span className="text-slate-400 font-medium">{item.category}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Progression Action Buttons */}
                <div className="p-5 bg-slate-50/80 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="text-slate-500 font-medium">Total Credits:</span>
                    <span className="font-extrabold text-slate-900">{order.total_amount} Credits</span>
                  </div>

                  {/* Progressive Actions */}
                  {isPending && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Accepted')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Order</span>
                    </button>
                  )}

                  {isAccepted && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Preparing')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Preparing / Cooking</span>
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                    >
                      <BellRing className="w-4 h-4" />
                      <span>Mark Ready for Pickup</span>
                    </button>
                  )}

                  {isReady && (
                    <button
                      onClick={() => handleUpdateStatus(order.order_id, 'Completed')}
                      disabled={isUpdating}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <PackageCheck className="w-4 h-4 text-emerald-400" />
                      <span>Handover & Complete Order</span>
                    </button>
                  )}

                  {isCompleted && (
                    <div className="py-2 text-center text-xs font-bold text-slate-400 bg-slate-100 rounded-xl">
                      ✓ Order Fulfilled
                    </div>
                  )}

                  {isCancelled && (
                    <div className="py-2 text-center text-xs font-bold text-rose-600 bg-rose-50 rounded-xl">
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
