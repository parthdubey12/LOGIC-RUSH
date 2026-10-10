import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AnalyticsData } from '../types';
import {
  Zap,
  Play,
  LogIn,
  Brain,
  Trophy,
  Target,
  Flame,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sliders,
  CheckCircle2,
  Share2,
  BookOpen,
  Award,
  Layers
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface StudentDashboardProps {
  onQuickPlay: () => void;
  onJoinRoom: (code: string) => void;
  onOpenCustomQuizCreator: (initialTopicId?: string) => void;
  onOpenTopics: () => void;
  onOpenAnalytics: () => void;
  onOpenLeagues: () => void;
}

const PLAYFUL_MICROCOPY = [
  '⚡ Your brain has entered the arena.',
  '📐 Algebra is looking suspicious today.',
  '🎯 One more round? Your future placement says yes.',
  '☕ Your accuracy is cooking. Your speed needs coffee.',
  '🚀 Ready to outsmart 50 students in 20 seconds?'
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onQuickPlay,
  onJoinRoom,
  onOpenCustomQuizCreator,
  onOpenTopics,
  onOpenAnalytics,
  onOpenLeagues
}) => {
  const { user, profile } = useAuth();
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [randomQuote] = useState(
    () => PLAYFUL_MICROCOPY[Math.floor(Math.random() * PLAYFUL_MICROCOPY.length)]
  );

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    api.getMyAnalytics()
      .then((data) => {
        setAnalyticsData(data);
      })
      .catch((err) => console.warn('Failed to load dashboard analytics:', err))
      .finally(() => setIsLoadingStats(false));
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      onJoinRoom(joinCodeInput.trim().toUpperCase());
    }
  };

  const weakTopic = analyticsData?.weaknesses?.[0] || {
    name: 'Time, Speed and Distance',
    topic_id: 'tsd',
    accuracy: 45,
    cause: 'Unit Conversion & Train Relative Velocity',
    advice: 'Review the 5/18 conversion shortcut and opposite-direction train sum formula.'
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. HERO GREETING & STUDENT STATS HEADER */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-cyan-950/30 border border-purple-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          
          {/* Avatar & Player Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center text-3xl shadow-lg shadow-purple-500/30 border-2 border-purple-400/40">
              {profile?.avatar || '⚡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  {profile?.name || user?.email?.split('@')[0] || 'Student Player'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                  Student Tier • Lvl {profile?.level || 1}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile?.college || 'LogicRush Campus'} • {profile?.course || 'Computer Science'} ({profile?.year || '3rd Year'})
              </p>
              <p className="text-xs text-brand-cyan font-semibold mt-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {randomQuote}
              </p>
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Streak</span>
              <div className="text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-amber-400" />
                {profile?.streak || 1}d
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total XP</span>
              <div className="text-lg font-black text-purple-300">
                {profile?.xp || 100}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Accuracy</span>
              <div className="text-lg font-black text-emerald-400">
                {profile?.accuracy ? `${profile.accuracy}%` : '85%'}
              </div>
            </div>

            <div className="hidden sm:block bg-slate-900/80 border border-slate-800 p-3 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Matches</span>
              <div className="text-lg font-black text-cyan-300">
                {profile?.total_games || 12}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 2. STUDENT GAMEPLAY ACTIONS (Create Custom Quiz + Quick Play + Join Room Code) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ACTION 1: CREATE OWN CUSTOM QUIZ (WIZARD) */}
        <div className="glass-panel-glow rounded-3xl p-6 bg-gradient-to-br from-purple-900/40 to-slate-900/90 border-2 border-purple-500/50 flex flex-col justify-between shadow-xl shadow-purple-500/10">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center shadow">
                <Sliders className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                Custom Setup
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Create Custom Quiz</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Design your own practice sprint: select specific topics, difficulty (Easy to Hard), timer, and question count.
            </p>
          </div>

          <button
            onClick={() => onOpenCustomQuizCreator()}
            className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-extrabold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Sliders className="w-4 h-4" />
            Configure & Start Own Quiz
          </button>
        </div>

        {/* ACTION 2: QUICK PLAY LIVE ARENA */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Arena
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Quick Match</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hop directly into an active live multiplayer queue with up to 50 players and live score multiplier decay.
            </p>
          </div>

          <button
            onClick={onQuickPlay}
            className="mt-6 w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            Find Live Arena Match
          </button>
        </div>

        {/* ACTION 3: JOIN WITH ROOM CODE */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <LogIn className="w-5 h-5" />
              </div>
              <span className="text-xs text-slate-400 font-semibold">Faculty / Class Code</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">Join Room</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter the 6-character room join code provided by your professor, host, or tournament coordinator.
            </p>
          </div>

          <form onSubmit={handleJoinSubmit} className="mt-4 flex gap-2">
            <input
              type="text"
              maxLength={8}
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. RUSH26"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-sm tracking-widest text-white uppercase focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!joinCodeInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand-cyan hover:bg-cyan-400 text-slate-950 font-extrabold text-sm transition-colors disabled:opacity-40 shrink-0"
            >
              Join
            </button>
          </form>
        </div>

      </div>

      {/* 3. WEAKEST TOPIC ALERT — LOGICRUSH INTELLIGENCE */}
      <div className="glass-panel rounded-3xl p-6 border-rose-500/30 bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Weakness Alert • LogicRush Intelligence
                </span>
                <span className="text-xs text-slate-500">({weakTopic.accuracy}% Accuracy)</span>
              </div>
              <h4 className="text-lg font-bold text-white mt-0.5">
                {weakTopic.name} needs attention
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                <strong className="text-rose-300">Root Cause:</strong> {weakTopic.cause}. {weakTopic.advice}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onOpenCustomQuizCreator(weakTopic.topic_id)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              Configure Weakness Drill
            </button>
          </div>
        </div>
      </div>

      {/* 4. PERFORMANCE TREND CHART & LEAGUE STANDINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly XP & Accuracy Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-violet" />
                Performance & Placement Readiness Trend
              </h4>
              <p className="text-xs text-slate-400">Weekly XP velocity and speed consistency</p>
            </div>
            <button
              onClick={onOpenAnalytics}
              className="text-xs font-bold text-purple-400 hover:text-purple-300"
            >
              Full Analytics →
            </button>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData?.weeklyProgress || [
                { day: 'Mon', xp: 240, accuracy: 70 },
                { day: 'Tue', xp: 480, accuracy: 74 },
                { day: 'Wed', xp: 320, accuracy: 78 },
                { day: 'Thu', xp: 650, accuracy: 82 },
                { day: 'Fri', xp: 510, accuracy: 80 },
                { day: 'Sat', xp: 820, accuracy: 86 },
                { day: 'Sun', xp: 750, accuracy: 88 }
              ]}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="xp" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" name="XP Earned" />
                <Area type="monotone" dataKey="accuracy" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorAcc)" name="Accuracy %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Challenge & League Standings Mini */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Inter-College League
              </h4>
              <button onClick={onOpenLeagues} className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
                View All
              </button>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, name: 'IIT Bombay', points: '14,200', badge: '🥇' },
                { rank: 2, name: 'BITS Pilani', points: '12,850', badge: '🥈' },
                { rank: 3, name: 'IIIT Hyderabad', points: '11,900', badge: '🥉' },
                { rank: 4, name: 'NIT Trichy', points: '10,400', badge: '⭐' }
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs">
                  <div className="flex items-center gap-2">
                    <span>{c.badge}</span>
                    <span className="font-bold text-slate-200">{c.name}</span>
                  </div>
                  <span className="font-mono text-purple-300 font-extrabold">{c.points} pts</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
