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
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setSelectedRole(getRoleFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectRole = (role) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedRole(role);
      window.history.pushState({ role }, '', `/login/${role}`);
      setIsTransitioning(false);
    }, 150);
  };

  const handleBackToLanding = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedRole(null);
      window.history.pushState({}, '', '/');
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {selectedRole === 'student' && <StudentLogin onBack={handleBackToLanding} />}
      {selectedRole === 'chef' && <ChefLogin onBack={handleBackToLanding} />}
      {selectedRole === 'admin' && <AdminLogin onBack={handleBackToLanding} />}
      {!selectedRole && <LandingRoleSelect onSelectRole={handleSelectRole} />}
    </div>
  );
}
