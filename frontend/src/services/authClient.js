import { createAuthClient } from 'better-auth/react';

const rawApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';

export const authClient = createAuthClient({
  baseURL: rawApiUrl || 'http://localhost:5050'
});

export const { signIn, signUp, signOut, useSession } = authClient;
