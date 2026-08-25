import React, { useState, useEffect } from 'react';
import { LandingRoleSelect } from './LandingRoleSelect';
import { StudentLogin } from './auth/StudentLogin';
import { ChefLogin } from './auth/ChefLogin';
import { AdminLogin } from './auth/AdminLogin';

export function Login() {
  // Determine initial role from URL pathname
  const getRoleFromPath = () => {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/login/student')) return 'student';
    if (path.includes('/login/chef')) return 'chef';
    if (path.includes('/login/admin')) return 'admin';
    return null; // Landing / Role selection
  };

  const [selectedRole, setSelectedRole] = useState(getRoleFromPath);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setSelectedRole(getRoleFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    window.history.pushState({ role }, '', `/login/${role}`);
  };

  const handleBackToLanding = () => {
    setSelectedRole(null);
    window.history.pushState({}, '', '/');
  };

  if (selectedRole === 'student') {
    return <StudentLogin onBack={handleBackToLanding} />;
  }

  if (selectedRole === 'chef') {
    return <ChefLogin onBack={handleBackToLanding} />;
  }

  if (selectedRole === 'admin') {
    return <AdminLogin onBack={handleBackToLanding} />;
  }

  return <LandingRoleSelect onSelectRole={handleSelectRole} />;
}
