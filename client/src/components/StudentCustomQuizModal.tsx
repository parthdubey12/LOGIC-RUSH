import React, { useState } from 'react';
import {
  Brain,
  Sliders,
  Sparkles,
  Zap,
  Clock,
  Target,
  Flame,
  Check,
  Play,
  X,
  Layers,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { sound } from '../services/audio';

interface StudentCustomQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuiz: (config: {
    selectedTopics: string[];
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    questionCount: number;
    timePerQuestion: number;
    modeStyle: 'standard' | 'blitz' | 'accuracy' | 'weakness_buster';
  }) => void;
  initialTopicId?: string;
}

const TOPICS = [
  { id: 'percentages', name: 'Percentages & Ratios', cat: 'Math', icon: 'Percent' },
  { id: 'tsd', name: 'Time, Speed & Distance', cat: 'Math', icon: 'Zap' },
  { id: 'num_series', name: 'Number Series', cat: 'Logic', icon: 'Hash' },
  { id: 'probability', name: 'Probability & P&C', cat: 'Math', icon: 'Dices' },
  { id: 'profit_loss', name: 'Profit, Loss & Interest', cat: 'Math', icon: 'TrendingUp' },
  { id: 'coding_decoding', name: 'Coding-Decoding', cat: 'Logic', icon: 'Code' },
  { id: 'blood_relations', name: 'Blood Relations', cat: 'Logic', icon: 'Compass' },
  { id: 'syllogisms', name: 'Syllogisms & Puzzles', cat: 'Logic', icon: 'Layers' },
  { id: 'seating', name: 'Seating Arrangements', cat: 'Logic', icon: 'Users' },
  { id: 'critical', name: 'Critical Reasoning', cat: 'Verbal', icon: 'Target' },
  { id: 'dsa', name: 'DSA & Algorithms', cat: 'Tech', icon: 'Cpu' },
  { id: 'programming', name: 'Basic Programming', cat: 'Tech', icon: 'Terminal' },
  { id: 'placement', name: 'TCS & Company Aptitude', cat: 'Placement', icon: 'Briefcase' },
  { id: 'mixed', name: 'Mixed Challenge (All)', cat: 'Special', icon: 'Flame' }
];

export const StudentCustomQuizModal: React.FC<StudentCustomQuizModalProps> = ({
  isOpen,
  onClose,
  onStartQuiz,
  initialTopicId
}) => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    initialTopicId ? [initialTopicId] : ['percentages', 'tsd']
  );
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(25);
  const [modeStyle, setModeStyle] = useState<'standard' | 'blitz' | 'accuracy' | 'weakness_buster'>('standard');

  if (!isOpen) return null;

  const handleToggleTopic = (id: string) => {
    sound.playTick();
    if (id === 'mixed') {
      setSelectedTopics(['mixed']);
      return;
    }
    if (selectedTopics.includes('mixed')) {
      setSelectedTopics([id]);
      return;
    }

    if (selectedTopics.includes(id)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter(t => t !== id));
      }
    } else {
      setSelectedTopics([...selectedTopics, id]);
    }
  };

  const handleLaunch = () => {
    sound.playTick();
    onStartQuiz({
      selectedTopics,
      difficulty,
      questionCount,
      timePerQuestion,
      modeStyle
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl glass-panel-glow rounded-3xl p-6 sm:p-8 bg-dark-card border border-purple-500/40 max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-cyan flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-extrabold uppercase border border-purple-500/30">
                Student Quiz Studio
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Personalized Drill</span>
            </div>
            <h3 className="text-2xl font-black text-white font-['Outfit']">
              CREATE YOUR <span className="text-gradient">CUSTOM APTITUDE QUIZ</span>
            </h3>
            <p className="text-xs text-slate-400">
              Pick your topics, set your target difficulty, and configure the timer intensity.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* 1. TOPIC SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-brand-violet" />
                Step 1: Choose Practice Topics ({selectedTopics.length} Selected)
              </label>
              <button
                type="button"
                onClick={() => setSelectedTopics(['mixed'])}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300"
              >
                Select Mixed (All Topics)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleToggleTopic(topic.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between select-none ${
                      isSelected
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-300">
                        {topic.cat}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-xs font-bold truncate">{topic.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DIFFICULTY LEVEL SELECTOR */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Target className="w-4 h-4 text-cyan-400" />
              Step 2: Select Difficulty Level
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'easy', label: 'Easy', desc: 'Fundamentals & quick calculations', color: 'from-emerald-500/20 border-emerald-500/40 text-emerald-300' },
                { id: 'medium', label: 'Medium', desc: 'Standard campus placement level', color: 'from-purple-500/20 border-purple-500/40 text-purple-300' },
                { id: 'hard', label: 'Hard', desc: 'Complex multi-step puzzles & traps', color: 'from-rose-500/20 border-rose-500/40 text-rose-300' },
                { id: 'mixed', label: 'Mixed Tier', desc: 'Adaptive blend of all levels', color: 'from-amber-500/20 border-amber-500/40 text-amber-300' }
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDifficulty(d.id as any);
                    sound.playTick();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    difficulty === d.id
                      ? `bg-gradient-to-b ${d.color} shadow-lg shadow-purple-500/10 font-bold border-2`
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white">{d.label}</span>
                    {difficulty === d.id && <span className="text-xs font-extrabold">✓</span>}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. QUESTION COUNT & TIMER PER QUESTION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            
            {/* Question Count */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Question Count</span>
                <span className="text-cyan-400 font-mono font-extrabold">{questionCount} Questions</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      setQuestionCount(cnt);
                      sound.playTick();
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      questionCount === cnt
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {cnt} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Time per question */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                <span>Timer per Question</span>
                <span className="text-amber-400 font-mono font-extrabold">{timePerQuestion} Seconds</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 30, 45].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTimePerQuestion(t);
                      sound.playTick();
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      timePerQuestion === t
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 4. PRACTICE DRILL STYLE */}
          <div>
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Step 3: Training Focus Mode
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'standard', name: 'Standard Drill', desc: 'Balanced speed and precision training' },
                { id: 'blitz', name: 'Speed Blitz', desc: 'Fast countdown with high streak rewards' },
                { id: 'weakness_buster', name: 'Weakness Buster', desc: 'Focus on recent missed error patterns' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setModeStyle(m.id as any);
                    sound.playTick();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    modeStyle === m.id
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs text-white mb-0.5">{m.name}</div>
                  <div className="text-[10px] text-slate-400 leading-snug">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Estimated duration: <span className="text-white font-bold font-mono">~{Math.round((questionCount * timePerQuestion) / 60)} mins</span>
          </div>

          <button
            onClick={handleLaunch}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5"
          >
            <Play className="w-4 h-4 fill-white" />
            Start Custom Quiz Now
          </button>
        </div>

      </div>
    </div>
  );
};
