import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { setAccessToken, clearAccessToken, getAccessToken } from '@/utils';
import { subscribeAuth, broadcastLogout } from '@/utils/authChannel';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      if (!getAccessToken()) {
        const result = await authService.refresh();
        setAccessToken(result.accessToken);
        setUser(result.user);
        return;
      }
      const profile = await authService.me();
      setUser(profile);
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleLogout = () => {
      clearAccessToken();
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    const unsub = subscribeAuth((msg) => {
      if (msg.type === 'logout') handleLogout();
      if (msg.type === 'token') {
        setAccessToken(msg.token);
      }
    });
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      unsub();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setAccessToken(result.accessToken);
    setUser(result.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await authService.register(name, email, password);
    setAccessToken(result.accessToken);
    setUser(result.user);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearAccessToken();
      broadcastLogout();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
