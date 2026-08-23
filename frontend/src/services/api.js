const API_BASE = '/api';

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
  getMe: () => request('/auth-helpers/me'),
  sendOtp: (phone) => request('/auth-helpers/otp/send', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, otp) => request('/auth-helpers/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) }),

  // Menu
  getMenu: () => request('/menu'),
  toggleStock: (itemId, available_quantity) => request(`/menu/${itemId}/toggle-stock`, {
    method: 'PATCH',
    body: JSON.stringify({ available_quantity })
  }),

  // Credits
  getCredits: (studentId) => request(`/credits/${studentId}`),

  // Orders
  placeOrder: (items) => request('/orders', { method: 'POST', body: JSON.stringify({ items }) }),
  getOrders: (status) => request(status ? `/orders?status=${status}` : '/orders'),
  getOrderDetails: (orderId) => request(`/orders/${orderId}`),
  updateOrderStatus: (orderId, status) => request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  cancelOrder: (orderId) => request(`/orders/${orderId}/cancel`, { method: 'PATCH' }),

  // Admin
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
  deleteMenuItem: (itemId) => request(`/admin/menu/${itemId}`, { method: 'DELETE' }),
  getAdminOrders: () => request('/admin/orders'),
  getAdminTransactions: () => request('/admin/transactions')
};
