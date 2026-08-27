import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  UtensilsCrossed, 
  RotateCcw, 
  ArrowRight, 
  BellRing,
  Calendar
} from 'lucide-react';
import { api } from '../../services/api';
import { OrderStepper } from '../../components/OrderStepper';
import { useToast } from '../../context/ToastContext';

export function OrderTracking({ onBrowseMenu }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [preOrders, setPreOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const [ordersRes, preOrdersRes] = await Promise.all([
        api.getOrders(),
        api.getMyPreOrders().catch(() => ({ preOrders: [] }))
      ]);
      setOrders(ordersRes.orders || []);
      setPreOrders(preOrdersRes.preOrders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCancelPreOrder = async (preOrderId) => {
    setCancellingId(preOrderId);
    try {
      const res = await api.cancelPreOrder(preOrderId);
      showToast(res.message || 'Pre-order cancelled & credits refunded.', 'success');
      await fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to cancel pre-order', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const ordersList = Array.isArray(orders) ? orders : [];
  const activeOrders = ordersList.filter(o => o.order_status !== 'Completed' && o.order_status !== 'Cancelled');
  const pastOrders = ordersList.filter(o => o.order_status === 'Completed' || o.order_status === 'Cancelled');

  const preOrdersList = Array.isArray(preOrders) ? preOrders : [];
  const activePreOrders = preOrdersList.filter(p => p.status === 'confirmed');

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1B16] font-heading">
            Live Order & Reservation Tracking
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6560] mt-0.5">
            Monitor real-time food preparation stages and track upcoming next-day pre-order tokens
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="btn-secondary py-2 px-3.5 text-xs self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* 1. UPCOMING SPECIAL PRE-ORDERS */}
      {activePreOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35] flex items-center gap-1.5 font-heading">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Day Special Reservations</span>
            </span>
            <span className="status-pill status-pill-warning text-[11px] py-0.5 px-2 font-bold text-[#FF6B35]">
              {activePreOrders.length} Booked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePreOrders.map((preOrder) => (
              <div
                key={preOrder.pre_order_id}
                className="card border-orange-200 bg-[#FFF7F0]/60 p-5 space-y-3 shadow-soft-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={preOrder.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                      alt={preOrder.item_name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#1E1B16] font-heading">
                        {preOrder.quantity}x {preOrder.item_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#6B6560] mt-0.5">
                        <span className="font-bold text-[#FF6B35] font-heading">Token: {preOrder.pickup_token}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-heading">
                          <Calendar className="w-3 h-3 text-[#9B9590]" />
                          {new Date(preOrder.scheduled_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="status-pill status-pill-success text-xs font-heading">
                    Confirmed
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-orange-200/80 text-xs">
                  <span className="text-[#6B6560] font-heading font-semibold">
                    Cost: {preOrder.total_amount} Credits
                  </span>
                  <button
                    type="button"
                    disabled={cancellingId === preOrder.pre_order_id}
                    onClick={() => handleCancelPreOrder(preOrder.pre_order_id)}
                    className="text-xs font-semibold text-[#DC2626] hover:underline"
                  >
                    {cancellingId === preOrder.pre_order_id ? 'Cancelling...' : 'Cancel Reservation'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ACTIVE SAME-DAY ORDERS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FF6B35]">Active In-Kitchen Orders</span>
          <span className="status-pill status-pill-warning text-[11px] py-0.5 px-2">
            {activeOrders.length} In Progress
          </span>
        </div>

        {loading ? (
          <div className="card text-center py-12 text-[#6B6560]">
            <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-semibold">Syncing with kitchen queue...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="card text-center py-12 text-[#6B6560] space-y-3">
            <ShoppingBag className="w-10 h-10 mx-auto text-[#9B9590]" />
            <div>
              <h3 className="text-base font-bold text-[#1E1B16] font-heading">No active orders</h3>
              <p className="text-xs text-[#6B6560] mt-1">You don't have any meals currently cooking in the mess kitchen.</p>
            </div>
            {onBrowseMenu && (
              <button
                onClick={onBrowseMenu}
                className="btn-primary py-2.5 px-5 text-xs mx-auto shadow-btn-orange"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>Browse Menu to Order</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const isReady = order.order_status === 'Ready';

              return (
                <div 
                  key={order.order_id} 
                  className={`card relative overflow-hidden ${
                    isReady ? 'border-emerald-300 bg-emerald-50/30' : ''
                  }`}
                >
                  {isReady && (
                    <div className="bg-[#16A34A] text-white px-4 py-1.5 -mx-6 -mt-6 mb-4 flex items-center justify-between text-xs font-bold font-heading">
                      <span className="flex items-center gap-1.5">
                        <BellRing className="w-4 h-4" />
                        MEAL IS READY FOR PICKUP!
                      </span>
                      <span>Show Token #{order.pickup_token} at Counter</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base border shadow-soft-sm font-heading ${
                          isReady 
                            ? 'bg-[#16A34A] text-white border-emerald-600' 
                            : 'bg-[#FFF7F0] text-[#FF6B35] border-orange-200'
                        }`}>
                          {order.pickup_token}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#1E1B16] font-heading">Order #{order.order_id}</span>
                            <span className={`status-pill text-[11px] ${
                              isReady ? 'status-pill-success' : 'status-pill-warning'
                            }`}>
                              {order.order_status}
                            </span>
                          </div>
                          <p className="text-xs text-[#6B6560] mt-0.5">
                            Placed: {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#9B9590] block">Total Amount</span>
                        <span className="text-base font-bold text-[#1E1B16] tabular-nums font-heading">
                          {order.total_amount} Credits
                        </span>
                      </div>
                    </div>

                    {/* Stepper Progress */}
                    <div className="py-2">
                      <OrderStepper currentStatus={order.order_status} />
                    </div>

                    {/* Items List */}
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#6B6560]">
                        <span>Order Dishes</span>
                        {order.total_calories > 0 && (
                          <span className="text-[#FF6B35] font-bold font-heading">
                            🔥 {order.total_calories} kcal
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-xs">
                        {(order.items || []).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[#1E1B16]">
                            <span className="font-heading font-medium">
                              {item.quantity}x {item.item_name}
                              {item.calories > 0 && (
                                <span className="text-[#9B9590] text-[11px] ml-1.5">
                                  ({item.calories * item.quantity} kcal)
                                </span>
                              )}
                            </span>
                            <span className="text-[#6B6560] tabular-nums font-heading">{(item.price || item.price_at_order || 0) * item.quantity} Cr</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. PAST ORDER HISTORY */}
      {pastOrders.length > 0 && (
        <div className="card-static space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h2 className="text-lg font-bold text-[#1E1B16] font-heading">
              Past Completed Orders
            </h2>
            <span className="text-xs text-[#9B9590]">
              {pastOrders.length} records
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {pastOrders.map((order) => {
              const isExpanded = expandedId === order.order_id;
              const isCancelled = order.order_status === 'Cancelled';

              return (
                <div key={order.order_id} className="py-3.5 space-y-2">
                  <div 
                    onClick={() => toggleExpand(order.order_id)}
                    className="flex items-center justify-between cursor-pointer hover:bg-stone-50 p-2 rounded-xl transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${
                        isCancelled ? 'bg-red-50 text-[#DC2626] border-red-200' : 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                      }`}>
                        #{order.order_id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-[#1E1B16] block font-heading">
                            Token: {order.pickup_token}
                          </span>
                          {order.total_calories > 0 && (
                            <span className="text-[10px] font-bold text-[#FF6B35] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200/80 font-heading">
                              🔥 {order.total_calories} kcal
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#9B9590]">
                          {new Date(order.order_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#1E1B16] tabular-nums font-heading">
                        {order.total_amount} Cr
                      </span>
                      <span className={`status-pill text-[11px] ${
                        isCancelled ? 'status-pill-danger' : 'status-pill-success'
                      }`}>
                        {order.order_status}
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-[#9B9590]" /> : <ChevronDown className="w-4 h-4 text-[#9B9590]" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5 animate-fade-in">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#6B6560]">
                        <span>Items Breakdown:</span>
                        {order.total_calories > 0 && (
                          <span className="text-[#FF6B35] font-bold font-heading">
                            Total: {order.total_calories} kcal
                          </span>
                        )}
                      </div>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[#6B6560]">
                          <span className="font-heading font-medium">
                            {item.quantity}x {item.item_name}
                            {item.calories > 0 && (
                              <span className="text-[#9B9590] text-[11px] ml-1.5">
                                ({item.calories * item.quantity} kcal)
                              </span>
                            )}
                          </span>
                          <span className="tabular-nums font-semibold font-heading text-[#1E1B16]">{(item.price || item.price_at_order || 0) * item.quantity} Credits</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
