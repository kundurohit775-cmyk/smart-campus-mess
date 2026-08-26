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
  ShieldCheck 
} from 'lucide-react';
import { api } from '../../services/api';
import { WelcomeStrip } from '../../components/WelcomeStrip';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../context/ToastContext';

export function ChefDashboard({ onNavigateToInventory }) {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
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
  const completedList = ordersList.filter(o => o.order_status === 'Completed');
  const activeOrdersCount = pendingCount + cookingCount + readyCount;

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
      <WelcomeStrip subtitle="Kitchen Operations Dispatch • Real-time student order queue" />

      {/* 2. HERO STAT ROW (Chef Dominant: Amber #F59E0B + Sky #38BDF8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Active Queue (Amber) */}
        <StatCard
          title="Active Prep Queue"
          value={`${activeOrdersCount} Orders`}
          subtitle="Awaiting or in kitchen"
          icon={ChefHat}
          color="amber"
          isFeatured={true}
          trend={activeOrdersCount > 0 ? 'Active Queue' : 'Clear'}
          trendPositive={activeOrdersCount === 0}
        />

        {/* Stat 2: New Pending (Amber) */}
        <StatCard
          title="New Pending Orders"
          value={`${pendingCount} Orders`}
          subtitle="Waiting to start cooking"
          icon={Clock}
          color="amber"
          trend="Needs Prep"
          trendPositive={pendingCount === 0}
        />

        {/* Stat 3: On Stove / Cooking (Sky Blue) */}
        <StatCard
          title="Currently Cooking"
          value={`${cookingCount} Orders`}
          subtitle="Actively on stove"
          icon={Flame}
          color="sky"
          trend="Cooking"
          trendPositive={true}
        />

        {/* Stat 4: Ready at Counter (Emerald) */}
        <StatCard
          title="Ready for Pickup"
          value={`${readyCount} Orders`}
          subtitle="Awaiting student pickup"
          icon={CheckCircle2}
          color="emerald"
          trend="Ready Counter"
          trendPositive={true}
        />
      </div>

      {/* 3. MAIN GRID (70% Active Orders Dispatch + 30% Kitchen Info / Inventory) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 70% (col-span-8): Active Kitchen Queue */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Header & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-[#F1F5F9] font-heading">
                Kitchen Dispatch Board
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Auto-refreshes every 4s • Move meals through cooking stages
              </p>
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1.5 bg-[#0B0E1A] p-1 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { id: 'ACTIVE', label: `Active (${activeOrdersCount})` },
                { id: 'Pending', label: `Pending (${pendingCount})` },
                { id: 'Cooking', label: `Cooking (${cookingCount})` },
                { id: 'Ready', label: `Ready (${readyCount})` },
                { id: 'Completed', label: 'History' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === f.id
                      ? 'bg-[#F59E0B]/20 text-amber-300 border border-[#F59E0B]/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Stream List */}
          {loading ? (
            <div className="card p-12 text-center text-[#94A3B8]">
              <div className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-heading">Synchronizing kitchen queue...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="card p-12 text-center text-[#94A3B8] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center mx-auto shadow-sm">
                <ChefHat className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#F1F5F9] font-heading">
                Queue is all clear!
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                No orders currently in this state. New student orders will automatically pop up here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const status = order.order_status;
                const isPending = status === 'Pending';
                const isCooking = status === 'Cooking';
                const isReady = status === 'Ready';
                const isCompleted = status === 'Completed';

                return (
                  <div
                    key={order.order_id}
                    className={`card p-5 sm:p-6 transition-all border ${
                      isPending
                        ? 'border-[#F59E0B]/40 shadow-[0_0_16px_rgba(245,158,11,0.15)] bg-[#131728]/90'
                        : isCooking
                        ? 'border-[#38BDF8]/40 shadow-[0_0_16px_rgba(56,189,248,0.15)] bg-[#131728]/90'
                        : isReady
                        ? 'border-[#10B981]/40 shadow-[0_0_16px_rgba(16,185,129,0.15)] bg-[#131728]/90'
                        : 'border-slate-800 bg-[#131728]/60 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-bold font-heading text-[#F1F5F9]">
                            Order #{order.order_id}
                          </span>
                          
                          {/* Queue Token Badge */}
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#F59E0B]/15 text-amber-300 border border-[#F59E0B]/30 shadow-sm">
                            Token: {order.token_number || `#${order.order_id}`}
                          </span>

                          {/* Status Pill */}
                          <span
                            className={`status-pill text-[11px] py-0.5 px-2.5 font-heading ${
                              isPending
                                ? 'status-pill-warning'
                                : isCooking
                                ? 'status-pill-info'
                                : isReady
                                ? 'status-pill-success'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                          <span>Student: <strong className="text-[#F1F5F9]">{order.student_name || 'Student'}</strong></span>
                          <span>•</span>
                          <span>Room: {order.room_number || 'Hostel'}</span>
                          <span>•</span>
                          <span>{new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Action Stage Buttons */}
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'Cooking')}
                            disabled={processingId === order.order_id}
                            className="btn-chef text-xs py-2 px-4 shadow-[0_0_16px_rgba(245,158,11,0.3)] flex items-center gap-1.5"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>Start Cooking</span>
                          </button>
                        )}

                        {isCooking && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                            disabled={processingId === order.order_id}
                            className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold text-xs py-2 px-4 rounded-xl shadow-[0_0_16px_rgba(16,185,129,0.3)] transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {isReady && (
                          <button
                            onClick={() => handleUpdateStatus(order.order_id, 'Completed')}
                            disabled={processingId === order.order_id}
                            className="bg-slate-800 hover:bg-slate-700 text-[#F1F5F9] border border-slate-700 font-semibold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            <span>Complete Pickup</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Dish Items */}
                    <div className="pt-3 space-y-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
                        Ordered Items:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0E1A]/60 border border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-[#F59E0B]/15 text-[#F59E0B] font-bold flex items-center justify-center text-[11px]">
                                {item.quantity}x
                              </span>
                              <span className="font-semibold text-[#F1F5F9]">{item.item_name}</span>
                            </div>
                            <span className="text-[#94A3B8] tabular-nums font-mono">
                              {item.credits_price * item.quantity} Cr
                            </span>
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

        {/* RIGHT 30% (col-span-4): Kitchen Info & Quick Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Action: Stock Controls */}
          <div className="card p-6 space-y-4 border border-[#F59E0B]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#F59E0B] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9] font-heading">
                  Portion Inventory
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Toggle dish stock & portion counts
                </p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Ran out of batter or curries? Instantly mark dishes as sold out to prevent new student orders.
            </p>

            <button
              type="button"
              onClick={onNavigateToInventory}
              className="w-full btn-secondary text-xs py-2.5 border-[#F59E0B]/40 hover:bg-[#F59E0B]/10 text-amber-300 flex items-center justify-center gap-2"
            >
              <span>Manage Dish Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Kitchen Performance Card */}
          <div className="card p-6 space-y-4 border border-[#38BDF8]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[#38BDF8] flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9] font-heading">
                  Kitchen Velocity
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Orders completed this session
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B0E1A] border border-slate-800 text-center space-y-1">
              <span className="text-3xl font-bold font-heading text-[#38BDF8] tabular-nums">
                {completedList.length}
              </span>
              <span className="text-xs text-[#94A3B8] block">
                Dispatched meals today
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
