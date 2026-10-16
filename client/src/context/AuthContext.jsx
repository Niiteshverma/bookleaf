import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bookleaf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bookleaf_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If token exists, verify session by calling /auth/me
    if (token) {
      axiosClient
        .get('/auth/me')
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('bookleaf_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('bookleaf_token', res.token);
      localStorage.setItem('bookleaf_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bookleaf_token');
    localStorage.removeItem('bookleaf_user');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    isAuthor: user?.role === 'AUTHOR',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
