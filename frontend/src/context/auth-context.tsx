"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse, RegisterResponse, UserRole } from '../types/auth';
import { api, ApiError } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }) => Promise<RegisterResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const storedToken = localStorage.getItem('alpha_token');
      if (!storedToken) {
        setUser(null);
        setToken(null);
        return;
      }

      setToken(storedToken);
      const currentUser = await api.get<User>('/auth/me');
      setUser(currentUser);
    } catch {
      localStorage.removeItem('alpha_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('alpha_token', data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>('/auth/register', userData);
  };

  const logout = () => {
    localStorage.removeItem('alpha_token');
    setUser(null);
    setToken(null);
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
