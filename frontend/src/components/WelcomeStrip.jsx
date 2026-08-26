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
  const roleIconBox = isStudent
    ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/30 text-[#8B5CF6] shadow-[0_0_16px_rgba(139,92,246,0.3)]'
    : isChef
    ? 'bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B] shadow-[0_0_16px_rgba(245,158,11,0.3)]'
    : 'bg-[#F43F5E]/15 border-[#F43F5E]/30 text-[#F43F5E] shadow-[0_0_16px_rgba(244,63,94,0.3)]';

  const roleNameGradient = isStudent
    ? 'bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#06B6D4] bg-clip-text text-transparent'
    : isChef
    ? 'bg-gradient-to-r from-[#F59E0B] to-[#38BDF8] bg-clip-text text-transparent'
    : 'bg-gradient-to-r from-[#F43F5E] to-[#06B6D4] bg-clip-text text-transparent';

  const roleBadgeStyle = isStudent
    ? 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30 shadow-[0_0_8px_rgba(139,92,246,0.2)]'
    : isChef
    ? 'bg-[#F59E0B]/15 text-amber-300 border-[#F59E0B]/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
    : 'bg-[#F43F5E]/15 text-rose-300 border-[#F43F5E]/30 shadow-[0_0_8px_rgba(244,63,94,0.2)]';

  // Dynamic time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user.name || user.email?.split('@')[0] || 'User';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
      
      {/* Left: Greeting & Role Badge */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base shrink-0 ${roleIconBox}`}>
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
            <h1 className="text-xl sm:text-2xl font-bold text-[#F1F5F9] font-heading tracking-tight">
              {getGreeting()}, <span className={roleNameGradient}>{displayName}</span>
            </h1>
            
            <span className={`text-[11px] py-0.5 px-2.5 rounded-full font-semibold border ${roleBadgeStyle}`}>
              {isChef ? 'Chef Station' : isAdmin ? 'Campus Governance' : 'Student Account'}
            </span>
          </div>

          <p className="text-xs text-[#94A3B8] mt-0.5">
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
      <div className="flex items-center gap-2 text-xs text-[#94A3B8] font-medium bg-[#131728]/90 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto backdrop-blur-md shadow-sm">
        <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
        <span className="text-[#F1F5F9] font-heading">{currentDateTime || 'Today'}</span>
      </div>

    </div>
  );
}
