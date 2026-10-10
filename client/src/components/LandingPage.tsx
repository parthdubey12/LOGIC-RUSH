import React, { useState, useEffect } from 'react';
import {
  Zap,
  Brain,
  Trophy,
  Users,
  Flame,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Target,
  Play,
  HelpCircle,
  X
} from 'lucide-react';
import { sound } from '../services/audio';

interface LandingPageProps {
  onPlayNow: () => void;
  onHostQuiz: () => void;
  onExploreFeatures: () => void;
  onSelectTopic: (topicId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onPlayNow,
  onHostQuiz,
  onExploreFeatures,
  onSelectTopic
}) => {
  // Demo ticker counter
  const [liveOnlineCount, setLiveOnlineCount] = useState(142);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoAnswer, setDemoAnswer] = useState<number | null>(null);

  const sampleQuestions = [
    {
      topic: 'Percentages & Ratios',
      statement: 'If sugar price rises by 25%, by what % must consumption drop for constant expense?',
      options: ['15%', '20%', '25%', '30%'],
      correct: 1,
      speedTrick: 'Formula: [25 / (100+25)] * 100% = 20% in 3 seconds!'
    },
    {
      topic: 'Time Speed & Distance',
      statement: 'A 150m train passes a pole in 15 seconds. What is its speed in km/h?',
      options: ['30 km/h', '36 km/h', '45 km/h', '54 km/h'],
      correct: 1,
      speedTrick: 'Speed = 10 m/s * (18/5) = 36 km/h!'
    },
    {
      topic: 'Logical Reasoning',
      statement: 'Next number in sequence: 7, 10, 16, 28, 52, ?',
      options: ['88', '96', '100', '104'],
      correct: 2,
      speedTrick: 'Differences double: +3, +6, +12, +24, +48 -> 52 + 48 = 100!'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuestionIndex(prev => (prev + 1) % sampleQuestions.length);
      setSelectedDemoAnswer(null);
      setLiveOnlineCount(prev => Math.max(128, Math.min(156, prev + Math.floor(Math.random() * 5 - 2))));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const [selectedDemoAnswer, setSelectedDemoAnswer] = useState<number | null>(null);

  const handleDemoClick = (idx: number) => {
    setSelectedDemoAnswer(idx);
    if (idx === sampleQuestions[activeQuestionIndex].correct) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }
  };

  const closeDemoTour = () => {
    setIsDemoTourOpen(false);
    setDemoStep(0);
    setDemoAnswer(null);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white relative overflow-hidden">
      
      {/* Background Neon Grid & Aura Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-purple-600/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none -z-10 animate-drift" />
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-brand-violet/8 rounded-full blur-3xl pointer-events-none -z-10 animate-drift" />
      <div className="absolute top-2/3 -right-48 w-96 h-96 bg-brand-cyan/8 rounded-full blur-3xl pointer-events-none -z-10 animate-drift" style={{ animationDelay: '2s' }} />

      {/* Floating mathematical and logic symbols */}
      <div className="absolute top-24 left-[10%] text-purple-400/10 font-mono text-3xl select-none animate-float pointer-events-none">∑(xᵢ - μ)²</div>
      <div className="absolute top-48 right-[12%] text-cyan-400/10 font-mono text-4xl select-none animate-float pointer-events-none" style={{ animationDelay: '1.5s' }}>O(N log N)</div>
      <div className="absolute top-80 left-[18%] text-lime-400/10 font-mono text-3xl select-none animate-float pointer-events-none" style={{ animationDelay: '0.8s' }}>P(A ∩ B)</div>
      <div className="absolute top-96 right-[22%] text-rose-400/10 font-mono text-2xl select-none animate-float pointer-events-none" style={{ animationDelay: '2.2s' }}>√2 + λ</div>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-32 text-center">
        
        {/* Live Match Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-800/90 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-8 shadow-inner animate-enter-up">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{liveOnlineCount} Students Playing Right Now</span>
          <span className="text-slate-500">•</span>
          <span className="text-brand-cyan flex items-center gap-1 font-bold">
            <Flame className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
            Season 1 Placement League Live
          </span>
        </div>

        {/* Hero Headings */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[1.1] font-['Outfit'] animate-enter-up" style={{ animationDelay: '100ms' }}>
          YOUR BRAIN. THEIR BRAINS. <br />
          <span className="text-gradient">ONE WINNER.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed animate-enter-up" style={{ animationDelay: '180ms' }}>
          Race through aptitude, destroy your weak points and climb the LogicRush leaderboard. 
          Real-time multiplayer arena engineered for college placements and competitive exams.
        </p>

        {/* Hero CTA Action Group */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-enter-up" style={{ animationDelay: '260ms' }}>
          <button
            onClick={onPlayNow}
            className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-violet to-brand-cyan text-white text-lg font-bold shadow-lg shadow-purple-500/15 hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
          >
            <Play className="w-5 h-5 fill-white" />
            Play Live Arena
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onHostQuiz}
            className="px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 text-lg font-bold border border-slate-700 hover:border-purple-500/50 transition-all flex items-center gap-2.5 shadow-lg"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Host a Quiz
          </button>

        </div>

        <button
          type="button"
          onClick={() => setIsDemoTourOpen(true)}
          className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/70 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <HelpCircle className="h-4 w-4" />
          New here? Take the guided demo
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* INTERACTIVE QUESTION ARENA PREVIEW */}
        <div className="mt-16 max-w-4xl mx-auto animate-enter-up" style={{ animationDelay: '340ms' }}>
          <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-400" />
                  {sampleQuestions[activeQuestionIndex].topic}
                </span>
                <span className="text-xs text-slate-400 font-semibold">Live Preview Round</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-mono font-bold text-cyan-400 border border-cyan-500/30">
                  20s
                </div>
              </div>
            </div>

            <div key={activeQuestionIndex} className="animate-question-enter">
              {/* Question Statement */}
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-snug">
                {sampleQuestions[activeQuestionIndex].statement}
              </h3>

              {/* 4 Interactive Option Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
              {sampleQuestions[activeQuestionIndex].options.map((opt, idx) => {
                const isSelected = selectedDemoAnswer === idx;
                const isCorrect = idx === sampleQuestions[activeQuestionIndex].correct;
                const hasAnswered = selectedDemoAnswer !== null;

                let cardStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-purple-500/50 hover:bg-slate-700/80';
                if (hasAnswered) {
                  if (isCorrect) cardStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-500/20';
                  else if (isSelected) cardStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                  else cardStyle = 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleDemoClick(idx)}
                    className={`p-4 rounded-xl border font-bold text-left transition-all flex items-center justify-between ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-900/80 flex items-center justify-center text-xs font-mono border border-slate-700">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {hasAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  </button>
                );
              })}
              </div>

              {/* Micro Explanations & Speed Trick */}
              {selectedDemoAnswer !== null && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 text-sm text-purple-200 flex items-start gap-3 animate-fadeIn">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-cyan-300 uppercase tracking-wide text-xs block mb-1">
                      ⚡ Quick solution:
                    </span>
                    {sampleQuestions[activeQuestionIndex].speedTrick}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* QUICK START MODES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mb-2">Your next move</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">One arena. Four ways to get sharper.</h2>
          </div>
          <p className="max-w-md text-sm text-slate-400">Jump into a live match, sharpen a topic solo, or run a quiz for your group.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[
            { title: 'Live Arena', detail: 'Race friends in a real-time quiz battle.', action: 'Join the arena', icon: Zap, iconColor: 'text-cyan-300', iconBg: 'bg-cyan-500/15', onClick: onPlayNow },
            { title: 'Solo Practice', detail: 'Build speed with focused aptitude drills.', action: 'Pick a topic', icon: Brain, iconColor: 'text-purple-300', iconBg: 'bg-purple-500/15', onClick: () => onSelectTopic('mixed') },
            { title: 'Host a Quiz', detail: 'Bring your class or squad into the game.', action: 'Create a room', icon: ShieldCheck, iconColor: 'text-amber-300', iconBg: 'bg-amber-500/15', onClick: onHostQuiz }
          ].map(({ title, detail, action, icon: Icon, iconColor, iconBg, onClick }, index) => (
            <button
              key={title}
              onClick={onClick}
              className="motion-card animate-enter-up glass-panel rounded-2xl p-5 border border-slate-700/70 text-left group hover:border-purple-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]`} />
              </span>
              <span className="block text-lg font-extrabold text-white">{title}</span>
              <span className="mt-1 block min-h-10 text-sm leading-relaxed text-slate-400">{detail}</span>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
                {action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* STREAKS & LEADERBOARD PREVIEW GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Daily Streak Card */}
          <div className="glass-panel rounded-3xl p-6 border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Streak Spotlight
              </span>
              <span className="text-xs font-mono text-slate-400">Next reward: +300 XP</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex w-12 h-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/25 to-orange-600/20 border border-amber-400/30">
                <Flame className="w-7 h-7 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">5-day streak</h4>
                <p className="text-sm text-slate-400">Show up daily. Keep your momentum.</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-4 mb-5">
              You’re just two days away from your next streak milestone.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs text-slate-300">
                <span>7-day milestone</span>
                <span className="text-amber-400 font-bold">5 / 7 days</span>
              </div>
              <div className="flex gap-1.5" role="progressbar" aria-label="Streak milestone progress" aria-valuemin={0} aria-valuemax={7} aria-valuenow={5}>
                {Array.from({ length: 7 }, (_, day) => (
                  <div
                    key={day}
                    className={`h-2 flex-1 rounded-full ${day < 5 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-slate-800'}`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={onPlayNow}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:opacity-95 transition-opacity"
            >
              Keep My Streak Going
            </button>
          </div>

          {/* Live Leaderboard Demo Card */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xl font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  Live Arena Leaderboard
                </h4>
                <p className="text-xs text-slate-400">Real-time standings across all colleges (Demo Preview)</p>
              </div>
              <button
                onClick={onExploreFeatures}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                View Full League →
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { rank: 1, name: 'Aarav Sharma', college: 'IIT Bombay', score: '4,850 pts', accuracy: '94.2%', streak: 14, avatar: '⚡', badge: '🥇' },
                { rank: 2, name: 'Priya Patel', college: 'BITS Pilani', score: '4,200 pts', accuracy: '91.5%', streak: 9, avatar: '🔥', badge: '🥈' },
                { rank: 3, name: 'Rohan Gupta', college: 'NIT Trichy', score: '3,900 pts', accuracy: '88.0%', streak: 7, avatar: '🧠', badge: '🥉' }
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-400 w-5">{p.badge}</span>
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                      {p.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.college}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm font-black text-purple-300">{p.score}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">{p.accuracy} Accuracy</div>
                    </div>
                    <div className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-extrabold flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {p.streak}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-['Outfit']">
            HOW <span className="text-gradient">LOGICRUSH</span> WORKS
          </h2>
          <p className="mt-3 text-slate-400 text-base">
            From zero to placement-ready in 4 high-octane steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Join or Create Room', desc: 'Jump into a 50-player live arena with a short code or pick solo practice.', icon: Users, color: 'text-purple-400' },
            { step: '02', title: 'Speed & Logic Battle', desc: 'Answer questions against the synchronized countdown clock. Every millisecond counts.', icon: Zap, color: 'text-cyan-400' },
            { step: '03', title: 'Review Your Progress', desc: 'Use your results and topic accuracy to spot areas that deserve another round.', icon: Target, color: 'text-rose-400' },
            { step: '04', title: 'Practice with Purpose', desc: 'Launch focused drills and build speed with repeat practice.', icon: Brain, color: 'text-emerald-400' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="glass-panel rounded-3xl p-6 border-slate-800 relative hover:border-purple-500/40 transition-all">
                <span className="text-3xl font-black text-slate-700 font-mono absolute top-4 right-5">{item.step}</span>
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mb-6">
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROJECT OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mb-3">More than a quiz</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit'] leading-tight">
              Turn placement prep into a <span className="text-gradient">daily advantage.</span>
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              LogicRush is a multiplayer aptitude practice arena built for students preparing for campus placements and competitive exams. Practice on your own, challenge your peers, and use feedback to decide what to work on next.
            </p>
            <button
              onClick={onExploreFeatures}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 transition-colors hover:border-cyan-500/40 hover:text-cyan-300"
            >
              Explore the curriculum <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: 'Practice with purpose', detail: 'Build speed across math, logic, verbal, data, and programming topics.', icon: Target, color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
              { title: 'Learn together', detail: 'Create a room and compete with classmates in live quiz rounds.', icon: Users, color: 'text-purple-300', bg: 'bg-purple-500/10' },
              { title: 'See your progress', detail: 'Track accuracy and find the topics that deserve another round.', icon: TrendingUp, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
              { title: 'Improve every round', detail: 'Review your results and return to topics that need more practice.', icon: Target, color: 'text-amber-300', bg: 'bg-amber-500/10' }
            ].map(({ title, detail, icon: Icon, color, bg }, index) => (
              <div
                key={title}
                className="motion-card glass-panel rounded-2xl border border-slate-700/70 p-5"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </span>
                <h3 className="font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOPICS PREVIEW GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-['Outfit']">
              18+ CURATED <span className="text-gradient">APTITUDE TOPICS</span>
            </h2>
            <p className="mt-2 text-slate-400">Everything tested in TCS, Infosys, Wipro, Amazon, and GATE exams.</p>
          </div>
          <button
            onClick={() => onSelectTopic('all')}
            className="mt-4 sm:mt-0 text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
          >
            Explore All Topics <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { id: 'percentages', name: 'Percentages & Ratios', cat: 'Math', icon: 'Percent' },
            { id: 'tsd', name: 'Time, Speed, Distance', cat: 'Math', icon: 'Zap' },
            { id: 'num_series', name: 'Number Series', cat: 'Logic', icon: 'Hash' },
            { id: 'probability', name: 'Probability & P&C', cat: 'Math', icon: 'Dices' },
            { id: 'profit_loss', name: 'Profit, Loss & Interest', cat: 'Math', icon: 'TrendingUp' },
            { id: 'coding_decoding', name: 'Coding-Decoding', cat: 'Logic', icon: 'Code' },
            { id: 'blood_relations', name: 'Blood Relations', cat: 'Logic', icon: 'Compass' },
            { id: 'syllogisms', name: 'Syllogisms & Puzzles', cat: 'Logic', icon: 'Layers' },
            { id: 'seating', name: 'Seating Arrangement', cat: 'Logic', icon: 'Users' },
            { id: 'dsa', name: 'DSA & Algorithms', cat: 'Tech', icon: 'Cpu' },
            { id: 'programming', name: 'Basic Programming', cat: 'Tech', icon: 'Terminal' },
            { id: 'placement', name: 'Company Aptitude', cat: 'Placement', icon: 'Briefcase' }
          ].map((topic, i) => (
            <button
              key={i}
              onClick={() => onSelectTopic(topic.id)}
              className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 hover:border-purple-500/60 text-left transition-all group"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block mb-1">{topic.cat}</span>
              <div className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">{topic.name}</div>
            </button>
          ))}
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="border-t border-slate-800/80 py-12 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-cyan" />
            <span className="font-bold text-white tracking-tight">LOGICRUSH</span>
            <span className="text-slate-500 text-sm">© 2026 AptiQuiz Arena. PS 3 Final Submission.</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <button onClick={onPlayNow} className="hover:text-white">Play Now</button>
            <button onClick={onHostQuiz} className="hover:text-white">Host Portal</button>
          </div>
        </div>
      </footer>

      {isDemoTourOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDemoTour();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="logicrush-demo-title"
            className="glass-panel-glow w-full max-w-xl rounded-3xl border border-slate-700 p-6 shadow-2xl sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">LogicRush in 60 seconds · {demoStep + 1} of 3</p>
                <h2 id="logicrush-demo-title" className="mt-2 text-2xl font-black text-white font-['Outfit']">
                  {['Choose your way to practice', 'Try a timed question', 'Learn from every round'][demoStep]}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDemoTour}
                aria-label="Close guided demo"
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {demoStep === 0 && (
              <div className="space-y-3">
                {[
                  { title: 'Solo practice', detail: 'Choose topics, difficulty, and a question count for a focused sprint.', icon: Brain },
                  { title: 'Live arena', detail: 'Join or host a room and answer alongside other players.', icon: Users },
                  { title: 'Track your progress', detail: 'Review your score and choose a topic for another practice round.', icon: TrendingUp }
                ].map(({ title, detail, icon: Icon }) => (
                  <div key={title} className="flex items-start gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    <div>
                      <h3 className="text-sm font-bold text-white">{title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {demoStep === 1 && (
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-purple-300">TIME, SPEED & DISTANCE</span>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-cyan-300">20 sec</span>
                </div>
                <p className="mb-4 font-bold leading-relaxed text-white">A 150 m train passes a pole in 15 seconds. What is its speed?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['30 km/h', '36 km/h', '45 km/h', '54 km/h'].map((option, index) => {
                    const isCorrect = index === 1;
                    const selected = demoAnswer === index;
                    const style = demoAnswer === null
                      ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:border-cyan-400/60'
                      : isCorrect
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200'
                        : selected
                          ? 'border-rose-500 bg-rose-950/50 text-rose-200'
                          : 'border-slate-800 bg-slate-900/50 text-slate-500';
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDemoAnswer(index)}
                        className={`rounded-xl border p-3 text-left text-sm font-bold transition-colors ${style}`}
                      >
                        {String.fromCharCode(65 + index)} · {option}
                      </button>
                    );
                  })}
                </div>
                {demoAnswer !== null && (
                  <p className={`mt-4 text-sm ${demoAnswer === 1 ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {demoAnswer === 1 ? 'Correct!' : 'Not quite.'} 150 ÷ 15 = 10 m/s; 10 × 18/5 = 36 km/h.
                  </p>
                )}
              </div>
            )}

            {demoStep === 2 && (
              <div className="space-y-3">
                {[
                  { title: 'Score the round', detail: 'Correct answers earn points, with faster answers earning more.' },
                  { title: 'Review the solution', detail: 'See the correct answer and the reasoning after each question.' },
                  { title: 'Choose what to improve', detail: 'Use your progress insights to guide the next practice.' }
                ].map(({ title, detail }, index) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500/15 text-xs font-black text-purple-300">{index + 1}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{title}</h3>
                      <p className="mt-1 text-sm text-slate-400">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
              <button
                type="button"
                onClick={() => {
                  setDemoStep(prev => Math.max(0, prev - 1));
                  setDemoAnswer(null);
                }}
                disabled={demoStep === 0}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {demoStep < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setDemoStep(prev => prev + 1);
                    setDemoAnswer(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeDemoTour();
                    onPlayNow();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-violet to-brand-cyan px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  Try LogicRush <Play className="h-4 w-4 fill-white" />
                </button>
              )}
            </div>
          </section>
        </div>
      )}

    </div>
  );
};
