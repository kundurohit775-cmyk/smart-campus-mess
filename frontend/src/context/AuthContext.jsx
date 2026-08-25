import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authClient } from '../services/authClient';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check active session
  const checkSession = useCallback(async () => {
    try {
      // 1. Try local storage token first
      const localToken = localStorage.getItem('mess_auth_token');
      const localSaved = localStorage.getItem('mess_user_session');

      if (localToken && localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          setUser(parsed);
          // Refresh details in background
          api.getMe().then(meData => {
            if (meData && meData.user) {
              localStorage.setItem('mess_user_session', JSON.stringify(meData.user));
              setUser(meData.user);
            }
          }).catch(() => {});
          return;
        } catch {
          // continue
        }
      }

      // 2. Try Better Auth session
      try {
        const sessionResult = await authClient.getSession();
        if (sessionResult && sessionResult.data && sessionResult.data.user) {
          const sessionUser = sessionResult.data.user;
          let creditInfo = null;

          if (sessionUser.role === 'student' || !sessionUser.role) {
            try {
              const creditRes = await api.getCredits(sessionUser.id || 1);
              creditInfo = {
                remaining: creditRes.credits?.remaining_credits ?? 9000,
                used: creditRes.credits?.used_credits ?? 0,
                limit: creditRes.credits?.monthly_limit ?? 9000,
                isLowBalance: creditRes.credits?.is_low_balance ?? false
              };
            } catch {
              creditInfo = { remaining: 9000, used: 0, limit: 9000, isLowBalance: false };
            }
          }

          const fullUser = {
            id: sessionUser.id,
            name: sessionUser.name,
            email: sessionUser.email,
            role: sessionUser.role || 'student',
            isChef: sessionUser.role === 'chef',
            isAdmin: sessionUser.role === 'admin',
            isStudent: sessionUser.role === 'student' || !sessionUser.role,
            roomNumber: sessionUser.roomNumber || 'Hostel',
            phone: sessionUser.phone || '',
            credits: creditInfo
          };

          setUser(fullUser);
          localStorage.setItem('mess_user_session', JSON.stringify(fullUser));
          return;
        }
      } catch {
        // continue
      }

      setUser(null);
    } catch (err) {
      console.error('Session check error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Direct API Login with Email + Password (NO OTP)
    const data = await api.login(cleanEmail, password);
    if (data.token && data.user) {
      localStorage.setItem('mess_auth_token', data.token);
      localStorage.setItem('mess_user_session', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.error || 'Invalid credentials');
  };

  const sendRegisterOtp = async (payload) => {
    const cleanEmail = (payload.email || '').trim().toLowerCase();
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      throw new Error('Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.');
    }
    return await api.sendRegisterOtp({ ...payload, email: cleanEmail });
  };

  const verifyRegisterOtp = async (payload) => {
    const cleanEmail = (payload.email || '').trim().toLowerCase();
    return await api.verifyRegisterOtp({ ...payload, email: cleanEmail });
  };

  const sendOtp = async (phone) => {
    return await api.sendOtp(phone);
  };

  const loginWithOtp = async (phone, otp) => {
    const data = await api.verifyOtp(phone, otp);
    if (data.token && data.user) {
      localStorage.setItem('mess_auth_token', data.token);
      localStorage.setItem('mess_user_session', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.error || 'Failed to verify OTP');
  };

  const logout = async () => {
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem('mess_auth_token');
    localStorage.removeItem('mess_user_session');
    localStorage.removeItem('mess_cart');
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      if (user.role === 'student' || user.isStudent) {
        const creditRes = await api.getCredits(user.id || 1);
        setUser(prev => ({
          ...prev,
          credits: {
            remaining: creditRes.credits?.remaining_credits ?? 9000,
            used: creditRes.credits?.used_credits ?? 0,
            limit: creditRes.credits?.monthly_limit ?? 9000,
            isLowBalance: creditRes.credits?.is_low_balance ?? false
          }
        }));
      }
    } catch (err) {
      console.error('Failed to refresh user credits:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, sendRegisterOtp, verifyRegisterOtp, sendOtp, loginWithOtp, logout, refreshUser }}>
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
