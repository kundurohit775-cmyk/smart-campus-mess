import React, { useState, useEffect } from 'react';
import { Layers, Plus, Minus, Search, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function ChefInventory() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      const res = await api.getChefInventory();
      setItems(res?.items || []);
    } catch (err) {
      console.error('Failed to load chef inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpdateStock = async (itemId, currentQty, delta) => {
    const nextQty = Math.max(0, currentQty + delta);
    try {
      await api.updateItemStock(itemId, nextQty);
      showToast(`Stock updated to ${nextQty} portions`, 'success');
      await fetchItems();
    } catch (err) {
      showToast(err.message || 'Failed to update stock', 'error');
    }
  };

  const handleToggleSoldOut = async (itemId, isCurrentlyOut) => {
    const nextQty = isCurrentlyOut ? 40 : 0;
    try {
      await api.updateItemStock(itemId, nextQty);
      showToast(`Item ${isCurrentlyOut ? 'restocked to 40' : 'marked as Sold Out'}`, 'info');
      await fetchItems();
    } catch (err) {
      showToast(err.message || 'Failed to toggle stock', 'error');
    }
  };

  const itemsList = Array.isArray(items) ? items : [];

  const filteredItems = itemsList.filter(i =>
    (i.item_name && i.item_name.toLowerCase().includes(search.toLowerCase())) ||
    (i.category && i.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Header */}
      <div className="card-static flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <h1 className="text-h1 text-ink flex items-center gap-2 font-heading">
            <Layers className="w-6 h-6 text-[#FBBF24]" />
            <span>Kitchen Portion Inventory</span>
          </h1>
          <p className="text-body text-xs mt-0.5">
            Adjust available food portions and toggle live sold-out status
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Inventory Grid */}
      {loading ? (
        <div className="card text-center py-16 text-muted">
          <div className="w-8 h-8 border-2 border-[#FBBF24] border-t-transparent rounded-full animate-spin mx-auto mb-2 shadow-glow-amber" />
          <p className="text-xs font-semibold">Loading kitchen stock...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card text-center py-16 text-muted">
          <p className="text-body text-xs">No inventory items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map(item => {
            const isSoldOut = item.available_quantity <= 0;
            const isLowStock = item.available_quantity > 0 && item.available_quantity <= 5;

            return (
              <div
                key={item.item_id}
                className={`card flex flex-col justify-between ${
                  isSoldOut ? 'border-status-danger/40 bg-[#F87171]/5' : ''
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url}
                      alt={item.item_name}
                      className="w-14 h-14 rounded-xl object-cover border border-border shrink-0 shadow-level-1"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-micro text-muted block">{item.category}</span>
                      <h3 className="text-base font-bold text-ink truncate leading-snug font-heading">
                        {item.item_name}
                      </h3>
                      <span className="text-xs font-bold text-gradient tabular-nums font-heading">
                        {item.price} Credits
                      </span>
                    </div>
                  </div>

                  {/* Status & Available Units Pill */}
                  <div className="flex items-center justify-between pt-2 border-t border-divider">
                    <span className="text-micro text-muted">Stock Status:</span>
                    <span className={`status-pill text-xs ${
                      isSoldOut ? 'status-pill-danger' : isLowStock ? 'status-pill-warning' : 'status-pill-success'
                    }`}>
                      {isSoldOut ? 'Sold Out' : `${item.available_quantity} portions remaining`}
                    </span>
                  </div>
                </div>

                {/* Stepper Controls */}
                <div className="mt-4 pt-3 border-t border-divider space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-[#0B0E1A] border border-border p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.item_id, item.available_quantity, -5)}
                        disabled={item.available_quantity <= 0}
                        className="px-2 py-1 bg-[#131728] border border-border text-ink rounded-lg text-xs font-bold hover:bg-[#1A1F3A] transition active:scale-95 disabled:opacity-30 shadow-level-1"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.item_id, item.available_quantity, -1)}
                        disabled={item.available_quantity <= 0}
                        className="w-7 h-7 bg-[#131728] border border-border text-ink rounded-lg flex items-center justify-center text-xs hover:bg-[#1A1F3A] transition active:scale-95 disabled:opacity-30 shadow-level-1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      <span className="font-bold text-sm tabular-nums text-ink px-2 min-w-[28px] text-center font-heading">
                        {item.available_quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.item_id, item.available_quantity, 1)}
                        className="w-7 h-7 bg-[#131728] border border-border text-ink rounded-lg flex items-center justify-center text-xs hover:bg-[#1A1F3A] transition active:scale-95 shadow-level-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStock(item.item_id, item.available_quantity, 5)}
                        className="px-2 py-1 bg-[#131728] border border-border text-ink rounded-lg text-xs font-bold hover:bg-[#1A1F3A] transition active:scale-95 shadow-level-1"
                      >
                        +5
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleSoldOut(item.item_id, isSoldOut)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-heading transition shadow-level-1 ${
                        isSoldOut 
                          ? 'bg-status-success text-white hover:bg-emerald-600 shadow-glow-emerald' 
                          : 'bg-[#F87171]/15 text-status-danger hover:bg-[#F87171]/25 border border-[#F87171]/30'
                      }`}
                    >
                      {isSoldOut ? 'Restock (40)' : 'Mark Out'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
