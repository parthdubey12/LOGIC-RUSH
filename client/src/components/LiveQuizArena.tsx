import React, { useState, useEffect } from 'react';
import { PublicQuestion, LeaderboardEntry } from '../types';
import { getSocket } from '../services/socket';
import { sound } from '../services/audio';
import {
  Zap,
  Clock,
  Brain,
  Flame,
  Sparkles,
  ArrowRight,
  Award,
  Maximize,
  Minimize,
  ShieldAlert,
  Video
} from 'lucide-react';

interface LiveQuizArenaProps {
  question: PublicQuestion;
  roundState: 'question' | 'round_review';
  roundResult?: {
    correctOptionIndex: number;
    explanation: string;
    leaderboard: LeaderboardEntry[];
    isLastQuestion: boolean;
  } | null;
  answeredCount: number;
  totalPlayers: number;
  isHost: boolean;
  isSpectator?: boolean;
  hasSubmittedInitially?: boolean;
  onNextRound: () => void;
}

export const LiveQuizArena: React.FC<LiveQuizArenaProps> = ({
  question,
  roundState,
  roundResult,
  answeredCount,
  totalPlayers,
  isHost,
  isSpectator = false,
  hasSubmittedInitially = false,
  onNextRound
}) => {
  const socket = getSocket();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [doublePointsActive, setDoublePointsActive] = useState(false);

  // Proctoring & Anti-Cheat State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabViolations, setTabViolations] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [hostProctorAlerts, setHostProctorAlerts] = useState<any[]>([]);

  // Time remaining countdown
  const [timeLeft, setTimeLeft] = useState(question.timeLimitSec);
  let questionTable: unknown[][] | null = null;
  if (question.table_data) {
    try {
      const parsed: unknown = JSON.parse(question.table_data);
      if (Array.isArray(parsed) && parsed.every(row => Array.isArray(row))) {
        questionTable = parsed as unknown[][];
      }
    } catch {
      questionTable = null;
    }
  }

  // Reset per question round
  useEffect(() => {
    setSelectedOption(null);
    setHasSubmitted(hasSubmittedInitially);
    setEliminatedOptions([]);
    setDoublePointsActive(false);
    setTimeLeft(Math.ceil((question.remainingTimeMs ?? question.timeLimitSec * 1000) / 1000));
  }, [question.id, question.index, hasSubmittedInitially]);

  // Tab switch anti-cheat detection (Only for students)
  useEffect(() => {
    if (isHost || isSpectator || isDisqualified) return;

    const handleViolation = () => {
      socket.emit('tab_switch_violation');
      sound.playWrong();
    };

    const handleVisibilityChange = () => {
      if (document.hidden && roundState === 'question') {
        handleViolation();
      }
    };

    const handleBlur = () => {
      if (roundState === 'question') {
        handleViolation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [socket, isHost, isSpectator, isDisqualified, roundState]);

  // Socket Proctoring Listeners
  useEffect(() => {
    socket.on('tab_switch_warning', (data) => {
      setTabViolations(data.violationsCount);
      setShowWarningModal(true);
    });

    socket.on('test_disqualified', (data) => {
      setIsDisqualified(true);
    });

    // Host live proctor alerts
    socket.on('host_proctor_alert', (alertData) => {
      if (isHost) {
        setHostProctorAlerts((prev) => [alertData, ...prev.slice(0, 5)]);
      }
    });

    return () => {
      socket.off('tab_switch_warning');
      socket.off('test_disqualified');
      socket.off('host_proctor_alert');
    };
  }, [socket, isHost]);

  // Authoritative countdown timer based on server start time
  useEffect(() => {
    if (roundState !== 'question' || isDisqualified) return;

    const initialRemainingMs = question.remainingTimeMs ?? question.timeLimitSec * 1000;
    const receivedAt = question.receivedAt ?? performance.now();
    const interval = setInterval(() => {
      const elapsedSinceReceipt = performance.now() - receivedAt;
      const remaining = Math.max(0, Math.ceil((initialRemainingMs - elapsedSinceReceipt) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 5 && remaining > 0) {
        sound.playTick();
      }

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [roundState, question.receivedAt, question.remainingTimeMs, question.timeLimitSec, isDisqualified]);

  // Keyboard shortcut listener (1, 2, 3, 4 / A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (roundState !== 'question' || hasSubmitted || isDisqualified || isSpectator || isHost) return;

      const key = e.key.toUpperCase();
      let index = -1;
      if (key === '1' || key === 'A') index = 0;
      else if (key === '2' || key === 'B') index = 1;
      else if (key === '3' || key === 'C') index = 2;
      else if (key === '4' || key === 'D') index = 3;

      if (index >= 0 && index < question.options.length && !eliminatedOptions.includes(index)) {
        handleOptionSubmit(index);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roundState, hasSubmitted, question.options, eliminatedOptions, isDisqualified, isSpectator, isHost]);

  // Powerup socket events listener
  useEffect(() => {
    const handlePowerupResult = (data: any) => {
      sound.playPowerup();
      if (data.powerUpType === 'fiftyFifty') {
        setEliminatedOptions(data.eliminatedIndices || []);
      } else if (data.powerUpType === 'doublePoints') {
        setDoublePointsActive(true);
      }
    };

    socket.on('powerup_result', handlePowerupResult);
    return () => {
      socket.off('powerup_result', handlePowerupResult);
    };
  }, [socket]);

  const handleOptionSubmit = (optionIndex: number) => {
    if (hasSubmitted || roundState !== 'question' || isDisqualified) return;

    setSelectedOption(optionIndex);
    setHasSubmitted(true);
    sound.playTick();

    socket.emit('submit_answer', { selectedOptionIndex: optionIndex });
  };

  const handleUsePowerup = (type: string) => {
    socket.emit('use_powerup', { powerUpType: type });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const totalDuration = question.timeLimitSec;
  const timerPercentage = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative">
      
      {/* Tab Switch Warning Overlay */}
      {showWarningModal && !isDisqualified && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-rose-600/30 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/40 animate-bounce">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h4 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
            PROCTORING VIOLATION DETECTED!
          </h4>
          <p className="text-sm text-rose-300 font-bold mt-2">
            Tab switch / Focus loss detected ({tabViolations}/2 Warnings).
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-md">
            <strong className="text-rose-400 font-mono">-200 Penalty Points</strong> deducted. The host has been notified in real time.
            One more tab switch will permanently disqualify you from this match!
          </p>
          <button
            onClick={() => setShowWarningModal(false)}
            className="mt-6 px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30"
          >
            I Understand — Return to Exam
          </button>
        </div>
      )}

      {/* Disqualification Lock Screen */}
      {isDisqualified && (
        <div className="glass-panel rounded-3xl p-10 bg-rose-950/90 border-2 border-rose-500 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-600/30 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/40">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-black text-white font-['Outfit']">YOU HAVE BEEN DISQUALIFIED</h3>
          <p className="text-sm text-rose-300 max-w-md mx-auto">
            You exceeded the maximum allowable tab switch limit (2 warnings max). Your test submission has been terminated by the proctoring engine.
          </p>
        </div>
      )}

      {/* Host Real-Time Proctoring Feed Banner (Visible to Host) */}
      {isHost && hostProctorAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-3 animate-fadeIn">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-extrabold text-rose-300 uppercase block mb-1">
              🚨 Host Anti-Cheat Feed: Real-Time Tab Violations
            </span>
            <div className="space-y-1">
              {hostProctorAlerts.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] bg-slate-950/60 p-1.5 rounded-lg">
                  <span className="font-bold text-white">{a.studentName} ({a.violationsCount}/2 Tab Switches)</span>
                  <span className="text-rose-400 font-mono font-bold">-200 Points Deducted</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isDisqualified && (
        <>
          {/* 1. ARENA TOP HUD: Question Progress, Fullscreen Toggle & Answered Count */}
          <div className="glass-panel-glow rounded-3xl p-4 sm:p-6 bg-slate-900/90 border border-purple-500/30">
            <div className="flex items-center justify-between gap-4">
              
              {/* Question Index & Proctoring Badge */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-mono font-black text-sm">
                  Q {question.index} / {question.total}
                </span>
                {isSpectator ? (
                  <div className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/40 text-xs font-bold">
                    PROJECTOR VIEW • WATCHING
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold">
                    <Video className="w-3 h-3" />
                    <span className="hidden sm:inline">PROCTORED LOCK ACTIVE</span>
                  </div>
                )}
              </div>

              {/* Center: Authoritative Countdown Timer */}
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`transition-all duration-300 ${
                        timeLeft <= 5 ? 'text-rose-500' : timeLeft <= 10 ? 'text-amber-400' : 'text-cyan-400'
                      }`}
                      strokeDasharray={`${timerPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className={`absolute text-lg font-mono font-black ${
                    timeLeft <= 5 ? 'text-rose-400 animate-ping' : timeLeft <= 10 ? 'text-amber-400' : 'text-white'
                  }`}>
                    {timeLeft}
                  </span>
                </div>
              </div>

              {/* Right: Fullscreen Toggle & Live Answered Counter */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullscreen}
                  title="Toggle Fullscreen"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">SUBMITTED</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {answeredCount} of {totalPlayers || 1}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* 2. QUESTION CARD & JUMBLED OPTIONS */}
          <div className="glass-panel rounded-3xl p-6 sm:p-10 bg-dark-card border border-slate-800 relative overflow-hidden">
            
            {/* Active Powerup Indicators */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {doublePointsActive && (
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> 2X Double Points Active
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-semibold capitalize ml-auto">
                {question.difficulty} Tier (Options Jumbled)
              </span>
            </div>

            {/* Question Statement */}
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-relaxed tracking-tight mb-8">
              {question.statement}
            </h3>

            {question.image_url && (
              <img
                src={question.image_url}
                alt="Question illustration"
                loading="lazy"
                className="question-media max-h-72 max-w-full object-contain rounded-xl mb-6"
              />
            )}
            {questionTable && (
              <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 mb-6">
                <table className="w-full text-left text-sm text-slate-100">
                  <tbody>
                    {questionTable.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex === 0 ? 'bg-slate-800 font-bold' : 'border-t border-slate-800'}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-3">{String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4 Answer Options Grid */}
            <div className={`grid grid-cols-1 ${isSpectator ? 'lg:grid-cols-2' : 'sm:grid-cols-2'} gap-4`}>
              {question.options.map((optionText, idx) => {
                const isEliminated = eliminatedOptions.includes(idx);
                const isSelected = selectedOption === idx;

                let buttonStyle = 'bg-slate-900/90 border-slate-700/80 text-slate-100 hover:border-purple-500/70 hover:bg-slate-800';

                if (isEliminated) {
                  buttonStyle = 'bg-slate-950/40 border-slate-900 text-slate-600 line-through opacity-30 cursor-not-allowed';
                } else if (roundState === 'question') {
                  if (isSelected) {
                    buttonStyle = 'bg-purple-600/40 border-purple-400 text-white shadow-lg shadow-purple-500/20';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isSpectator || isHost || hasSubmitted || isEliminated || roundState !== 'question'}
                    onClick={() => handleOptionSubmit(idx)}
                    className={`${isSpectator ? 'p-7 text-xl' : 'p-5'} rounded-2xl border text-left font-bold transition-all relative flex items-center justify-between ${buttonStyle}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="w-8 h-8 rounded-xl bg-slate-950/90 flex items-center justify-center font-mono font-bold text-xs border border-slate-700 text-purple-300">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-base sm:text-lg">{optionText}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* In-Game Power-Ups Bar */}
            {roundState === 'question' && !hasSubmitted && !isSpectator && !isHost && (
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-brand-cyan" />
                  Tactical Power-Ups:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUsePowerup('fiftyFifty')}
                    disabled={eliminatedOptions.length > 0}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-40"
                  >
                    50/50
                  </button>

                  <button
                    onClick={() => handleUsePowerup('doublePoints')}
                    disabled={doublePointsActive}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-40"
                  >
                    2X Points
                  </button>

                </div>
              </div>
            )}

          </div>

          {/* 3. ROUND REVIEW & LEADERBOARD STANDINGS */}
          {roundState === 'round_review' && roundResult && (
            <div className="glass-panel-glow rounded-3xl p-6 bg-dark-card border border-purple-500/40 space-y-6 animate-fadeIn">
              
              {/* Solution Banner */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <h4 className="text-xs font-extrabold uppercase text-cyan-400 tracking-wider mb-1 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-brand-cyan" />
                  Step-by-Step Mathematical Derivation
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {roundResult.explanation}
                </p>
              </div>

              {/* Live Round Standings */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Live Round Standings & Disqualification Status
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">Instant Speed Multipliers Applied</span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {roundResult.leaderboard.slice(0, 5).map((player, r) => (
                    <div
                      key={player.userId || r}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                        player.isDisqualified
                          ? 'bg-rose-950/40 border-rose-500/40 text-rose-400 line-through'
                          : player.socketId === socket.id
                          ? 'bg-purple-950/80 border-purple-500 text-white shadow-md'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-slate-500 font-mono">#{player.rank}</span>
                        <span className="text-base">{player.avatar}</span>
                        <span className="truncate max-w-[150px]">{player.name}</span>
                        {player.isDisqualified && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-extrabold">
                            DISQUALIFIED
                          </span>
                        )}
                        {player.streak > 1 && !player.isDisqualified && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] flex items-center gap-0.5">
                            <Flame className="w-3 h-3 fill-amber-400" />
                            {player.streak}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {player.lastPoints ? (
                          <span className="text-emerald-400 font-extrabold">+{player.lastPoints} pts</span>
                        ) : (
                          <span className="text-slate-500">0 pts</span>
                        )}
                        <span className="font-mono text-purple-300 font-black text-sm">{player.score} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advance Round Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={onNextRound}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all flex items-center gap-2"
                >
                  <span>{roundResult.isLastQuestion ? 'View Final Podium & Results' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
};
