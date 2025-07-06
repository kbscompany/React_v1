import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors with automatic retry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token by re-authenticating
      try {
        // Check if we have stored credentials (for demo purposes - in production use refresh tokens)
        const savedUsername = localStorage.getItem('username') || sessionStorage.getItem('username');
        const savedPassword = localStorage.getItem('password') || sessionStorage.getItem('password');
        
        if (savedUsername && savedPassword) {
          const formData = new FormData();
          formData.append('username', savedUsername);
          formData.append('password', savedPassword);
          
          const response = await axios.post('/token', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            baseURL: API_BASE_URL
          });
          
          const { access_token } = response.data;
          if (localStorage.getItem('username') && localStorage.getItem('password')) {
            localStorage.setItem('token', access_token);
          } else {
            sessionStorage.setItem('token', access_token);
          }
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
      
      // If refresh fails, redirect to login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('password');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('password');
      
      // Only redirect if we're not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/token', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data: any) => api.post('/register', data),
  getCurrentUser: () => api.get('/users/me'),
};

// Warehouse API
export const warehouseAPI = {
  getAll: () => api.get('/api/warehouse/warehouses'),
  create: (data: any) => api.post('/api/warehouse/warehouses', data),
  update: (id: number, data: any) => api.put(`/api/warehouse/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/api/warehouse/warehouses/${id}`),
};

// Warehouse Manager Assignment API
export const warehouseAssignmentAPI = {
  getAll: () => api.get('/api/warehouse/warehouse-assignments'),
  create: (data: any) => api.post('/api/warehouse/warehouse-assignments', data),
  update: (id: number, data: any) => api.put(`/api/warehouse/warehouse-assignments/${id}`, data),
  delete: (id: number) => api.delete(`/api/warehouse/warehouse-assignments/${id}`),
  getUserAssignments: (userId: number) => api.get(`/api/warehouse/user/${userId}/warehouse-assignments`),
  getMyWarehouses: () => api.get('/api/warehouse/user/my-warehouses'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getCurrentUser: () => api.get('/users/me'),
};

// Category API
export const categoryAPI = {
  getAll: () => api.get('/api/warehouse/categories'),
  create: (data: any) => api.post('/api/warehouse/categories', data),
};

// Item API
export const itemAPI = {
  getAll: (params?: any) => api.get('/api/warehouse/ingredients', { params }),
  create: (data: any) => api.post('/items', data),
  update: (id: number, data: any) => api.put(`/items/${id}`, data),
  getPackages: (id: number) => api.get(`/items/${id}/packages`),
};

// Package API
export const packageAPI = {
  create: (data: any) => api.post('/packages', data),
};

// Stock API
export const stockAPI = {
  getWarehouseStock: (warehouseId: number, itemId?: number) =>
    api.get(`/api/warehouse/warehouses/${warehouseId}/stock`, { params: { item_id: itemId } }),
  updateStock: (data: any) => api.post('/api/warehouse/stock/update', data),
  bulkUpdate: (data: any) => api.post('/api/warehouse/stock/bulk-update', data),
  getMovements: (params?: any) => api.get('/api/warehouse/stock-movements', { params }),
  downloadTemplate: (warehouseId: number) =>
    api.get(`/api/warehouse/warehouses/${warehouseId}/stock/excel-template`, {
      responseType: 'blob',
    }),
  uploadExcel: (warehouseId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/warehouse/warehouses/${warehouseId}/stock/upload-excel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Safes API (simple)
export const safesAPI = {
  update: (id: number, data: any) => api.put(`/safes-simple/${id}`, data),
};

// Transfer API
export const transferAPI = {
  create: (data: any) => api.post('/api/warehouse/transfer-orders', data),
  getPending: (warehouseId: number) => api.get(`/api/warehouse/transfer-orders/pending/${warehouseId}`),
  receive: (data: any) => api.post('/api/warehouse/transfer-orders/receive', data),
};

// Transfer Template API
export const transferTemplateAPI = {
  getAll: () => api.get('/api/warehouse/transfer-templates'),
  get: (id: number) => api.get(`/api/warehouse/transfer-templates/${id}`),
  create: (data: any) => api.post('/api/warehouse/transfer-templates', data),
  load: (id: number) => api.post(`/api/warehouse/transfer-templates/${id}/load`),
  delete: (id: number) => api.delete(`/api/warehouse/transfer-templates/${id}`),
  save: (data: any) => api.post('/api/warehouse/transfer-templates/save', data),
};

// Waste API
export const wasteAPI = {
  create: (data: any) => api.post('/waste-logs', data),
  getAll: (params?: any) => api.get('/waste-logs', { params }),
  approve: (id: number) => api.put(`/waste-logs/${id}/approve`),
};

// Translation API
export const translationAPI = {
  get: (lang: string) => api.get(`/translations/${lang}`),
};

export default api; 