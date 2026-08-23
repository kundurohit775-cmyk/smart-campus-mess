import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Ban, RotateCcw, AlertTriangle, ChevronDown, ChevronUp, ShoppingBag, Utensils } from 'lucide-react';
import { api } from '../../services/api';
import { OrderStepper } from '../../components/OrderStepper';
import { Modal } from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useCart } from '../../context/CartContext';

export function OrderTracking({ onBrowseMenu }) {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();
  const { addItem, setIsOpen } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Live polling every 3.5 seconds
    const interval = setInterval(fetchOrders, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancellingId(orderToCancel.order_id);

    try {
      const res = await api.cancelOrder(orderToCancel.order_id);
      showToast(res.message, 'success');
      await refreshUser();
      await fetchOrders();
      setOrderToCancel(null);
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    let addedCount = 0;
    order.items.forEach(item => {
      addItem({
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        price: item.price,
        image_url: item.image_url,
        available_quantity: 99
      }, item.quantity);
      addedCount++;
    });

    if (addedCount > 0) {
      setIsOpen(true);
    }
  };

  // Group active vs history
  const activeOrders = orders.filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.order_status));
  const pastOrders = orders.filter(o => ['Completed', 'Cancelled'].includes(o.order_status));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order Status & History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status updates directly from the campus mess kitchen
          </p>
        </div>
        <button
          onClick={onBrowseMenu}
          className="self-start sm:self-auto px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-xs rounded-xl transition flex items-center gap-2"
        >
          <Utensils className="w-4 h-4" />
          <span>Order More Food</span>
        </button>
      </div>

      {/* SECTION 1: Active Orders */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>🔥 Active Kitchen Orders</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700">
              {activeOrders.length}
            </span>
          </h2>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live kitchen sync
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-16 bg-slate-100 rounded-xl" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-slate-800">No Active Orders Right Now</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
              You don't have any meals in preparation. Check out today's menu to place a new order!
            </p>
            <button
              onClick={onBrowseMenu}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Browse Today's Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeOrders.map(order => {
              const isPending = order.order_status === 'Pending';
              const isReady = order.order_status === 'Ready';

              return (
                <div
                  key={order.order_id}
                  className={`bg-white rounded-3xl border shadow-sm transition-all overflow-hidden ${
                    isReady ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200'
                  }`}
                >
                  {/* Order Card Header */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="px-3.5 py-1.5 rounded-xl bg-orange-600 text-white font-black text-sm tracking-wider shadow-sm">
                        {order.pickup_token || `#TK-${order.order_id}`}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900">
                          Order #{order.order_id}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Placed at {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-black text-base text-slate-900">{order.total_amount}</span>
                        <span className="text-xs text-slate-500 font-semibold ml-1">Credits</span>
                      </div>

                      {/* Cancel Order Action */}
                      {isPending ? (
                        <button
                          onClick={() => setOrderToCancel(order)}
                          className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
                        >
                          Cancel & Refund
                        </button>
                      ) : (
                        <span
                          className="px-3 py-1 bg-slate-100 text-slate-400 text-[11px] font-semibold rounded-xl cursor-not-allowed"
                          title="Cancellation is disabled once preparation begins"
                        >
                          Non-Cancellable
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5-Step Order Stepper */}
                  <div className="px-5 sm:px-8 py-4">
                    <OrderStepper status={order.order_status} />
                  </div>

                  {/* Order Items List */}
                  <div className="px-5 sm:px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-700">Items:</span>
                      {order.items?.map(item => (
                        <span
                          key={item.order_item_id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium"
                        >
                          {item.quantity}x {item.item_name}
                        </span>
                      ))}
                    </div>
                    {isReady && (
                      <span className="text-emerald-700 font-extrabold flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-4 h-4" /> Ready at Counter 1!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: Order History */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>📜 Past Orders</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {pastOrders.length}
          </span>
        </h2>

        {pastOrders.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No past orders yet.</p>
        ) : (
          <div className="space-y-3">
            {pastOrders.map(order => {
              const isCancelled = order.order_status === 'Cancelled';
              const isExpanded = !!expandedOrders[order.order_id];

              return (
                <div
                  key={order.order_id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition"
                >
                  <div
                    onClick={() => toggleExpand(order.order_id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        isCancelled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {order.order_status}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Order #{order.order_id} ({order.pickup_token})
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {new Date(order.order_time).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-extrabold text-sm text-slate-900">
                        {order.total_amount} Credits
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 text-xs">
                      <div className="space-y-2">
                        {order.items?.map(item => (
                          <div key={item.order_item_id} className="flex justify-between text-slate-700">
                            <span>{item.quantity}x {item.item_name}</span>
                            <span className="font-semibold">{item.subtotal} Credits</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                        <button
                          onClick={() => handleReorder(order)}
                          className="px-3 py-1.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-order Items</span>
                        </button>
                        <span className="text-slate-500 text-[11px]">
                          Completed: {order.completed_time ? new Date(order.completed_time).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Modal for Order Cancellation */}
      <Modal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        title="Confirm Order Cancellation"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Are you sure you want to cancel Order #{orderToCancel?.order_id}?</p>
              <p className="mt-1 text-rose-700">
                Full amount of <strong>{orderToCancel?.total_amount} Credits</strong> will be refunded immediately back to your student credit balance.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setOrderToCancel(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Keep Order
            </button>
            <button
              onClick={handleCancelOrder}
              disabled={!!cancellingId}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center gap-2"
            >
              {cancellingId ? 'Refunding...' : 'Yes, Cancel & Refund'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
