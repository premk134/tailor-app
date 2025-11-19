import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// API methods
export const authApi = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
  requestOtp: (phone: string) => api.post('/auth/otp/request', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/otp/verify', { phone, otp }),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  updatePreferences: (data: any) => api.put('/users/me/preferences', data),
};

export const measurementApi = {
  getAll: () => api.get('/measurements'),
  getOne: (id: string) => api.get(`/measurements/${id}`),
  create: (data: any) => api.post('/measurements', data),
  update: (id: string, data: any) => api.put(`/measurements/${id}`, data),
  delete: (id: string) => api.delete(`/measurements/${id}`),
  getAccessLogs: (id: string) => api.get(`/measurements/${id}/access-logs`),
};

export const shopApi = {
  getAll: (params?: any) => api.get('/shops', { params }),
  getOne: (id: string) => api.get(`/shops/${id}`),
  create: (data: any) => api.post('/shops', data),
  update: (id: string, data: any) => api.put(`/shops/${id}`, data),
  getMyShops: () => api.get('/shops/owner/me'),
  toggleAccepting: (id: string) => api.put(`/shops/${id}/toggle-accepting`),
};

export const productApi = {
  getByShop: (shopId: string) => api.get(`/products/shop/${shopId}`),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (shopId: string, data: any) => api.post(`/products/shop/${shopId}`, data),
  update: (id: string, shopId: string, data: any) =>
    api.put(`/products/${id}/shop/${shopId}`, data),
  delete: (id: string, shopId: string) => api.delete(`/products/${id}/shop/${shopId}`),
};

export const orderApi = {
  create: (data: any) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getShopOrders: (shopId: string) => api.get(`/orders/shop/${shopId}`),
  getOne: (id: string) => api.get(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  addReview: (id: string, rating: number, review: string) =>
    api.post(`/orders/${id}/review`, { rating, review }),
};

export const chatApi = {
  sendMessage: (data: any) => api.post('/chat', data),
  getOrderMessages: (orderId: string) => api.get(`/chat/order/${orderId}`),
  markAsRead: (id: string) => api.patch(`/chat/${id}/read`),
};

export const paymentApi = {
  createIntent: (orderId: string) => api.post('/payments/create-intent', { orderId }),
  getOrderPayments: (orderId: string) => api.get(`/payments/order/${orderId}`),
};
