import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Navbar } from './components/Navbar';
import { NotificationBanner } from './components/NotificationBanner';
import { CartDrawer } from './components/CartDrawer';
import { api } from './services/api';

// Public Sustainability Impact Page
import { SustainabilityImpact } from './pages/public/SustainabilityImpact';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { OrderTracking } from './pages/student/OrderTracking';
import { Transactions } from './pages/student/Transactions';

// Chef Pages
import { ChefDashboard } from './pages/chef/ChefDashboard';
import { ChefInventory } from './pages/chef/ChefInventory';

// Warden Pages
import { WardenDashboard } from './pages/warden/WardenDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { MenuManager } from './pages/admin/MenuManager';
import { StudentManager } from './pages/admin/StudentManager';
import { AuditLogs } from './pages/admin/AuditLogs';

export function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('menu');
  const [readyOrders, setReadyOrders] = useState([]);

  // Check URL pathname for public impact page (/impact or /food-saved)
  const isPublicImpactPath = typeof window !== 'undefined' && 
    (window.location.pathname === '/impact' || window.location.pathname === '/food-saved' || window.location.hash === '#impact' || window.location.hash === '#food-saved');

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

  // 1. PUBLIC IMPACT ROUTE (No authentication required)
  if (isPublicImpactPath) {
    return (
      <SustainabilityImpact 
        onNavigateHome={() => {
          window.history.pushState({}, '', '/');
          if (user) {
            setActiveTab(user.role === 'student' || user.isStudent ? 'menu' : 'dashboard');
          } else {
            window.location.href = '/';
          }
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center text-[#1E1B16] space-y-4">
        <div className="w-10 h-10 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin shadow-btn-orange" />
        <p className="text-xs font-bold tracking-wider text-[#6B6560] uppercase font-heading">Loading Smart Campus Mess...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isStudent = user.role === 'student' || user.isStudent;
  const isChef = user.role === 'chef' || user.isChef;
  const isWarden = user.role === 'warden' || user.isWarden;
  const isAdmin = user.role === 'admin' || user.isAdmin;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1E1B16] flex flex-col selection:bg-[#FF6B35] selection:text-white">
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
        
        {/* Global Impact Tab View (When user clicks Impact in navbar or dashboard) */}
        {activeTab === 'impact' && (
          <SustainabilityImpact 
            onNavigateHome={() => setActiveTab(isStudent ? 'menu' : 'dashboard')} 
          />
        )}

        {/* Student View */}
        {isStudent && activeTab !== 'impact' && (
          <>
            {activeTab === 'orders' ? (
              <OrderTracking onBrowseMenu={() => setActiveTab('menu')} />
            ) : activeTab === 'transactions' ? (
              <Transactions />
            ) : (
              <StudentDashboard 
                onNavigateToOrders={() => setActiveTab('orders')} 
                onNavigateToTransactions={() => setActiveTab('transactions')}
                onNavigateToImpact={() => setActiveTab('impact')}
              />
            )}
          </>
        )}

        {/* Chef View */}
        {isChef && activeTab !== 'impact' && (
          <>
            {activeTab === 'inventory' ? (
              <ChefInventory />
            ) : (
              <ChefDashboard 
                onNavigateToInventory={() => setActiveTab('inventory')}
              />
            )}
          </>
        )}

        {/* Warden View */}
        {isWarden && activeTab !== 'impact' && (
          <WardenDashboard />
        )}

        {/* Admin View */}
        {isAdmin && activeTab !== 'impact' && (
          <>
            {activeTab === 'menu-mgr' ? (
              <MenuManager />
            ) : activeTab === 'students' ? (
              <StudentManager />
            ) : activeTab === 'audit' ? (
              <AuditLogs />
            ) : (
              <AdminDashboard onNavigate={setActiveTab} />
            )}
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
