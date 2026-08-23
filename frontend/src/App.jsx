import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/Navbar';
import { NotificationBanner } from './components/NotificationBanner';
import { CartDrawer } from './components/CartDrawer';
import { api } from './services/api';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { OrderTracking } from './pages/student/OrderTracking';
import { Transactions } from './pages/student/Transactions';

// Chef Pages
import { ChefDashboard } from './pages/chef/ChefDashboard';
import { ChefInventory } from './pages/chef/ChefInventory';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MenuManager } from './pages/admin/MenuManager';
import { StudentManager } from './pages/admin/StudentManager';
import { AuditLogs } from './pages/admin/AuditLogs';

export function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
  const [readyOrders, setReadyOrders] = useState([]);

  // Auto-set default activeTab when user logs in based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'student') setActiveTab('menu');
      else if (user.role === 'chef') setActiveTab('dashboard');
      else if (user.role === 'admin') setActiveTab('dashboard');
    }
  }, [user?.role]);

  // Background check for Student ready orders
  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const checkReadyOrders = async () => {
      try {
        const res = await api.getOrders();
        const ready = (res.orders || []).filter(o => o.order_status === 'Ready');
        setReadyOrders(ready);
      } catch (e) {
        // silent fail
      }
    };

    checkReadyOrders();
    const interval = setInterval(checkReadyOrders, 4000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-wider text-slate-300">Loading Smart Campus Mess...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isStudent = user.role === 'student';
  const isChef = user.role === 'chef';
  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Role Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Global Notifications for Student */}
      {isStudent && (
        <NotificationBanner
          readyOrders={readyOrders}
          onTrackOrder={() => setActiveTab('orders')}
        />
      )}

      {/* Main Page Area */}
      <main className="flex-1 pb-16">
        {/* Student View */}
        {isStudent && (
          <>
            {activeTab === 'menu' && (
              <StudentDashboard onNavigateToOrders={() => setActiveTab('orders')} />
            )}
            {activeTab === 'orders' && (
              <OrderTracking onBrowseMenu={() => setActiveTab('menu')} />
            )}
            {activeTab === 'transactions' && (
              <Transactions />
            )}
          </>
        )}

        {/* Chef View */}
        {isChef && (
          <>
            {activeTab === 'dashboard' && <ChefDashboard />}
            {activeTab === 'inventory' && <ChefInventory />}
          </>
        )}

        {/* Admin View */}
        {isAdmin && (
          <>
            {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
            {activeTab === 'menu-mgr' && <MenuManager />}
            {activeTab === 'students' && <StudentManager />}
            {activeTab === 'audit' && <AuditLogs />}
          </>
        )}
      </main>

      {/* Slide-over Cart Drawer for Students */}
      {isStudent && (
        <CartDrawer onOrderSuccess={() => setActiveTab('orders')} />
      )}
    </div>
  );
}

export default App;
