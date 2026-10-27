import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, ShieldCheck, GraduationCap, ChefHat, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function WelcomeStrip({ subtitle }) {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      };
      setCurrentDateTime(now.toLocaleDateString('en-US', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const isChef = user.role === 'chef' || user.isChef;
  const isAdmin = user.role === 'admin' || user.isAdmin;
  const isStudent = user.role === 'student' || user.isStudent;

  // Role Accents
  const roleAccentColor = isStudent ? '#FF6B35' : isChef ? '#EA580C' : '#C2410C';

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
      
      {/* Left: Greeting & Role Badge */}
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-xl bg-[#FFF7F0] border border-orange-200/80 flex items-center justify-center font-bold text-base shrink-0 shadow-soft-sm"
          style={{ color: roleAccentColor }}
        >
          {isChef ? (
            <ChefHat className="w-5 h-5" />
          ) : isAdmin ? (
            <ShieldCheck className="w-5 h-5" />
          ) : (
            <GraduationCap className="w-5 h-5" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E1B16] font-heading tracking-tight">
              {getGreeting()}, <span style={{ color: roleAccentColor }}>{displayName}</span>
            </h1>
            
            <span 
              className="text-[11px] py-0.5 px-2.5 rounded-full font-semibold border shadow-soft-sm"
              style={{ backgroundColor: '#FFF7F0', color: roleAccentColor, borderColor: '#FED7AA' }}
            >
              {isChef ? 'Chef Station' : isAdmin ? 'Campus Governance' : 'Student Account'}
            </span>
          </div>

          <p className="text-xs text-[#6B6560] mt-0.5">
            {subtitle || (
              isChef 
                ? 'Live kitchen queue dispatch & portion inventory management' 
                : isAdmin 
                ? 'Campus dining credit controls, menu pricing & financial ledger'
                : 'VIT Campus Mess • 9,000 monthly dining credits allowance'
            )}
          </p>
        </div>
      </div>

      {/* Right: Date & Time Pill */}
      <div className="flex items-center gap-2 text-xs text-[#6B6560] font-medium bg-[#FFFFFF] border border-stone-200 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-soft-sm">
        <Calendar className="w-3.5 h-3.5 text-[#FF6B35]" />
        <span className="text-[#1E1B16] font-heading">{currentDateTime || 'Today'}</span>
      </div>

    </div>
  );
}
