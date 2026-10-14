import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { apiFetch } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  demoLogin: () => Promise<void>;
  resetDemo: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check current session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem('rivo_token');
        if (token) {
          const res = await apiFetch<{ user: User }>('/auth/me');
          setUser(res.user);
        }
      } catch (err) {
        localStorage.removeItem('rivo_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('rivo_token', res.token);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await apiFetch<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    localStorage.setItem('rivo_token', res.token);
    setUser(res.user);
  };

  const demoLogin = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ user: User; token: string }>('/auth/demo-login', {
        method: 'POST',
      });
      localStorage.setItem('rivo_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const resetDemo = async () => {
    await apiFetch('/auth/reset-demo', { method: 'POST' });
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('rivo_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, demoLogin, resetDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
