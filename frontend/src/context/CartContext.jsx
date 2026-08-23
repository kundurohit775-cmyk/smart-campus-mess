import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('mess_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('mess_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const totalItemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const remainingCredits = user?.credits?.remaining || 0;
  const balanceAfterOrder = remainingCredits - totalAmount;
  const isInsufficientCredit = totalAmount > remainingCredits;

  const addItem = (menuItem, qty = 1) => {
    if (menuItem.available_quantity <= 0) {
      showToast(`"${menuItem.item_name}" is currently Sold Out.`, 'warning');
      return false;
    }

    setItems(prev => {
      const existing = prev.find(i => i.item_id === menuItem.item_id);
      if (existing) {
        const nextQty = existing.quantity + qty;
        if (nextQty > menuItem.available_quantity) {
          showToast(`Only ${menuItem.available_quantity} available in stock for "${menuItem.item_name}".`, 'warning');
          return prev.map(i => i.item_id === menuItem.item_id ? { ...i, quantity: menuItem.available_quantity } : i);
        }
        showToast(`Updated "${menuItem.item_name}" quantity in cart (${nextQty})`, 'info', 2000);
        return prev.map(i => i.item_id === menuItem.item_id ? { ...i, quantity: nextQty } : i);
      } else {
        const initialQty = Math.min(qty, menuItem.available_quantity);
        showToast(`Added "${menuItem.item_name}" to your tray`, 'success', 2000);
        return [...prev, {
          item_id: menuItem.item_id,
          item_name: menuItem.item_name,
          category: menuItem.category,
          price: menuItem.price,
          image_url: menuItem.image_url,
          available_quantity: menuItem.available_quantity,
          quantity: initialQty
        }];
      }
    });

    return true;
  };

  const updateQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.item_id === itemId) {
        if (newQty > item.available_quantity) {
          showToast(`Maximum available stock reached (${item.available_quantity})`, 'warning');
          return { ...item, quantity: item.available_quantity };
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (itemId) => {
    setItems(prev => prev.filter(item => item.item_id !== itemId));
    showToast('Item removed from cart', 'info', 2000);
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('mess_cart');
  };

  return (
    <CartContext.Provider value={{
      items,
      isOpen,
      setIsOpen,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      totalAmount,
      totalItemCount,
      remainingCredits,
      balanceAfterOrder,
      isInsufficientCredit
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
