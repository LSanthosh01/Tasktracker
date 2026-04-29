import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('tasktrack_user');
      if (!stored || stored === 'undefined' || stored === 'null') {
        return null;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse user from sessionStorage:', e);
      sessionStorage.removeItem('tasktrack_user');
      sessionStorage.removeItem('tasktrack_token');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = sessionStorage.getItem('tasktrack_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      sessionStorage.setItem('tasktrack_user', JSON.stringify(data.user));
    } catch {
      sessionStorage.removeItem('tasktrack_token');
      sessionStorage.removeItem('tasktrack_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    sessionStorage.setItem('tasktrack_token', data.token);
    sessionStorage.setItem('tasktrack_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    sessionStorage.removeItem('tasktrack_token');
    sessionStorage.removeItem('tasktrack_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('tasktrack_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser, isAdmin: user?.role === 'admin', isManager: user?.role === 'manager', isEmployee: user?.role === 'employee' }}>
      {children}
    </AuthContext.Provider>
  );
};
