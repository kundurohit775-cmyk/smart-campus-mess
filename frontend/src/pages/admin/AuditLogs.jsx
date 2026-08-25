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
      setOrders(ordersRes.orders || []);
      setTransactions(transRes.transactions || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = orders.filter(o =>
    (o.student_name && o.student_name.toLowerCase().includes(search.toLowerCase())) ||
    (o.pickup_token && o.pickup_token.toLowerCase().includes(search.toLowerCase())) ||
    (o.order_status && o.order_status.toLowerCase().includes(search.toLowerCase())) ||
    String(o.order_id).includes(search)
  );

  const filteredTransactions = transactions.filter(t =>
    (t.student_name && t.student_name.toLowerCase().includes(search.toLowerCase())) ||
    (t.transaction_type && t.transaction_type.toLowerCase().includes(search.toLowerCase())) ||
    (t.notes && t.notes.toLowerCase().includes(search.toLowerCase())) ||
    String(t.transaction_id).includes(search)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-stripe-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shadow-stripe-sm">
              <Receipt className="w-5 h-5" />
            </div>
            <span>Campus Audit Logs & Records</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Immutable logs of every meal order placed and every credit movement in the system
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 shadow-stripe-sm transition"
            />
          </div>
        </div>
      </div>

      {/* Tabs (Stripe Segmented Style) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 border border-slate-200/60 rounded-2xl w-fit shadow-stripe-sm">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-150 ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-stripe-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
          <span>All Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-150 ${
            activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-stripe-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-purple-600" />
          <span>All Credit Transactions ({transactions.length})</span>
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-stripe overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading logs...
          </div>
        ) : activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Order / Token</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">No orders found.</td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.order_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-black text-slate-900 block">
                          #{order.order_id} <span className="text-orange-600 font-bold text-xs">({order.pickup_token})</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-800">
                        <span className="font-bold block">{order.student_name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{order.room_number || 'Hostel'}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-medium">
                        {order.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ') || 'No items'}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-orange-600 tabular-nums">
                        {order.total_amount} Credits
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black border shadow-stripe-sm ${
                          order.order_status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80' :
                          order.order_status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200/80' :
                          order.order_status === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                          'bg-amber-50 text-amber-800 border-amber-200/80'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400 whitespace-nowrap text-xs font-medium">
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
              <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-6">Tx ID</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Type & Notes</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance After</th>
                  <th className="py-3.5 px-6 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">No transactions found.</td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const isDebit = tx.transaction_type === 'DEBIT_ORDER';

                    return (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-400">
                          #{tx.transaction_id}
                        </td>
                        <td className="py-4 px-4 text-slate-800 font-bold">
                          {tx.student_name}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-900 block">{tx.notes || tx.transaction_type}</span>
                          <span className="text-[10px] uppercase font-black text-slate-400">
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className={`py-4 px-4 text-right font-black tabular-nums ${
                          isDebit ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Credits
                        </td>
                        <td className="py-4 px-4 text-right font-black text-slate-900 tabular-nums">
                          {tx.balance_after.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-right text-slate-400 whitespace-nowrap text-xs font-medium">
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
