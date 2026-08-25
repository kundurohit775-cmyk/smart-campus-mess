import { createAuthClient } from 'better-auth/react';

const getAuthBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://smart-campus-mess.onrender.com';
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://smart-campus-mess.onrender.com';
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseUrl()
});

export const { signIn, signUp, signOut, useSession } = authClient;
