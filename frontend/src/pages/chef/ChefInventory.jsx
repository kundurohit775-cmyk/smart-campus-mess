import React, { useState, useEffect } from 'react';
import { Sliders, Search, AlertCircle, CheckCircle, Plus, Minus, Power, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function ChefInventory() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchItems = async () => {
    try {
      const res = await api.getMenu();
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load inventory items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggleStock = async (item) => {
    setUpdatingId(item.item_id);
    const newQty = item.available_quantity > 0 ? 0 : 30;

    try {
      await api.toggleStock(item.item_id, newQty);
      showToast(
        newQty === 0 ? `Marked "${item.item_name}" as Sold Out` : `Restocked "${item.item_name}" with 30 portions`,
        newQty === 0 ? 'warning' : 'success'
      );
      await fetchItems();
    } catch (err) {
      showToast(err.message || 'Failed to toggle stock', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdjustQuantity = async (item, delta) => {
    setUpdatingId(item.item_id);
    const newQty = Math.max(0, item.available_quantity + delta);

    try {
      await api.toggleStock(item.item_id, newQty);
      showToast(`Updated stock for "${item.item_name}" to ${newQty}`, 'info', 2000);
      await fetchItems();
    } catch (err) {
      showToast(err.message || 'Failed to update quantity', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredItems = items.filter(item =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-orange-600" />
            <span>Food Inventory & Availability Toggler</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Toggle dishes in/out of stock in real-time. Sold out items instantly disable in the student app.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Item List / Cards */}
      {loading ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/4" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const isSoldOut = item.available_quantity <= 0;
            const isUpdating = updatingId === item.item_id;

            return (
              <div
                key={item.item_id}
                className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between gap-4 transition ${
                  isSoldOut ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-orange-600">
                        {item.price} Credits
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 truncate mt-1">
                      {item.item_name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Stock Quantity Modifier */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => handleAdjustQuantity(item, -5)}
                      disabled={isUpdating || item.available_quantity <= 0}
                      className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 text-xs font-bold shadow-sm disabled:opacity-40"
                      title="Decrease by 5"
                    >
                      -5
                    </button>
                    <span className={`px-2 text-xs font-black min-w-[36px] text-center ${isSoldOut ? 'text-rose-600' : 'text-slate-800'}`}>
                      {item.available_quantity}
                    </span>
                    <button
                      onClick={() => handleAdjustQuantity(item, 5)}
                      disabled={isUpdating}
                      className="w-7 h-7 bg-white hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 text-xs font-bold shadow-sm"
                      title="Increase by 5"
                    >
                      +5
                    </button>
                  </div>

                  {/* 1-Click Sold Out / In Stock Toggle */}
                  <button
                    onClick={() => handleToggleStock(item)}
                    disabled={isUpdating}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      isSoldOut
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isSoldOut ? 'Restock (30)' : 'Mark Sold Out'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
