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
  TrendingUp
} from 'lucide-react';
import { api } from '../../services/api';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../context/ToastContext';

export function ChefDashboard() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await api.getChefOrders();
      setOrders(res?.orders || []);
    } catch (err) {
      console.error('Failed to load kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setProcessingId(orderId);
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      showToast(`Order #${orderId} marked as "${nextStatus}"`, 'success');
      await fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to update order', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const ordersList = Array.isArray(orders) ? orders : [];
  const pendingCount = ordersList.filter(o => o.order_status === 'Pending').length;
  const cookingCount = ordersList.filter(o => o.order_status === 'Cooking').length;
  const readyCount = ordersList.filter(o => o.order_status === 'Ready').length;
  const completedToday = ordersList.filter(o => o.order_status === 'Completed').length;

  const filteredOrders = ordersList.filter(o => {
    if (statusFilter === 'ACTIVE') return o.order_status !== 'Completed' && o.order_status !== 'Cancelled';
    if (statusFilter === 'Pending') return o.order_status === 'Pending';
    if (statusFilter === 'Cooking') return o.order_status === 'Cooking';
    if (statusFilter === 'Ready') return o.order_status === 'Ready';
    if (statusFilter === 'Completed') return o.order_status === 'Completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* 1. HERO STAT STRIP (4 Stat Cards in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Pending Orders"
          value={pendingCount}
          subtitle="Waiting to start prep"
          icon={Clock}
          color="amber"
          trend={pendingCount > 0 ? 'Needs Prep' : 'Clear'}
          trendPositive={pendingCount === 0}
        />
        <StatCard
          title="Currently Cooking"
          value={cookingCount}
          subtitle="On stove / active"
          icon={Flame}
          color="orange"
        />
        <StatCard
          title="Ready for Pickup"
          value={readyCount}
          subtitle="At food counter"
          icon={Bell}
          color="emerald"
          trend="At Counter"
          trendPositive={true}
        />
        <StatCard
          title="Completed Orders"
          value={completedToday}
          subtitle="Dispatched today"
          icon={CheckCircle2}
          color="indigo"
        />
      </div>

      {/* 2. MAIN CONTENT AREA: 2-Column Grid (Main Queue 70% + Sidebar 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 70% (col-span-8): Active Kitchen Queue */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Filter Bar */}
          <div className="card-static flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
            <div>
              <h2 className="text-h2 text-ink">
                Kitchen Prep Queue
              </h2>
              <p className="text-body text-xs mt-0.5">
                Real-time queue synchronized with student orders
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-[#FAFAFB] p-1 rounded-xl border border-border">
              {['ACTIVE', 'ALL', 'Pending', 'Cooking', 'Ready', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    statusFilter === status
                      ? 'bg-white text-ink shadow-level-1'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="card text-center py-16 text-muted">
              <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading live kitchen queue...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="card text-center py-16 text-muted space-y-2">
              <ChefHat className="w-10 h-10 mx-auto text-slate-300" />
              <h3 className="text-h3 text-ink">Queue is Empty</h3>
              <p className="text-body text-xs">No orders matching this filter right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isPending = order.order_status === 'Pending';
                const isCooking = order.order_status === 'Cooking';
                const isReady = order.order_status === 'Ready';
                const isCompleted = order.order_status === 'Completed';

                return (
                  <div 
                    key={order.order_id} 
                    className={`card relative overflow-hidden transition-all duration-200 ${
                      isReady ? 'border-status-success bg-emerald-50/20' : isCooking ? 'border-amber-300' : ''
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      {/* Left: Token & Student Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-ink">
                            #{order.order_id}
                          </span>
                          <span className="status-pill status-pill-info text-xs">
                            Token: {order.pickup_token}
                          </span>
                          <span className={`status-pill text-xs ${
                            isReady ? 'status-pill-success' : isCooking ? 'status-pill-warning' : isPending ? 'status-pill-danger' : 'status-pill-info'
                          }`}>
                            {order.order_status}
                          </span>
                        </div>

                        <div className="text-xs text-body font-medium flex items-center gap-3">
                          <span>Student: <strong className="text-ink">{order.student_name}</strong></span>
                          <span>•</span>
                          <span>Room: <strong className="text-ink">{order.room_number || 'Hostel'}</strong></span>
                        </div>

                        {/* Dishes list */}
                        <div className="p-3 bg-[#FAFAFB] rounded-xl border border-border space-y-1 text-xs">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex justify-between font-semibold text-ink">
                              <span>{item.quantity}x {item.item_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Progression Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-divider">
                        <span className="text-micro text-muted">
                          {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'Cooking')}
                            disabled={processingId === order.order_id}
                            className="btn-primary py-2 px-4 text-xs bg-gradient-to-r from-[#D97706] to-[#F59E0B]"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Start Cooking</span>
                          </button>
                        )}

                        {isCooking && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                            disabled={processingId === order.order_id}
                            className="btn-primary py-2 px-4 text-xs bg-gradient-to-r from-[#16A34A] to-[#10B981]"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'Completed')}
                            disabled={processingId === order.order_id}
                            className="btn-secondary py-2 px-4 text-xs bg-white text-status-success border-status-success/30 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dispatch / Collect</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT 30% (col-span-4): Kitchen Summary Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          
          <div className="card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-divider">
              <ChefHat className="w-5 h-5 text-[#D97706]" />
              <h3 className="text-h3 text-ink">Kitchen Queue Overview</h3>
            </div>

            <div className="space-y-2.5 text-xs text-body">
              <div className="flex justify-between py-1.5 border-b border-divider">
                <span>Pending Preparation</span>
                <span className="font-bold text-[#D97706] tabular-nums">{pendingCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-divider">
                <span>On the Stove</span>
                <span className="font-bold text-[#FF6B35] tabular-nums">{cookingCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-divider">
                <span>Waiting for Pickup</span>
                <span className="font-bold text-status-success tabular-nums">{readyCount}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>Completed Today</span>
                <span className="font-bold text-ink tabular-nums">{completedToday}</span>
              </div>
            </div>
          </div>

          <div className="card bg-amber-50/60 border-amber-200/80 p-4 space-y-2 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <Bell className="w-4 h-4 text-[#D97706]" />
              <span>Token Pickup System</span>
            </div>
            <p className="leading-relaxed">
              When food is marked <strong>Ready</strong>, students receive an instant real-time pickup banner to collect their meal token at the counter.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
