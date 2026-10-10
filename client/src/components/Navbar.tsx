import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../services/audio';
import {
  Zap,
  Brain,
  BarChart3,
  Trophy,
  ShieldAlert,
  Volume2,
  VolumeX,
  LogOut,
  User as UserIcon,
  Sparkles,
  Flame,
  LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'student' | 'host') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, onOpenAuth }) => {
  const { user, profile, isAuthenticated, isHost, logout } = useAuth();
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white font-['Outfit']">LOGIC<span className="text-brand-cyan">RUSH</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-violet/20 text-brand-violet border border-brand-violet/30">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Think Fast. Play Smart.</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-1">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              <button
                onClick={() => onNavigate('topics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'topics'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Brain className="w-4 h-4" />
                Topics
              </button>

              <button
                onClick={() => onNavigate('analytics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  currentView === 'analytics'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
                <span className="w-2 h-2 rounded-full bg-brand-rose animate-ping absolute top-2 right-1.5" />
              </button>

              <button
                onClick={() => onNavigate('leagues')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'leagues'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Leagues
              </button>

              {isHost && (
                <button
                  onClick={() => onNavigate('host_portal')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'host_portal'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-emerald-400 hover:bg-emerald-950/40 border border-emerald-500/20'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Host Portal
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('landing')}
                className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('topics')}
                className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                Topics & Curriculum
              </button>
              <button
                onClick={() => onNavigate('leagues')}
                className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                Leagues & Leaderboard
              </button>
            </>
          )}
        </nav>

        {/* Right Controls: Sound, Profile & Actions */}
        <div className="flex items-center gap-3">
          
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute game sounds' : 'Mute game sounds'}
            className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors border border-slate-700"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Stats Pill */}
              <div 
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2.5 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-full cursor-pointer hover:border-purple-500/50 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                  {profile?.avatar || '⚡'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    {profile?.name || user?.email?.split('@')[0]}
                    {profile?.streak ? (
                      <span className="text-[11px] text-amber-400 flex items-center font-extrabold">
                        <Flame className="w-3 h-3 fill-amber-400 text-amber-500" />
                        {profile.streak}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    {profile?.xp || 100} XP (Lvl {profile?.level || 1})
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  onNavigate('landing');
                }}
                title="Logout"
                className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors border border-slate-800"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('student')}
                className="px-4 py-2 text-sm font-bold text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('student')}
                className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-brand-violet to-brand-cyan hover:opacity-95 rounded-xl shadow-lg shadow-purple-500/20 transition-all"
              >
                Play Now
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
