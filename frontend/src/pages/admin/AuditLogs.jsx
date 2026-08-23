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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-purple-600" />
            <span>Campus Audit Logs & Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
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
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'orders' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>All Orders ({orders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>All Credit Transactions ({transactions.length})</span>
        </button>
      </div>

      {/* Tables */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading logs...
          </div>
        ) : activeTab === 'orders' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Order / Token</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Order Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">No orders found.</td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.order_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-slate-900 block">
                          #{order.order_id} ({order.pickup_token})
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-800">
                        <span className="font-bold block">{order.student_name}</span>
                        <span className="text-[11px] text-slate-400">{order.room_number || 'Hostel'}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {order.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ') || 'No items'}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-orange-600">
                        {order.total_amount} Credits
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                          order.order_status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          order.order_status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                          order.order_status === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-slate-400 whitespace-nowrap">
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
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">Tx ID</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Type & Notes</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Balance After</th>
                  <th className="py-3.5 px-5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">No transactions found.</td>
                  </tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const isDebit = tx.transaction_type === 'DEBIT_ORDER';

                    return (
                      <tr key={tx.transaction_id} className="hover:bg-slate-50/70 transition">
                        <td className="py-4 px-5 font-bold text-slate-400">
                          #{tx.transaction_id}
                        </td>
                        <td className="py-4 px-4 text-slate-800 font-bold">
                          {tx.student_name}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 block">{tx.notes || tx.transaction_type}</span>
                          <span className="text-[10px] uppercase font-extrabold text-slate-400">
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className={`py-4 px-4 text-right font-black ${
                          isDebit ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {isDebit ? `-${tx.amount}` : `+${tx.amount}`} Credits
                        </td>
                        <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                          {tx.balance_after.toLocaleString()}
                        </td>
                        <td className="py-4 px-5 text-right text-slate-400 whitespace-nowrap">
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
