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

      {/* 2. HERO STAT ROW (4 Equal-Width Glass Cards, Active Queue is Featured) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Featured Stat: Active Queue */}
        <StatCard
          title="Active Prep Queue"
          value={`${activeOrdersCount} Orders`}
          subtitle="Awaiting or in kitchen"
          icon={ChefHat}
          color="violet"
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
          color="violet"
          trend="Needs Prep"
          trendPositive={pendingCount === 0}
        />

        {/* Stat 3: On Stove / Cooking */}
        <StatCard
          title="Currently Cooking"
          value={`${cookingCount} Orders`}
          subtitle="Actively on stove"
          icon={Flame}
          color="violet"
          trend="Cooking"
          trendPositive={true}
        />

        {/* Stat 4: Ready at Counter */}
        <StatCard
          title="Ready for Pickup"
          value={`${readyCount} Orders`}
          subtitle="Awaiting student pickup"
          icon={Bell}
          color="cyan"
          trend="At Counter"
          trendPositive={true}
        />
      </div>

      {/* 3. MAIN GRID (70% Primary Content + 30% Sidebar Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT 70% (col-span-8): Primary Kitchen Queue */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Section A: Live Queue Card */}
          <div className="card space-y-6 p-6 sm:p-7">
            
            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-divider">
              <div>
                <h2 className="text-h2 text-ink font-heading">
                  Kitchen Dispatch Queue
                </h2>
                <p className="text-body text-xs mt-0.5">
                  Synchronized live with student dining requests
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto bg-[#0B0E1A] p-1 rounded-xl border border-border">
                {['ACTIVE', 'ALL', 'Pending', 'Cooking', 'Ready', 'Completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      statusFilter === status
                        ? 'bg-[#131728] text-[#F1F5F9] border border-[#8B5CF6]/40 shadow-glow-primary'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Queue List */}
            {loading ? (
              <div className="py-16 text-center text-muted">
                <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-2 shadow-glow-primary" />
                <p className="text-xs font-semibold">Loading live kitchen queue...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-muted space-y-2">
                <ChefHat className="w-10 h-10 mx-auto text-muted" />
                <h3 className="text-h3 text-ink font-heading">Queue is Empty</h3>
                <p className="text-body text-xs">No orders matching this filter right now.</p>
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
                      className={`card relative overflow-hidden transition-all duration-200 ${
                        isReady ? 'border-[#34D399]/50 shadow-glow-emerald bg-[#131728]/90' : isCooking ? 'border-[#8B5CF6]/40' : ''
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        {/* Left: Token & Student Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-ink font-heading">
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
                            <span>Student: <strong className="text-ink font-heading">{order.student_name}</strong></span>
                            <span>•</span>
                            <span>Room: <strong className="text-ink font-heading">{order.room_number || 'Hostel'}</strong></span>
                          </div>

                          {/* Ordered Dishes list */}
                          <div className="p-3 bg-[#0B0E1A]/80 rounded-xl border border-border space-y-1 text-xs">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex justify-between font-semibold text-ink font-heading">
                                <span>{item.quantity}x {item.item_name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-divider">
                          <span className="text-micro text-muted">
                            {new Date(order.order_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          {isPending && (
                            <button
                              onClick={() => handleUpdateStatus(order.order_id, 'Cooking')}
                              disabled={processingId === order.order_id}
                              className="btn-primary py-2 px-4 text-xs bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span>Start Cooking</span>
                            </button>
                          )}

                          {isCooking && (
                            <button
                              onClick={() => handleUpdateStatus(order.order_id, 'Ready')}
                              disabled={processingId === order.order_id}
                              className="btn-primary py-2 px-4 text-xs bg-gradient-to-r from-[#06B6D4] to-[#34D399] shadow-glow-emerald"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>Mark Ready</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => handleUpdateStatus(order.order_id, 'Completed')}
                              disabled={processingId === order.order_id}
                              className="btn-secondary py-2 px-4 text-xs text-status-success border-[#34D399]/40 hover:bg-[#34D399]/15 shadow-glow-emerald"
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

          {/* Section B: Recent Completed Dispatches Table */}
          <div className="card space-y-4 p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-divider">
              <div>
                <h3 className="text-h3 text-ink font-heading">Recent Fulfilled Dispatches</h3>
                <p className="text-body text-xs mt-0.5">Dispatched tokens and fulfilled meal batches</p>
              </div>
              <span className="text-xs text-muted font-heading">{completedList.length} served</span>
            </div>

            {completedList.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted">No completed dispatches recorded yet today.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="text-micro text-muted border-b border-divider bg-[#0B0E1A]/40">
                    <tr>
                      <th className="py-3 px-4">Order / Token</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Dishes</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-divider">
                    {completedList.slice(0, 5).map((order) => (
                      <tr key={order.order_id} className="h-14 hover:bg-[#1A1F3A]/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-ink font-heading">
                            #{order.order_id} <span className="text-[#06B6D4]">({order.pickup_token})</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-ink font-medium">
                          {order.student_name}
                        </td>
                        <td className="py-3 px-4 text-muted">
                          {(order.items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="status-pill status-pill-success text-[11px] font-heading">
                            Dispatched
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 30% (col-span-4): Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Widget 1: Kitchen Quick Actions */}
          <div className="card space-y-4">
            <h3 className="text-h3 text-ink font-heading pb-2 border-b border-divider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#8B5CF6]" />
              <span>Kitchen Controls</span>
            </h3>

            <div className="space-y-2 text-xs">
              <button
                onClick={onNavigateToInventory}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Manage Portion Stock</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </button>

              <button
                onClick={fetchOrders}
                className="w-full p-3 rounded-xl border border-border bg-[#0B0E1A] hover:bg-[#1A1F3A] flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-[#06B6D4] group-hover:scale-110 transition-transform" />
                  <span className="font-semibold text-ink font-heading">Sync Kitchen Queue</span>
                </div>
                <span className="status-pill status-pill-info text-[10px]">Live</span>
              </button>
            </div>
          </div>

          {/* Widget 2: Kitchen Schedule & Announcements */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-divider">
              <Megaphone className="w-4 h-4 text-[#8B5CF6]" />
              <h3 className="text-h3 text-ink font-heading">Kitchen Notices</h3>
            </div>

            <div className="space-y-3 text-xs text-body">
              <div className="p-3 bg-[#0B0E1A] rounded-xl border border-border space-y-1">
                <span className="font-bold text-ink block font-heading">🔥 Cooking Stations</span>
                <p className="text-muted leading-relaxed">
                  Mark items as <strong>Cooking</strong> as soon as preparation begins to notify student queue tracking.
                </p>
              </div>

              <div className="p-3 bg-[#0B0E1A] rounded-xl border border-border space-y-1">
                <span className="font-bold text-ink block font-heading">📦 Inventory Alerts</span>
                <p className="text-muted leading-relaxed">
                  Items with 0 remaining portions will be marked as Sold Out automatically for students.
                </p>
              </div>
            </div>
          </div>

          {/* Widget 3: Token Verification Instructions Card */}
          <div className="card bg-gradient-to-br from-[#1A1F3A] via-[#131728] to-[#0B0E1A] border-[#8B5CF6]/40 shadow-glow-primary space-y-3">
            <div className="flex items-center gap-2 font-bold font-heading text-ink text-sm">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
              <span>Token Pickup Protocol</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Verify student 4-digit pickup tokens (e.g. <strong className="text-[#06B6D4] font-heading">#A102</strong>) at the service counter before clicking <strong>Dispatch / Collect</strong>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
