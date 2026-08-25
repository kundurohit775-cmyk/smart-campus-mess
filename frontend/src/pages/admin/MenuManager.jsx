import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, UtensilsCrossed, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../../components/Modal';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages'];

export function MenuManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'Lunch',
    price: '',
    description: '',
    image_url: '',
    available_quantity: 40
  });

  const fetchItems = async () => {
    try {
      const res = await api.getAdminMenu();
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const openAddModal = () => {
    setFormData({
      item_name: '',
      category: 'Lunch',
      price: '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      available_quantity: 40
    });
    setIsAddOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      category: item.category,
      price: item.price,
      description: item.description || '',
      image_url: item.image_url || '',
      available_quantity: item.available_quantity
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.item_name || !formData.price) {
      showToast('Name and Price are required.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem.item_id, formData);
        showToast(`Updated "${formData.item_name}"`, 'success');
        setEditingItem(null);
      } else {
        await api.createMenuItem(formData);
        showToast(`Created "${formData.item_name}"`, 'success');
        setIsAddOpen(false);
      }
      await fetchItems();
    } catch (err) {
      showToast(err.message || 'Failed to save menu item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const nextActive = item.is_active === 1 ? 0 : 1;
      await api.updateMenuItem(item.item_id, { is_active: nextActive });
      showToast(`Item ${nextActive ? 'activated' : 'deactivated'}`, 'info');
      await fetchItems();
    } catch (err) {
      showToast(err.message || 'Failed to update item', 'error');
    }
  };

  const filteredItems = items.filter(i =>
    i.item_name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-stripe-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center shadow-stripe-sm">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span>Menu Items Catalog</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Add, update, or price menu dishes and configure campus food inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition"
            />
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-xl shadow-stripe-sm hover:shadow-glow-orange transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {/* Menu Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-stripe overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-6">Dish</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price (Credits)</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 animate-pulse">
                    Loading menu items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No menu items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.item_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100 shadow-stripe-sm"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{item.item_name}</span>
                          <span className="text-xs text-slate-400 font-medium line-clamp-1 max-w-xs">{item.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-700 border border-slate-200/60">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-orange-600 tabular-nums">
                      {item.price} Credits
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black border tabular-nums shadow-stripe-sm ${
                        item.available_quantity <= 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      }`}>
                        {item.available_quantity} units
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-stripe-sm ${
                          item.is_active === 1
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200 border border-slate-200/60'
                        }`}
                      >
                        {item.is_active === 1 ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition shadow-stripe-sm"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddOpen || !!editingItem}
        onClose={() => { setIsAddOpen(false); setEditingItem(null); }}
        title={editingItem ? `Edit "${editingItem.item_name}"` : 'Add New Menu Dish'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dish Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Masala Dosa"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition font-medium"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Price (Credits)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 90"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={2}
              placeholder="Freshly prepared delicious meal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 shadow-stripe-sm transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setIsAddOpen(false); setEditingItem(null); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black rounded-xl shadow-stripe-sm hover:shadow-glow-orange transition-all duration-150 active:scale-95"
            >
              {submitting ? 'Saving...' : 'Save Dish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
