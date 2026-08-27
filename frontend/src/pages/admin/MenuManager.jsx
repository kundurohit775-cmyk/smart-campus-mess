import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, UtensilsCrossed, CheckCircle, XCircle, Flame, Heart } from 'lucide-react';
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
    calories: '',
    healthy_override: 'auto', // 'auto', 'yes', 'no'
    description: '',
    image_url: '',
    available_quantity: 40
  });

  const fetchItems = async () => {
    try {
      const res = await api.getAdminMenu();
      setItems(res?.items || []);
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
      calories: '',
      healthy_override: 'auto',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      available_quantity: 40
    });
    setIsAddOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    let overrideStr = 'auto';
    if (item.healthy_override === true || item.healthy_override === 1) overrideStr = 'yes';
    else if (item.healthy_override === false || item.healthy_override === 0) overrideStr = 'no';

    setFormData({
      item_name: item.item_name,
      category: item.category,
      price: item.price,
      calories: item.calories ?? '',
      healthy_override: overrideStr,
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
      let overrideVal = null;
      if (formData.healthy_override === 'yes') overrideVal = true;
      else if (formData.healthy_override === 'no') overrideVal = false;

      const payload = {
        ...formData,
        calories: formData.calories === '' ? null : parseInt(formData.calories, 10),
        healthy_override: overrideVal
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem.item_id, payload);
        showToast(`Updated "${formData.item_name}"`, 'success');
        setEditingItem(null);
      } else {
        await api.createMenuItem(payload);
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
          <h1 className="text-xl font-bold text-[#1E1B16] flex items-center gap-2.5 font-heading">
            <UtensilsCrossed className="w-6 h-6 text-[#C2410C]" />
            <span>Menu Items & Diet Catalog</span>
          </h1>
          <p className="text-xs text-[#6B6560] mt-0.5">
            Manage dishes, pricing, calorie values (kcal), and diet-friendly Health Mode tags
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-[#9B9590] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] pl-9 pr-3 py-1.5 rounded-xl text-xs focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
            />
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary py-2 px-3.5 text-xs whitespace-nowrap shadow-btn-orange"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* Menu Table */}
      <div className="card-static p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="py-3.5 px-6">Dish</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price (Credits)</th>
                <th className="py-3.5 px-4 text-center">Calories</th>
                <th className="py-3.5 px-4 text-center">Diet-Friendly</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#6B6560] animate-pulse">
                    Loading menu items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[#9B9590]">
                    No menu items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.item_id} className="h-14 hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-stone-200 shadow-soft-sm"
                        />
                        <div>
                          <span className="font-bold text-[#1E1B16] block font-heading">{item.item_name}</span>
                          <span className="text-xs text-[#6B6560] line-clamp-1 max-w-xs">{item.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="status-pill status-pill-info text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#1E1B16] tabular-nums font-heading">
                      {item.price} Credits
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.calories != null ? (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-[#FF6B35] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80 font-heading">
                          <Flame className="w-3 h-3 text-[#FF6B35]" />
                          {item.calories} kcal
                        </span>
                      ) : (
                        <span className="text-xs text-[#9B9590] italic">Unset</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`status-pill text-xs font-heading ${
                        item.is_healthy ? 'status-pill-success' : 'status-pill-danger'
                      }`}>
                        {item.is_healthy ? 'Diet-Friendly' : 'Standard'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`status-pill text-xs font-heading ${
                        item.available_quantity <= 0
                          ? 'status-pill-danger'
                          : 'status-pill-success'
                      }`}>
                        {item.available_quantity} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`status-pill text-xs cursor-pointer transition font-heading ${
                          item.is_active === 1
                            ? 'status-pill-success hover:opacity-80'
                            : 'status-pill-danger hover:opacity-80'
                        }`}
                      >
                        {item.is_active === 1 ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={() => openEditModal(item)}
                        className="btn-secondary py-1.5 px-2.5 text-xs"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
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
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1E1B16]">Dish Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Masala Dosa"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16]">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
              >
                {(CATEGORIES || []).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16]">Price (Credits)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 90"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16]">Calories (kcal, optional)</label>
              <input
                type="number"
                min="0"
                max="5000"
                placeholder="e.g. 320"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16]">Diet-Friendly Override</label>
              <select
                value={formData.healthy_override}
                onChange={(e) => setFormData({ ...formData, healthy_override: e.target.value })}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
              >
                <option value="auto">Auto (≤400 kcal)</option>
                <option value="yes">Force Diet-Friendly (Yes)</option>
                <option value="no">Force Not Diet-Friendly (No)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16]">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E1B16]">Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1E1B16]">Description</label>
            <textarea
              rows={2}
              placeholder="Freshly prepared delicious meal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#FAFAF9] focus:bg-white border border-stone-200 text-[#1E1B16] placeholder-[#9B9590] px-3.5 py-2 rounded-xl text-sm focus:border-[#C2410C] focus:ring-2 focus:ring-[#C2410C]/15 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => { setIsAddOpen(false); setEditingItem(null); }}
              className="btn-secondary py-2 px-4 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2 px-5 text-xs shadow-btn-orange"
            >
              {submitting ? 'Saving...' : 'Save Dish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
