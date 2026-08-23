import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authClient } from '../services/authClient';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check Better Auth active session
  const checkSession = useCallback(async () => {
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

        setUser({
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
          role: sessionUser.role || 'student',
          roomNumber: sessionUser.roomNumber || 'Hostel',
          phone: sessionUser.phone || '',
          credits: creditInfo
        });
      } else {
        // Check local storage fallback for demo switches and OTP logins
        const localSaved = localStorage.getItem('mess_user_session');
        if (localSaved) {
          setUser(JSON.parse(localSaved));
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('Session retrieval error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    try {
      const res = await authClient.signIn.email({
        email,
        password
      });

      if (res.error) {
        throw new Error(res.error.message || 'Login failed');
      }

      await checkSession();
      return user;
    } catch (err) {
      // Fallback to helper login if demo account
      try {
        const fallbackData = await api.login(email, password);
        localStorage.setItem('mess_auth_token', fallbackData.token);
        localStorage.setItem('mess_user_session', JSON.stringify(fallbackData.user));
        setUser(fallbackData.user);
        return fallbackData.user;
      } catch {
        throw err;
      }
    }
  };

  const register = async ({ name, email, password, phone, roomNumber }) => {
    // 1. Client-side VIT Student domain validation
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail.endsWith('@vitstudent.ac.in')) {
      throw new Error('Only VIT student email addresses (@vitstudent.ac.in) are allowed to register.');
    }

    try {
      const res = await authClient.signUp.email({
        name,
        email: cleanEmail,
        password,
        role: 'student',
        roomNumber,
        phone
      });

      if (res.error) {
        throw new Error(res.error.message || 'Registration failed');
      }

      await checkSession();
      return user;
    } catch (err) {
      // Fallback to helper register
      try {
        const fallbackData = await api.register({ name, email: cleanEmail, password, phone, roomNumber });
        localStorage.setItem('mess_auth_token', fallbackData.token);
        localStorage.setItem('mess_user_session', JSON.stringify(fallbackData.user));
        setUser(fallbackData.user);
        return fallbackData.user;
      } catch {
        throw err;
      }
    }
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
      if (user.role === 'student') {
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
    <AuthContext.Provider value={{ user, loading, login, register, sendOtp, loginWithOtp, logout, refreshUser }}>
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
