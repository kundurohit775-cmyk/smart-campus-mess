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
      if (user.role === 'student' || user.isStudent) setActiveTab('menu');
      else if (user.role === 'chef' || user.isChef) setActiveTab('dashboard');
      else if (user.role === 'admin' || user.isAdmin) setActiveTab('dashboard');
    }
  }, [user?.role, user?.isChef, user?.isAdmin, user?.isStudent]);

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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center text-slate-900 space-y-4 subtle-mesh-bg">
        <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black tracking-wider text-slate-500 uppercase">Loading Smart Campus Mess...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isStudent = user.role === 'student' || user.isStudent;
  const isChef = user.role === 'chef' || user.isChef;
  const isAdmin = user.role === 'admin' || user.isAdmin;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white subtle-mesh-bg">
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
