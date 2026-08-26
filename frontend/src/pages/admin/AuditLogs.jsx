import React, { useState, useEffect } from 'react';
import { Receipt, ShoppingBag, Coins, Search, Filter, Calendar } from 'lucide-react';
import { api } from '../../services/api';

export function AuditLogs() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [ordersRes, transRes] = await Promise.all([
        api.getAdminOrders(),
        api.getAdminTransactions()
      ]);
      setOrders(ordersRes?.orders || []);
      setTransactions(transRes?.transactions || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ordersList = Array.isArray(orders) ? orders : [];
  const transList = Array.isArray(transactions) ? transactions : [];

  const filteredOrders = ordersList.filter(o =>
    (o.student_name && o.student_name.toLowerCase().includes(search.toLowerCase())) ||
    (o.pickup_token && o.pickup_token.toLowerCase().includes(search.toLowerCase())) ||
    (o.order_status && o.order_status.toLowerCase().includes(search.toLowerCase())) ||
    String(o.order_id).includes(search)
  );

  const filteredTransactions = transList.filter(t =>
    (t.student_name && t.student_name.toLowerCase().includes(search.toLowerCase())) ||
    (t.transaction_type && t.transaction_type.toLowerCase().includes(search.toLowerCase())) ||
    (t.notes && t.notes.toLowerCase().includes(search.toLowerCase())) ||
    String(t.transaction_id).includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="card-static flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <h1 className="text-h1 text-ink flex items-center gap-2.5 font-heading">
            <Receipt className="w-6 h-6 text-[#8B5CF6]" />
            <span>Campus Audit Logs & Records</span>
          </h1>
          <p className="text-body text-xs mt-0.5">
            Immutable logs of every meal order placed and every credit movement in the system
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0B0E1A] border border-border rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all duration-200 ${
            activeTab === 'orders' ? 'bg-[#131728] text-white border border-[#8B5CF6]/40 shadow-glow-primary' : 'text-muted hover:text-ink'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>All Orders ({ordersList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-[8px] text-xs font-semibold transition-all duration-200 ${
            activeTab === 'transactions' ? 'bg-[#131728] text-white border border-[#8B5CF6]/40 shadow-glow-primary' : 'text-muted hover:text-ink'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>Credit Transactions ({transList.length})</span>
        </button>
      </div>

      {/* Tables */}
      <div className="card-static p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted animate-pulse">
            Loading logs...
          </div>
        ) : activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-micro text-muted border-b border-divider bg-[#0B0E1A]/60">
                <tr>
                  <th className="py-3.5 px-6">Order / Token</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-muted">No orders found.</td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.order_id} className="h-14 hover:bg-[#1A1F3A]/70 transition-colors">
                      <td className="py-3 px-6">
                        <span className="font-bold text-ink block font-heading">
                          #{order.order_id} <span className="text-[#06B6D4] font-semibold text-xs font-heading">({order.pickup_token})</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ink">
                        <span className="font-semibold block font-heading">{order.student_name}</span>
                        <span className="text-[11px] text-muted">{order.room_number || 'Hostel'}</span>
                      </td>
                      <td className="py-3 px-4 text-body font-heading">
                        {(order.items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ') || 'No items'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gradient tabular-nums font-heading">
                        {order.total_amount} Credits
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`status-pill text-xs font-heading ${
                          order.order_status === 'Completed' ? 'status-pill-success' :
                          order.order_status === 'Cancelled' ? 'status-pill-danger' :
                          order.order_status === 'Ready' ? 'status-pill-success' :
                          'status-pill-warning'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right text-muted whitespace-nowrap text-xs">
                        {new Date(order.order_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-micro text-muted border-b border-divider bg-[#0B0E1A]/60">
                <tr>
                  <th className="py-3.5 px-6">Tx ID</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Type & Notes</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance After</th>
                  <th className="py-3.5 px-6 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-muted">No transactions found.</td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const isDebit = tx.transaction_type === 'DEBIT_ORDER';

                    return (
                      <tr key={tx.transaction_id} className="h-14 hover:bg-[#1A1F3A]/70 transition-colors">
                        <td className="py-3 px-6 font-bold text-muted font-heading">
                          #{tx.transaction_id}
                        </td>
                        <td className="py-3 px-4 text-ink font-semibold font-heading">
                          {tx.student_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-ink block">{tx.notes || tx.transaction_type}</span>
                          <span className="text-[10px] uppercase font-bold text-muted font-heading">
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold tabular-nums font-heading ${
                          isDebit ? 'text-status-danger' : 'text-status-success'
                        }`}>
                          {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Credits
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-ink tabular-nums font-heading">
                          {tx.balance_after?.toLocaleString() ?? tx.balance_after}
                        </td>
                        <td className="py-3 px-6 text-right text-muted whitespace-nowrap text-xs">
                          {new Date(tx.transaction_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
