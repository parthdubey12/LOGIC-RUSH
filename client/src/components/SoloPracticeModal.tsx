import React, { useState, useEffect, useRef } from 'react';
import { Question } from '../types';
import { sound } from '../services/audio';
import { api } from '../services/api';
import {
  X,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Brain,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
  Maximize,
  Minimize,
  ShieldAlert,
  AlertTriangle,
  Video
} from 'lucide-react';

interface SoloPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  title?: string;
  dailyChallengeId?: string | null;
  practiceSessionId?: string | null;
}

// Local helper to jumble options
function jumbleOptions(options: string[], correctIndex: number) {
  if (!options || !Array.isArray(options)) return { shuffledOptions: [], newCorrectIndex: 0, originalIndices: [] };
  const indexed = options.map((opt, i) => ({ text: opt, originalIndex: i }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  return {
    shuffledOptions: indexed.map(item => item.text),
    newCorrectIndex: indexed.findIndex(item => item.originalIndex === correctIndex),
    originalIndices: indexed.map(item => item.originalIndex)
  };
}

export const SoloPracticeModal: React.FC<SoloPracticeModalProps> = ({
  isOpen,
  onClose,
  questions,
  title = 'Solo Practice Drill',
  dailyChallengeId = null,
  practiceSessionId = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [dailyResult, setDailyResult] = useState<{ xpGained: number; streak: number } | null>(null);
  const [answerExplanation, setAnswerExplanation] = useState('');

  // Proctoring & Anti-Cheat State
  const [tabViolations, setTabViolations] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Per-question jumbled options
  const [currentJumbled, setCurrentJumbled] = useState<{ shuffledOptions: string[]; newCorrectIndex: number; originalIndices: number[] }>({
    shuffledOptions: [],
    newCorrectIndex: 0,
    originalIndices: []
  });

  // Per-question timer
  const [timeLeft, setTimeLeft] = useState(25);

  // Reset when opened
  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setHasAnswered(false);
      setScore(0);
      setCorrectCount(0);
      setIsFinished(false);
      setIsSubmitting(false);
      setSubmissionError('');
      setDailyResult(null);
      setAnswerExplanation('');
      setTabViolations(0);
      setShowWarningModal(false);
      setIsDisqualified(false);
    }
  }, [isOpen]);

  // Jumble options when question changes
  useEffect(() => {
    if (questions[currentIndex]) {
      const q = questions[currentIndex];
      const jumbled = jumbleOptions(q.options, q.correct_option ?? 0);
      setCurrentJumbled(jumbled);
      setAnswerExplanation('');
    }
  }, [currentIndex, questions]);

  // Tab Switch & Window Focus Loss Detection
  useEffect(() => {
    if (!isOpen || isFinished || isDisqualified) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    const handleViolation = () => {
      sound.playWrong();
      setTabViolations((prev) => {
        const newCount = prev + 1;
        // Deduct penalty marks (-200 pts)
        setScore((s) => Math.max(0, s - 200));

        if (newCount >= 3) {
          setIsDisqualified(true);
          setIsFinished(true);
        } else {
          setShowWarningModal(true);
        }
        return newCount;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isOpen, isFinished, isDisqualified]);

  // Question countdown
  useEffect(() => {
    if (!isOpen || hasAnswered || isFinished || isDisqualified) return;

    setTimeLeft(questions[currentIndex]?.solving_time_sec || 25);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 0;
        if (prev <= 5) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, isOpen, hasAnswered, isFinished, isDisqualified]);

  useEffect(() => {
    if (isOpen && timeLeft === 0 && !hasAnswered && !isFinished && !isDisqualified) {
      handleAnswer(-1);
    }
  }, [timeLeft, isOpen, hasAnswered, isFinished, isDisqualified]);

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const handleAnswer = async (index: number) => {
    if (hasAnswered || isSubmitting) return;

    setSubmissionError('');
    if (dailyChallengeId || practiceSessionId) {
      setIsSubmitting(true);
      try {
        const result = dailyChallengeId
          ? await api.submitDailyChallengeAnswer({
            challenge_id: dailyChallengeId,
            question_id: currentQ.id,
            selected_option_index: index < 0 ? -1 : currentJumbled.originalIndices[index]
          })
          : await api.submitPracticeAnswer(practiceSessionId!, {
            question_id: currentQ.id,
            selected_option_index: index < 0 ? -1 : currentJumbled.originalIndices[index]
          });
        const shuffledCorrectIndex = currentJumbled.originalIndices.indexOf(result.correctOptionIndex);
        setCurrentJumbled(current => ({ ...current, newCorrectIndex: shuffledCorrectIndex }));
        setAnswerExplanation(result.explanation || '');
        setSelectedOption(index);
        setHasAnswered(true);
        if (result.isCorrect) {
          sound.playCorrect();
          setScore(prev => prev + 1000);
          setCorrectCount(prev => prev + 1);
        } else {
          sound.playWrong();
        }
      } catch (err) {
        setSubmissionError(err instanceof Error ? err.message : 'Could not submit this answer. Please retry.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setSelectedOption(index);
    setHasAnswered(true);

    const isCorrect = (index === currentJumbled.newCorrectIndex);
    if (isCorrect) {
      sound.playCorrect();
      const points = Math.round(1000 * (1 + (timeLeft / 25) * 0.5));
      setScore(prev => prev + points);
      setCorrectCount(prev => prev + 1);
    } else {
      sound.playWrong();
    }
  };

  const handleNext = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      if (dailyChallengeId || practiceSessionId) {
        setIsSubmitting(true);
        setSubmissionError('');
        try {
          const result = dailyChallengeId
            ? await api.completeDailyChallenge(dailyChallengeId)
            : await api.completePracticeSession(practiceSessionId!);
          setScore(result.score);
          setCorrectCount(result.correctCount);
          if (dailyChallengeId) setDailyResult({ xpGained: result.xpGained, streak: result.streak });
        } catch (err) {
          setSubmissionError(err instanceof Error ? err.message : 'Could not complete the daily challenge.');
          setIsSubmitting(false);
          return;
        }
        setIsSubmitting(false);
      }
      sound.playVictory();
      setIsFinished(true);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div
      ref={modalContainerRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl glass-panel-glow rounded-3xl p-6 sm:p-8 bg-dark-card border border-purple-500/40 overflow-hidden shadow-2xl">
        
        {/* Anti-Cheat Tab Switch Warning Popup Overlay */}
        {showWarningModal && !isDisqualified && (
          <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-rose-600/30 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/40 animate-bounce">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-black text-white font-['Outfit'] tracking-tight">
              PROCTORING VIOLATION DETECTED!
            </h4>
            <p className="text-sm text-rose-300 font-bold mt-2">
              Tab switch / Window minimization detected ({tabViolations}/2 Warnings).
            </p>
            <p className="text-xs text-slate-400 mt-2 max-w-md">
              <strong className="text-rose-400 font-mono">-200 Penalty Points</strong> deducted from your score. 
              Switching tabs one more time will immediately disqualify you and close the test!
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="mt-6 px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all"
            >
              I Understand — Return to Exam
            </button>
          </div>
        )}

        {/* Top Header: Anti-Cheat Badge, Fullscreen Toggle & Close Button */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs">
              Q {currentIndex + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-extrabold animate-pulse">
              <Video className="w-3.5 h-3.5" />
              PROCTORED EXAM (TAB-LOCK ACTIVE)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen Mode"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              aria-label="Close solo practice"
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!isFinished && !isDisqualified ? (
          <div className="space-y-6">
            
            {/* Live Score & Timer HUD */}
            <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-semibold">Live Score:</span>
                <span className="font-mono text-purple-300 font-black text-sm">{score} pts</span>
                {tabViolations > 0 && (
                  <span className="text-rose-400 font-bold">({tabViolations} Tab Violations: -{tabViolations * 200} pts)</span>
                )}
              </div>

              <div className="flex items-center gap-2 font-mono font-bold text-cyan-400 text-sm bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                <Clock className="w-4 h-4 text-cyan-400" />
                {timeLeft}s
              </div>
            </div>

            {/* Question Statement */}
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {currentQ.statement}
            </h3>
            {currentQ.image_url && <img src={currentQ.image_url} alt="Question illustration" loading="lazy" className="question-media max-h-64 max-w-full object-contain rounded-xl" />}
            {currentQ.table_data && <pre className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-100">{currentQ.table_data}</pre>}

            {/* Jumbled Multiple Choice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(currentJumbled.shuffledOptions.length > 0 ? currentJumbled.shuffledOptions : currentQ.options).map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentJumbled.newCorrectIndex;

                let btnStyle = 'bg-slate-900 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:border-purple-500/60';
                if (hasAnswered) {
                  if (isCorrect) btnStyle = 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-md font-bold';
                  else if (isSelected) btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200';
                  else btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-40';
                }

                return (
                  <button
                    key={idx}
                    disabled={hasAnswered || isSubmitting}
                    onClick={() => handleAnswer(idx)}
                    className={`p-4 rounded-2xl border font-bold text-left transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-xs font-mono border border-slate-700">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </div>
                    {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {hasAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-400" />}
                  </button>
                );
              })}
            </div>

            {/* Step-by-Step Explanation Banner on submission */}
            {hasAnswered && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-xs text-purple-200 space-y-1 animate-fadeIn">
                <span className="font-extrabold text-cyan-300 uppercase tracking-wide block flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-brand-cyan" />
                  Step-by-Step Solution:
                </span>
                <p className="leading-relaxed text-slate-200">
                  {answerExplanation || currentQ.explanation || 'Calculated using standard aptitude ratio principles.'}
                </p>
              </div>
            )}

            {submissionError && <p role="alert" className="text-sm text-rose-300">{submissionError}</p>}
            {isSubmitting && <p className="text-xs text-slate-400">Verifying answer with the server…</p>}

            {/* Next Button */}
            {hasAnswered && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-xs shadow-lg shadow-purple-500/20 hover:opacity-95 transition-all flex items-center gap-2"
                >
                  <span>{isSubmitting ? 'Saving…' : currentIndex + 1 < questions.length ? 'Next Question' : dailyChallengeId ? 'Complete Challenge' : 'Finish Practice'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        ) : isDisqualified ? (
          /* Disqualified Screen */
          <div className="text-center py-8 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-rose-600/30 text-rose-500 border-2 border-rose-500 flex items-center justify-center mx-auto shadow-xl">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-3xl font-black text-rose-400 font-['Outfit']">TEST TERMINATED (DISQUALIFIED)</h3>
              <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                You switched tabs more than 2 times during a proctored examination. The test was terminated automatically.
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700"
            >
              Close & Return to Dashboard
            </button>
          </div>
        ) : (
          /* Normal Finished Results View */
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30">
              <Trophy className="w-8 h-8 text-white fill-white" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-['Outfit']">
                {dailyChallengeId ? 'DAILY CHALLENGE COMPLETED!' : practiceSessionId ? 'PRACTICE SESSION COMPLETED!' : 'DRILL COMPLETED!'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {dailyChallengeId ? 'Your score and streak were verified and saved by the server.' : practiceSessionId ? 'Your score was verified by the server.' : 'Great practice run. Weak point patterns updated.'}
              </p>
            </div>
            {dailyResult && (
              <p className="text-sm font-bold text-amber-200">
                +{dailyResult.xpGained} XP · {dailyResult.streak}-day streak
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Final Score</span>
                <span className="text-2xl font-black font-mono text-purple-300">{score} pts</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Accuracy</span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {Math.round((correctCount / questions.length) * 100)}%
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm shadow-lg hover:opacity-95"
            >
              Done & Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
