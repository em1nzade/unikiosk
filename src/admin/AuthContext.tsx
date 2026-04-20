import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  user: { email: string; name: string; role: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>(null!);
export const useAuth = () => useContext(AuthContext);

const API_URL = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [user, setUser] = useState<{ email: string; name: string; role: string } | null>(() => {
    const stored = sessionStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) sessionStorage.setItem('admin_token', token);
    else sessionStorage.removeItem('admin_token');
  }, [token]);

  useEffect(() => {
    if (user) sessionStorage.setItem('admin_user', JSON.stringify(user));
    else sessionStorage.removeItem('admin_user');
  }, [user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Giriş uğursuz oldu');
      }
      const data = await res.json();
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
