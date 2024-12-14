"use client"

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContextType, User, AuthState } from '@/lib/auth/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: User[] = [];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      // Mocked
      const user = mockUsers.find(u => u.email === email);
      if (user) {
        setAuthState({ user, isAuthenticated: true });
        router.replace('/dashboard');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      // Mock registration
      if (mockUsers.some(u => u.email === email)) {
        throw new Error('Email already exists');
      }
      
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username,
        email,
      };
      
      mockUsers.push(newUser);
      setAuthState({ user: newUser, isAuthenticated: true });
      router.replace('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setAuthState({ user: null, isAuthenticated: false });
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};