/**
 * Application Constants
 */
export const CHEF_EMAIL = import.meta.env.VITE_CHEF_EMAIL || 'vitchef775@gmail.com';

export const isChefEmail = (email) => {
  if (!email) return false;
  return email.trim().toLowerCase() === CHEF_EMAIL.trim().toLowerCase();
};
