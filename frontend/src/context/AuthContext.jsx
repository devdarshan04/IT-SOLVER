import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('fixtrail_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem('fixtrail_token');
      if (token) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
          localStorage.setItem('fixtrail_user', JSON.stringify(profile));
        } catch (err) {
          console.warn('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    }

    checkAuth();

    const handleAuthChange = () => {
      const savedUser = localStorage.getItem('fixtrail_user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    window.addEventListener('fixtrail_auth_change', handleAuthChange);
    return () => window.removeEventListener('fixtrail_auth_change', handleAuthChange);
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('fixtrail_token', data.access_token);
    localStorage.setItem('fixtrail_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (email, full_name, password) => {
    const data = await api.auth.register({ email, full_name, password });
    localStorage.setItem('fixtrail_token', data.access_token);
    localStorage.setItem('fixtrail_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('fixtrail_token');
    localStorage.removeItem('fixtrail_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
