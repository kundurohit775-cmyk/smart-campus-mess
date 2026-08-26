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
          <h1 className="text-h1 text-ink flex items-center gap-2.5 font-heading">
            <UtensilsCrossed className="w-6 h-6 text-[#06B6D4]" />
            <span>Menu Items Catalog</span>
          </h1>
          <p className="text-body text-xs mt-0.5">
            Add, update, or price menu dishes and configure campus food inventory
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 h-9 text-xs"
            />
          </div>

          <button
            onClick={openAddModal}
            className="btn-primary py-2 px-3.5 text-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish</span>
          </button>
        </div>
      </div>

      {/* Menu Table (56px row height, hover highlight, status pills) */}
      <div className="card-static p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="text-micro text-muted border-b border-divider bg-[#0B0E1A]/60">
              <tr>
                <th className="py-3.5 px-6">Dish</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price (Credits)</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-muted animate-pulse">
                    Loading menu items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-muted">
                    No menu items found.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.item_id} className="h-14 hover:bg-[#1A1F3A]/70 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.item_name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border shadow-level-1"
                        />
                        <div>
                          <span className="font-bold text-ink block font-heading">{item.item_name}</span>
                          <span className="text-xs text-muted line-clamp-1 max-w-xs">{item.description}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="status-pill status-pill-info text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-gradient tabular-nums font-heading">
                      {item.price} Credits
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
            <label className="block text-micro text-muted font-semibold">Dish Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Masala Dosa"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-micro text-muted font-semibold">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input-field bg-[#0B0E1A] text-ink"
              >
                {(CATEGORIES || []).map(c => (
                  <option key={c} value={c} className="bg-[#131728] text-ink">{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-micro text-muted font-semibold">Price (Credits)</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 90"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-micro text-muted font-semibold">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-micro text-muted font-semibold">Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-micro text-muted font-semibold">Description</label>
            <textarea
              rows={2}
              placeholder="Freshly prepared delicious meal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field h-auto py-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-divider">
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
              className="btn-primary py-2 px-5 text-xs"
            >
              {submitting ? 'Saving...' : 'Save Dish'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
