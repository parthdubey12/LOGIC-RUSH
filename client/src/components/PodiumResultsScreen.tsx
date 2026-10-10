import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { LeaderboardEntry, TeamLeaderboardEntry } from '../types';
import { sound } from '../services/audio';
import {
  Trophy,
  Medal,
  Flame,
  Zap,
  Target,
  Clock,
  Sparkles,
  RotateCcw,
  LayoutDashboard,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface PodiumResultsScreenProps {
  podium: LeaderboardEntry[];
  leaderboard: LeaderboardEntry[];
  teamLeaderboard?: TeamLeaderboardEntry[];
  totalQuestions: number;
  topic?: string;
  roomTitle?: string;
  onPlayAgain: () => void;
  onGoDashboard: () => void;
  onFixWeakness: () => void;
}

export const PodiumResultsScreen: React.FC<PodiumResultsScreenProps> = ({
  podium,
  leaderboard,
  teamLeaderboard = [],
  totalQuestions,
  topic,
  roomTitle,
  onPlayAgain,
  onGoDashboard,
  onFixWeakness
}) => {
  useEffect(() => {
    sound.playVictory();

    // Trigger celebratory confetti burst
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#8B5CF6', '#06B6D4', '#84CC16', '#F59E0B', '#EC4899'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const firstPlace = podium[0];
  const secondPlace = podium[1];
  const thirdPlace = podium[2];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* 1. ARENA VICTORY PODIUM */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
          <Trophy className="w-4 h-4 text-amber-400" />
          Match Concluded • Arena Grand Final
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white font-['Outfit'] tracking-tight">
          VICTORY <span className="text-gradient">PODIUM</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-medium">
          {roomTitle || 'Live Multiplayer Match'} • {totalQuestions} Questions High-Speed Aptitude
        </p>
      </div>

      {/* 3-Tier Esports Podium Stand */}
      {teamLeaderboard.length > 0 && (
        <section className="glass-panel rounded-3xl p-5 bg-slate-900/90 border border-cyan-500/30">
          <h3 className="text-lg font-bold text-white mb-3">Team Battle · Combined Scores</h3>
          <ol className="space-y-2">
            {teamLeaderboard.map((team) => (
              <li key={team.teamId} className="flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm">
                <span className="font-bold text-white">#{team.rank} · {team.name} <span className="text-xs text-slate-400">({team.memberCount} players)</span></span>
                <span className="font-mono font-black text-cyan-300">{team.score.toLocaleString()} pts</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto items-end pt-8">
        
        {/* 2nd Place */}
        {secondPlace ? (
          <div className="text-center flex flex-col items-center animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-2xl sm:text-3xl mb-2 shadow-lg">
              {secondPlace.avatar || '🥈'}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-[100px]">{secondPlace.name}</span>
            <span className="text-[11px] font-mono text-purple-300 font-bold">{secondPlace.score} pts</span>
            <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t-2 border-slate-400 flex flex-col items-center justify-center mt-2 shadow-inner">
              <span className="text-2xl font-black text-slate-300 font-mono">#2</span>
              <span className="text-[10px] text-slate-400 font-bold">SILVER</span>
            </div>
          </div>
        ) : <div />}

        {/* 1st Place (Champion) */}
        {firstPlace ? (
          <div className="text-center flex flex-col items-center animate-fadeIn">
            <div className="relative">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center text-3xl sm:text-4xl mb-2 shadow-xl shadow-amber-500/30">
                {firstPlace.avatar || '👑'}
              </div>
              <Trophy className="w-6 h-6 text-yellow-300 fill-yellow-400 absolute -top-4 -right-2 filter drop-shadow animate-bounce" />
            </div>
            <span className="text-sm font-black text-white truncate max-w-[120px]">{firstPlace.name}</span>
            <span className="text-xs font-mono text-amber-300 font-black">{firstPlace.score} pts</span>
            <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-amber-900/60 to-amber-600/60 rounded-t-2xl border-t-2 border-yellow-400 flex flex-col items-center justify-center mt-2 shadow-lg shadow-amber-500/10">
              <span className="text-3xl font-black text-yellow-300 font-mono">#1</span>
              <span className="text-xs text-yellow-200 font-extrabold tracking-wider">CHAMPION</span>
            </div>
          </div>
        ) : <div />}

        {/* 3rd Place */}
        {thirdPlace ? (
          <div className="text-center flex flex-col items-center animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-2xl sm:text-3xl mb-2 shadow-lg">
              {thirdPlace.avatar || '🥉'}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-[100px]">{thirdPlace.name}</span>
            <span className="text-[11px] font-mono text-purple-300 font-bold">{thirdPlace.score} pts</span>
            <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-900 to-amber-950/60 rounded-t-2xl border-t-2 border-amber-700 flex flex-col items-center justify-center mt-2 shadow-inner">
              <span className="text-xl font-black text-amber-500 font-mono">#3</span>
              <span className="text-[10px] text-amber-600 font-bold">BRONZE</span>
            </div>
          </div>
        ) : <div />}

      </div>

      {/* 2. FULL MATCH LEADERBOARD & XP REWARDS */}
      <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Medal className="w-4 h-4 text-purple-400" />
          Full Match Results & Rewards
        </h3>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {leaderboard.map((p) => (
            <div
              key={p.userId || p.rank}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-bold text-slate-500">#{p.rank}</span>
                <span className="text-lg">{p.avatar || '⚡'}</span>
                <div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400">{p.college || 'Arena'}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <div className="font-mono text-purple-300 font-black text-sm">{p.score} pts</div>
                  <div className="text-[10px] text-emerald-400 font-semibold">{p.correctCount} of {totalQuestions} Correct</div>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-extrabold border border-purple-500/30">
                  +{p.xpEarned || 150} XP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. POST-MATCH ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        
        <button
          onClick={onPlayAgain}
          className="p-4 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:opacity-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Play Another Round
        </button>

        <button
          onClick={onFixWeakness}
          className="p-4 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-bold text-sm border border-rose-500/30 flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4 text-rose-400" />
          Fix Match Weak Points
        </button>

        <button
          onClick={onGoDashboard}
          className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-sm border border-slate-800 flex items-center justify-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Return to Dashboard
        </button>

      </div>

    </div>
  );
};
