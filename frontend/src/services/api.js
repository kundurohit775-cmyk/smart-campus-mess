const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://smart-campus-mess.onrender.com/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('mess_auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `HTTP error! Status: ${res.status}`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => request('/auth-helpers/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => request('/auth-helpers/register', { method: 'POST', body: JSON.stringify(payload) }),
  sendLoginOtp: (phone) => request('/auth-helpers/login/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyLoginOtp: (phone, code) => request('/auth-helpers/login/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),
  sendOtp: (phone) => request('/auth-helpers/login/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, otp) => request('/auth-helpers/login/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code: otp }) }),
  getMe: () => request('/auth-helpers/me'),

  // Menu
  getMenu: () => request('/menu'),
  toggleStock: (itemId, available_quantity) => request(`/menu/${itemId}/toggle-stock`, {
    method: 'PATCH',
    body: JSON.stringify({ available_quantity })
  }),
  updateItemStock: (itemId, available_quantity) => request(`/menu/${itemId}/toggle-stock`, {
    method: 'PATCH',
    body: JSON.stringify({ available_quantity })
  }),

  // Credits & Student & Health Mode
  getCredits: (studentId) => request(`/credits/${studentId}`),
  getHealthStats: () => request('/credits/health-stats'),
  setCalorieGoal: (dailyCalorieGoal) => request('/credits/calorie-goal', {
    method: 'PATCH',
    body: JSON.stringify({ dailyCalorieGoal })
  }),
  setHealthMode: (enabled) => request('/credits/health-mode', {
    method: 'PATCH',
    body: JSON.stringify({ enabled })
  }),

  // Next-Day Pre-Orders for Limited/Special Items
  getTomorrowSpecials: () => request('/preorders/specials'),
  placePreOrder: (itemId, quantity) => request('/preorders', {
    method: 'POST',
    body: JSON.stringify({ itemId, quantity })
  }),
  getMyPreOrders: () => request('/preorders/my'),
  cancelPreOrder: (preOrderId) => request(`/preorders/${preOrderId}/cancel`, {
    method: 'POST'
  }),
  getAdminPreOrders: (date, itemId) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (itemId) params.append('itemId', itemId);
    const qs = params.toString();
    return request(`/preorders/admin${qs ? '?' + qs : ''}`);
  },
  fulfillPreOrder: (preOrderId) => request(`/preorders/admin/${preOrderId}/fulfill`, {
    method: 'PATCH'
  }),

  // Sick Leave & Hostel Delivery (Warden Approval)
  submitSickLeaveRequest: (data) => request('/sick-leave/request', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getMySickLeaveStatus: (date) => {
    const qs = date ? `?date=${date}` : '';
    return request(`/sick-leave/my-status${qs}`);
  },
  getHostelDirectory: () => request('/sick-leave/hostels'),
  getAdminSickLeaveRequests: () => request('/sick-leave/admin/all'),
  getTransactions: async (studentId) => {
    try {
      const me = JSON.parse(localStorage.getItem('mess_user_session') || '{}');
      const targetId = studentId || me.student_id || me.id || 'me';
      const res = await request(`/credits/${targetId}`);
      if (res && res.transactions) return res;
      return { transactions: [] };
    } catch {
      return request('/admin/transactions').catch(() => ({ transactions: [] }));
    }
  },

  // Orders
  placeOrder: (items, deliveryType = 'self-pickup', hostelName = null, roomNumber = null) => request('/orders', { 
    method: 'POST', 
    body: JSON.stringify({ items, deliveryType, hostelName, roomNumber }) 
  }),
  getOrders: (status) => request(status ? `/orders?status=${status}` : '/orders'),
  getChefOrders: (status) => request(status ? `/orders?status=${status}` : '/orders'),
  getChefInventory: () => request('/admin/menu'),
  getOrderDetails: (orderId) => request(`/orders/${orderId}`),
  updateOrderStatus: (orderId, status) => request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  cancelOrder: (orderId) => request(`/orders/${orderId}/cancel`, { method: 'PATCH' }),

  // Admin
  getAdminStats: () => request('/admin/analytics'),
  getAdminAnalytics: () => request('/admin/analytics'),
  getAdminStudents: () => request('/admin/students'),
  adjustStudentCredits: (studentId, payload) => request(`/admin/students/${studentId}/credits`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),
  getAdminMenu: () => request('/admin/menu'),
  createMenuItem: (payload) => request('/admin/menu', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  updateMenuItem: (itemId, payload) => request(`/admin/menu/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  }),
  refreshItemImage: (itemId) => request(`/admin/menu/${itemId}/refresh-image`, {
    method: 'POST'
  }),
  deleteMenuItem: (itemId) => request(`/admin/menu/${itemId}`, { method: 'DELETE' }),
  getAdminOrders: () => request('/admin/orders'),
  getAdminTransactions: () => request('/admin/transactions'),

  // Payments / Razorpay Top-up (1 Rupee = 1 Credit)
  createPaymentOrder: (amount) => request('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount })
  }),
  createRazorpayOrder: (amount) => request('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ amount })
  }),
  verifyPayment: (payload) => request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  verifyRazorpayPayment: (payload) => request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  getPaymentHistory: () => request('/payments/history')
};

export default api;
