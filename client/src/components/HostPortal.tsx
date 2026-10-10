import React, { useState, useEffect } from 'react';
import { API_BASE_URL, api } from '../services/api';
import { Question, Room } from '../types';
import {
  ShieldAlert,
  Plus,
  Play,
  FileSpreadsheet,
  Brain,
  Download,
  Trash2,
  Edit,
  Users,
  Settings,
  AlertCircle,
  Sliders,
  Zap
} from 'lucide-react';

interface HostPortalProps {
  onCreateLiveRoom: (config: any) => void;
}

export const HostPortal: React.FC<HostPortalProps> = ({ onCreateLiveRoom }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'questions' | 'analytics'>('rooms');

  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Live Room Creation Modal State
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState('Campus Placement Aptitude Challenge');
  const [roomTopic, setRoomTopic] = useState('mixed');
  const [roomDifficulty, setRoomDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('medium');
  const [roomQCount, setRoomQCount] = useState<number>(10);
  const [roomTimeLimit, setRoomTimeLimit] = useState<number>(20);
  const [roomPowerups, setRoomPowerups] = useState<boolean>(true);

  // New Question Form State
  const [statement, setStatement] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [topicId, setTopicId] = useState('percentages');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [solvingTimeSec, setSolvingTimeSec] = useState(30);

  // Status banners
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [roomsRes, qsRes] = await Promise.all([
        api.getMyRooms(),
        api.getQuestions()
      ]);
      setMyRooms(roomsRes.rooms || []);
      setQuestions(qsRes.questions || []);
    } catch (err) {
      console.warn('Failed to load host data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateLiveRoom({
      title: roomTitle,
      topic_id: roomTopic,
      difficulty: roomDifficulty,
      question_count: roomQCount,
      time_per_question: roomTimeLimit,
      powerups_enabled: roomPowerups
    });
    setIsCreatingRoom(false);
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement || options.some(o => !o.trim())) {
      setBannerMessage({ type: 'error', text: 'Please fill out statement and all 4 options.' });
      return;
    }

    try {
      await api.createQuestion({
        topic_id: topicId,
        statement,
        options,
        correct_option: correctOption,
        explanation,
        difficulty,
        solving_time_sec: solvingTimeSec
      });

      setBannerMessage({ type: 'success', text: 'Question added to question bank!' });
      setStatement('');
      setOptions(['', '', '', '']);
      setExplanation('');
      loadData();
    } catch (err) {
      setBannerMessage({ type: 'error', text: 'Failed to create question.' });
    }
  };

  const handleExportCsv = (roomId: string) => {
    window.open(`${API_BASE_URL}/rooms/${roomId}/export-csv`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. HOST PORTAL HEADER */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Faculty & Host Management Console
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Exclusive Host Controls</span>
            </div>
            <h2 className="text-3xl font-black text-white font-['Outfit']">
              FACULTY ARENA & <span className="text-emerald-400">QUESTION BANK STUDIO</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Create and manage live multiplayer rooms, build custom question banks with step-by-step logic, generate AI placement questions, and export CSV class analytics.
            </p>
          </div>

          <button
            onClick={() => setIsCreatingRoom(true)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:opacity-95 flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            Create & Launch Live Room
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'rooms', name: 'My Quiz Rooms & CSV Exports', icon: Users },
          { id: 'questions', name: 'Question Bank & Authoring', icon: Brain },
          { id: 'analytics', name: 'Class Analytics & Missed Questions', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Banner Messages */}
      {bannerMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold border ${
          bannerMessage.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
        }`}>
          {bannerMessage.text}
        </div>
      )}

      {/* LIVE ROOM CREATOR MODAL (FOR HOSTS) */}
      {isCreatingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl glass-panel-glow rounded-3xl p-6 sm:p-8 bg-dark-card border border-emerald-500/40 shadow-2xl">
            <h3 className="text-2xl font-black text-white font-['Outfit'] mb-1">
              CONFIGURE LIVE ARENA ROOM
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Set the rules, time pressure, and topic parameters for your live class or competition.
            </p>

            <form onSubmit={handleLaunchRoomSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Room Title / Class Name</label>
                <input
                  type="text"
                  required
                  value={roomTitle}
                  onChange={(e) => setRoomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-400 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Topic</label>
                  <select
                    value={roomTopic}
                    onChange={(e) => setRoomTopic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="mixed">Mixed Challenge (All Topics)</option>
                    <option value="percentages">Percentages & Ratios</option>
                    <option value="tsd">Time, Speed & Distance</option>
                    <option value="num_series">Number Series</option>
                    <option value="probability">Probability & Permutations</option>
                    <option value="dsa">Data Structures & Algorithms</option>
                    <option value="placement">TCS & Placement Aptitude</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Difficulty Tier</label>
                  <select
                    value={roomDifficulty}
                    onChange={(e) => setRoomDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="easy">Easy (1.0x Multiplier)</option>
                    <option value="medium">Medium (1.25x Multiplier)</option>
                    <option value="hard">Hard (1.5x Multiplier)</option>
                    <option value="mixed">Mixed Tiers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Question Count</label>
                  <select
                    value={roomQCount}
                    onChange={(e) => setRoomQCount(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={5}>5 Questions (Speed Blitz)</option>
                    <option value={10}>10 Questions (Standard)</option>
                    <option value={15}>15 Questions (Thorough)</option>
                    <option value={20}>20 Questions (Placement Mock)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Countdown per Question</label>
                  <select
                    value={roomTimeLimit}
                    onChange={(e) => setRoomTimeLimit(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value={15}>15 Seconds</option>
                    <option value={20}>20 Seconds</option>
                    <option value={30}>30 Seconds</option>
                    <option value={45}>45 Seconds</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="powerupToggle"
                  checked={roomPowerups}
                  onChange={(e) => setRoomPowerups(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4"
                />
                <label htmlFor="powerupToggle" className="font-semibold text-slate-300 cursor-pointer">
                  Enable Tactical Power-Ups (50/50, 2X Points, Extra Time, Hint Card)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingRoom(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95"
                >
                  Launch Live Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: MY ROOMS & CSV EXPORT */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Active and Past Quiz Rooms
            </h3>

            {myRooms.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No rooms created yet. Click "Create & Launch Live Room" to start hosting for your class!
              </div>
            ) : (
              <div className="space-y-3">
                {myRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-400 text-sm tracking-wider">{room.code}</span>
                        <span className="text-xs font-bold text-white">{room.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Topic: {room.topicId} • {room.question_count} Qs • {room.time_per_question}s / Q • Status: {room.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportCsv(room.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        Export Results CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK & CREATION */}
      {activeTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Question Creation Form */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Create Question
            </h3>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Topic</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="percentages">Percentages, Ratios & Averages</option>
                  <option value="tsd">Time, Speed and Distance</option>
                  <option value="num_series">Number Series</option>
                  <option value="probability">Probability & Permutations</option>
                  <option value="profit_loss">Profit, Loss & Interest</option>
                  <option value="coding_decoding">Coding-Decoding</option>
                  <option value="dsa">DSA & Algorithms</option>
                  <option value="placement">Placement Specific</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Question Statement</label>
                <textarea
                  required
                  rows={3}
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Enter the problem statement..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-300">4 Options (Select Correct Answer)</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOptionRadio"
                      checked={correctOption === idx}
                      onChange={() => setCorrectOption(idx)}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...options];
                        newOpts[idx] = e.target.value;
                        setOptions(newOpts);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Step-by-Step Explanation & Shortcut</label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain formula and method..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Time (Seconds)</label>
                  <input
                    type="number"
                    value={solvingTimeSec}
                    onChange={(e) => setSolvingTimeSec(parseInt(e.target.value) || 30)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
              >
                Save Question to Bank
              </button>
            </form>
          </div>

          {/* Existing Question Bank List */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4">
              Question Bank Repository ({questions.length} Items)
            </h3>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-bold uppercase text-[10px]">
                      {q.topic_id}
                    </span>
                    <span className="text-slate-400 capitalize">{q.difficulty}</span>
                  </div>
                  <div className="font-bold text-white mb-2">{q.statement}</div>
                  <div className="text-[11px] text-emerald-400 font-semibold">
                    ✓ Correct Option: {q.options[q.correct_option || 0]}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CLASS ANALYTICS & FAILED QUESTIONS */}
      {activeTab === 'analytics' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Class Analytics & Questions Most Frequently Missed
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Class Avg Accuracy</span>
              <span className="text-2xl font-black font-mono text-emerald-400">76.4%</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fastest Topic</span>
              <span className="text-2xl font-black font-mono text-cyan-400">Coding-Decoding</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Hardest Topic</span>
              <span className="text-2xl font-black font-mono text-rose-400">Time, Speed, Distance</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
