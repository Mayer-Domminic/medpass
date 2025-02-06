import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
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
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await api.post('/auth/refresh', { token: refreshToken });
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        return api(originalRequest);
      } catch (err) {
        // Refresh token expired, redirect to login
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  async register(data: { net_id: string; email: string; password: string; full_name?: string }) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(credentials: { username: string; password: string }) {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  async logout() {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  },
};