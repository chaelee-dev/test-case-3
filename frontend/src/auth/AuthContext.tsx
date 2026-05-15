import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type AuthUser } from '@/api/auth';
import { getToken, setToken } from '@/api/client';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  updateUser: (next: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((r) => {
        if (!cancelled) setUser(r.user);
      })
      .catch(() => {
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    async login(email, password) {
      const r = await authApi.login({ email, password });
      setToken(r.user.token);
      setUser(r.user);
    },
    async register(username, email, password) {
      const r = await authApi.register({ username, email, password });
      setToken(r.user.token);
      setUser(r.user);
    },
    updateUser(next) {
      setToken(next.token);
      setUser(next);
    },
    logout() {
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
