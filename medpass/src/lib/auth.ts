import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  net_id: string;
  email: string;
  password: string;
  full_name?: string;
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(credentials: LoginCredentials) {
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
  },

  async refreshToken() {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  },
};