import { create } from 'zustand';
import { authApi, api } from '@/lib/api';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { net_id: string; email: string; password: string; full_name?: string }) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (credentials) => {
    try {
      set({ isLoading: true, error: null });
  
      const { access_token, refresh_token } = await authApi.login(credentials);
      
      if (!access_token) {
        throw new Error("Login failed. No token received.");
      }
  
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
  
      const headers = { Authorization: `Bearer ${access_token}` };
      const user = await api.get("/users/me", { headers });
  
      set({ user: user.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Login error:", error);
      
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
  
      set({
        user: null,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : "Login failed",
        isLoading: false,
      });
  
      return;
    }
  },  

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await authApi.register(data);

      const { access_token, refresh_token } = await authApi.login({
        username: data.net_id,
        password: data.password,
      });
  
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
  
      // Fetch the user data
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Registration failed', isLoading: false });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
  try {
    set({ isLoading: true });
    const token = localStorage.getItem("access_token");

    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    // Avoid redundant calls
    const currentUser = await authApi.getCurrentUser();
    set((state) => {
      if (state.user?.net_id === currentUser.net_id) {
        return { isAuthenticated: true, isLoading: false };
      }
      return { user: currentUser, isAuthenticated: true, isLoading: false };
    });
  } catch (error) {
    set({ isAuthenticated: false, isLoading: false });
  }
},

}));