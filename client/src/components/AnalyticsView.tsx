import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnalyticsData, WeaknessDiagnostic } from '../types';
import {
  BarChart3,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Brain,
  Sparkles,
  ArrowRight,
  Clock,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

interface AnalyticsViewProps {
  onFixWeakness: (topicId: string) => void;
}

const DONUT_COLORS = ['#10B981', '#F43F5E', '#F59E0B'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onFixWeakness }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getMyAnalytics()
      .then((res) => setData(res))
      .catch((err) => console.warn('Failed to load analytics:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/30 animate-pulse mx-auto mb-4 flex items-center justify-center">
          <Brain className="w-6 h-6 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white">Synthesizing LogicRush Intelligence...</h3>
        <p className="text-xs text-slate-400 mt-1">Analyzing error patterns, time-speed curves and cognitive bottlenecks.</p>
      </div>
    );
  }

  const donutData = [
    { name: 'Correct', value: data.overall.totalCorrect || 74 },
    { name: 'Incorrect', value: Math.max(0, (data.overall.totalQuestions || 96) - (data.overall.totalCorrect || 74)) }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. ANALYTICS HEADER */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                LogicRush Intelligence Engine
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Placement Readiness Diagnostic</span>
            </div>
            <h2 className="text-3xl font-black text-white font-['Outfit']">
              PERSONAL PERFORMANCE & <span className="text-gradient">WEAKNESS ANALYSIS</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              We analyze your response times, error patterns, and cognitive bottlenecks to formulate targeted speed drills.
            </p>
          </div>

          {/* Placement Readiness Gauge */}
          <div className="bg-slate-950/90 border border-purple-500/40 p-4 rounded-2xl flex items-center gap-4">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Placement Index</span>
              <span className="text-3xl font-black font-mono text-cyan-400">
                {data.overall.placementReadinessIndex}/100
              </span>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="text-xs">
              <span className="text-emerald-400 font-extrabold block">Top 15% Percentile</span>
              <span className="text-slate-400">Campus Tier 1 Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP 3 WEAKNESSES & TARGETED FIX ACTION PLANS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Top 3 Weak Areas Needing Attention
          </h3>
          <span className="text-xs text-slate-400 font-semibold">Ordered by Error Frequency</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.weaknesses.map((weak, idx) => (
            <div
              key={weak.topic_id || idx}
              className="glass-panel rounded-3xl p-6 bg-gradient-to-b from-rose-950/20 to-slate-900 border border-rose-500/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Priority #{idx + 1}
                  </span>
                  <span className="text-xs font-mono font-black text-rose-400">{weak.accuracy}% Accuracy</span>
                </div>

                <h4 className="text-base font-bold text-white mb-2">{weak.name}</h4>
                
                <div className="space-y-2 text-xs text-slate-300 mb-6">
                  <p>
                    <strong className="text-rose-300">Bottleneck:</strong> {weak.cause}
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    <strong className="text-cyan-300">Action:</strong> {weak.advice}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onFixWeakness(weak.topic_id)}
                  className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Fix This Weakness (5Q Drill)
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CHARTS GRID: Topic Accuracy Bar Chart + Donut Accuracy Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Topic Wise Accuracy Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-violet" />
                Topic-Wise Accuracy Breakdown (%)
              </h4>
              <p className="text-xs text-slate-400">Comparing performance across all aptitude categories</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topicAnalysis.slice(0, 8)}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" height={40} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="accuracy" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Accuracy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Correct vs Incorrect Donut */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-base font-bold text-white mb-1">Overall Accuracy Ratio</h4>
            <p className="text-xs text-slate-400 mb-4">Total answered question distribution</p>

            <div className="h-44 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white font-mono">{data.overall.accuracy}%</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Accuracy</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-4 border-t border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
              <span className="block text-[10px] text-emerald-400 uppercase font-bold">Correct</span>
              <span className="text-lg font-black font-mono">{data.overall.totalCorrect} Qs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
              <span className="block text-[10px] text-rose-400 uppercase font-bold">Incorrect</span>
              <span className="text-lg font-black font-mono">{data.overall.totalQuestions - data.overall.totalCorrect} Qs</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. TOP STRENGTHS SHOWCASE */}
      <div className="glass-panel rounded-3xl p-6 bg-slate-900/80 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Top Mastered Strengths
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.strengths.map((st, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Top Strength #{i + 1}</span>
                <h4 className="font-bold text-sm text-white">{st.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{st.attempts} attempts logged</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black font-mono text-emerald-400">{st.accuracy}%</span>
                <span className="text-[10px] text-slate-400 block">Avg: {st.avgTimeSec}s</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
