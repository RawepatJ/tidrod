'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUser, getToken, removeToken, setToken as saveToken, fetchMe } from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  gender?: string;
  avatar_url?: string | null;
  bio?: string;
}

interface SessionContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  refresh: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be inside SessionProvider');
  return ctx;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    // First set user from JWT for immediate UI feedback
    const u = getUser();
    setUser(u as User);

    // Then fetch full profile for extra fields like avatar_url
    try {
      const data = await fetchMe();
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback((token: string) => {
    saveToken(token);
    refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
