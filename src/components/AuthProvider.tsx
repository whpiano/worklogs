'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => '未知错误',
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('worklogs_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setMounted(true);
  }, []);

  const login = useCallback(async (password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('worklogs_auth', 'true');
        setIsAuthenticated(true);
        return null;
      }
      return data.error || '密码错误';
    } catch {
      return '验证失败，请重试';
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('worklogs_auth');
    setIsAuthenticated(false);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-zinc-50" />;
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function LoginForm({ onLogin }: { onLogin: (pwd: string) => Promise<string | null> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await onLogin(password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-zinc-200 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">需要密码</h1>
          <p className="text-sm text-zinc-500 mt-1">请输入密码以继续访问</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder="输入密码"
          className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          autoFocus
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full mt-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '验证中...' : '进入'}
        </button>
      </form>
    </div>
  );
}