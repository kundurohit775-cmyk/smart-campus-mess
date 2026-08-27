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
  User
} from 'lucide-react';
import { api } from '../../services/api';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../context/ToastContext';

export function ChefDashboard({ onNavigateToInventory }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('LIVE'); // 'LIVE' | 'PREORDERS'
  const [orders, setOrders] = useState([]);
  const [preOrders, setPreOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [processingId, setProcessingId] = useState(null);

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

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const ordersList = Array.isArray(orders) ? orders : [];
  const pendingCount = ordersList.filter(o => o.order_status === 'Pending').length;
  const cookingCount = ordersList.filter(o => o.order_status === 'Cooking').length;
  const readyCount = ordersList.filter(o => o.order_status === 'Ready').length;
  const completedList = ordersList.filter(o => o.order_status === 'Completed');
  const activeOrdersCount = pendingCount + cookingCount + readyCount;

  const preOrdersList = Array.isArray(preOrders) ? preOrders : [];
  const confirmedPreOrders = preOrdersList.filter(p => p.status === 'confirmed');

  const filteredOrders = ordersList.filter(o => {
    if (statusFilter === 'ACTIVE') return o.order_status !== 'Completed' && o.order_status !== 'Cancelled';
    if (statusFilter === 'Pending') return o.order_status === 'Pending';
    if (statusFilter === 'Cooking') return o.order_status === 'Cooking';
    if (statusFilter === 'Ready') return o.order_status === 'Ready';
    if (statusFilter === 'Completed') return o.order_status === 'Completed';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      
      {/* 1. WELCOME STRIP */}
      <WelcomeStrip subtitle="Kitchen Operations Dispatch • Live order queue & next-day pre-order reservations" />

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
        />

        {/* Stat 2: New Pending */}
        <StatCard
          title="New Pending Orders"
          value={`${pendingCount} Orders`}
          subtitle="Waiting to start cooking"
          icon={Clock}
          color="chef"
          trend="Pending"
          trendPositive={pendingCount === 0}
        />

        {/* Stat 3: Tomorrow's Special Pre-Orders */}
        <StatCard
          title="Next-Day Pre-Orders"
          value={`${confirmedPreOrders.length} Reservations`}
          subtitle="Special batch orders"
          icon={Sparkles}
          color="orange"
          onClick={() => setActiveTab('PREORDERS')}
          trend="Next-Day"
          trendPositive={true}
        />

        {/* Stat 4: Ready for Pickup */}
        <StatCard
          title="Ready at Counter"
          value={`${readyCount} Tokens`}
          subtitle="Awaiting student pickup"
          icon={CheckCircle2}
          color="success"
          trend="Ready"
          trendPositive={true}
        />
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          onClick={() => setActiveTab('LIVE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-heading ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition font-heading ${
            activeTab === 'PREORDERS'
              ? 'bg-[#EA580C] text-white shadow-soft-sm'
              : 'bg-stone-100 text-[#6B6560] hover:bg-stone-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Tomorrow's Special Pre-Orders ({confirmedPreOrders.length})</span>
        </button>
      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 70% (col-span-8): Active View */}
        <div className="lg:col-span-8 space-y-6">
          
          {activeTab === 'LIVE' ? (
            /* LIVE KITCHEN QUEUE */
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
                <div className="py-16 text-center text-[#6B6560]">
                  <div className="w-8 h-8 border-2 border-[#EA580C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold">Refreshing kitchen orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-[#6B6560] space-y-2">
                  <ChefHat className="w-10 h-10 mx-auto text-[#9B9590]" />
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                    No orders matching filter
                  </h3>
                  <p className="text-xs text-[#6B6560]">
                    Current prep queue is clear for this state.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const isPending = order.order_status === 'Pending';
                    const isCooking = order.order_status === 'Cooking';
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
                                  {order.order_status}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#6B6560]">
                                Student: {order.student_name || 'Student'} ({order.room_number || 'Hostel'})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPending && (
                              <button
                                onClick={() => handleUpdateStatus(order.order_id, 'Cooking')}
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
                                className="bg-stone-800 hover:bg-stone-900 text-white font-semibold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5 shadow-soft-sm"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                                <span>Complete Pickup</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Dish Items */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6560] block">
                            Dishes:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex justify-between p-2 rounded-xl bg-white border border-stone-200">
                                <span className="font-heading font-medium text-[#1E1B16]">{item.quantity}x {item.item_name}</span>
                                <span className="text-[#6B6560] tabular-nums font-heading">{(item.price || item.price_at_order || 0) * item.quantity} Cr</span>
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
          ) : (
            /* NEXT-DAY SPECIAL PRE-ORDERS QUEUE */
            <div className="card space-y-6 p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <h2 className="text-xl font-bold text-[#1E1B16] font-heading flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-[#FF6B35]" />
                    <span>Special Batch Pre-Orders</span>
                  </h2>
                  <p className="text-xs text-[#6B6560] mt-0.5">
                    Reserved next-day limited dishes requiring batch preparation
                  </p>
                </div>
                <span className="status-pill status-pill-warning text-xs font-bold text-[#FF6B35]">
                  {confirmedPreOrders.length} Confirmed
                </span>
              </div>

              {preOrdersList.length === 0 ? (
                <div className="py-16 text-center text-[#6B6560] space-y-2">
                  <Calendar className="w-10 h-10 mx-auto text-[#9B9590]" />
                  <h3 className="text-base font-bold text-[#1E1B16] font-heading">
                    No Special Pre-Orders
                  </h3>
                  <p className="text-xs text-[#6B6560]">
                    No students have reserved next-day special dishes yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {preOrdersList.map((preOrder) => {
                    const isConfirmed = preOrder.status === 'confirmed';
                    const isFulfilled = preOrder.status === 'fulfilled';

                    return (
                      <div
                        key={preOrder.pre_order_id}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isConfirmed ? 'bg-[#FFF7F0]/60 border-orange-200' : 'bg-stone-50 border-stone-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={preOrder.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                            alt={preOrder.item_name}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-[#1E1B16] font-heading">
                                {preOrder.quantity}x {preOrder.item_name}
                              </h4>
                              <span className="font-bold text-xs text-[#FF6B35] bg-white px-2 py-0.5 rounded-md border border-orange-200 font-heading">
                                {preOrder.pickup_token}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-[#6B6560] mt-1">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-[#9B9590]" />
                                {preOrder.student_name} ({preOrder.room_number || 'Hostel'})
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#9B9590]" />
                                {new Date(preOrder.scheduled_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className={`status-pill text-xs font-heading ${
                            isConfirmed ? 'status-pill-success' : isFulfilled ? 'status-pill-info' : 'status-pill-danger'
                          }`}>
                            {preOrder.status}
                          </span>

                          {isConfirmed && (
                            <button
                              type="button"
                              disabled={processingId === preOrder.pre_order_id}
                              onClick={() => handleFulfillPreOrder(preOrder.pre_order_id)}
                              className="btn-primary py-2 px-3.5 text-xs shadow-btn-orange flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{processingId === preOrder.pre_order_id ? 'Fulfilling...' : 'Mark Picked Up'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHT 30% (col-span-4): Kitchen Info & Quick Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Action: Stock Controls */}
          <div className="card p-6 space-y-4 border border-orange-200/80 bg-[#FFF7F0]/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#EA580C] flex items-center justify-center shadow-soft-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E1B16] font-heading">
                  Portion Inventory
                </h3>
                <p className="text-xs text-[#6B6560]">
                  Toggle dish stock & portion counts
                </p>
              </div>
            </div>

            <p className="text-xs text-[#6B6560] leading-relaxed">
              Configure next-day limited specials and manage portion caps to prevent overbooking.
            </p>

            <button
              type="button"
              onClick={onNavigateToInventory}
              className="w-full btn-secondary text-xs py-2.5 border-orange-200 hover:bg-[#FFF7F0] text-[#EA580C] flex items-center justify-center gap-2"
            >
              <span>Manage Specials & Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Kitchen Performance Card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center shadow-soft-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E1B16] font-heading">
                  Kitchen Velocity
                </h3>
                <p className="text-xs text-[#6B6560]">
                  Orders completed this session
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-1">
              <span className="text-3xl font-bold font-heading text-[#1E1B16] tabular-nums">
                {completedList.length}
              </span>
              <span className="text-xs text-[#6B6560] block">
                Dispatched meals today
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
