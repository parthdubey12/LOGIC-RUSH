import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Question, Room, RoomAttempt } from '../types';
import {
  ShieldAlert,
  Plus,
  Play,
  Brain,
  Download,
  Users,
  Copy,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';

interface HostPortalProps {
  onCreateLiveRoom: (config: any) => void;
}

export const HostPortal: React.FC<HostPortalProps> = ({ onCreateLiveRoom }) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'attempts' | 'questions'>('rooms');

  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<RoomAttempt[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);
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
      const rooms = roomsRes.rooms || [];
      setMyRooms(rooms);
      setSelectedRoomId((currentRoomId) => currentRoomId || rooms[0]?.id || '');
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

  useEffect(() => {
    if (activeTab !== 'attempts' || !selectedRoomId) return;
    setIsLoadingAttempts(true);
    api.getRoomAttempts(selectedRoomId)
      .then((data) => setAttempts(data.attempts || []))
      .catch((err) => {
        console.error('Failed to load quiz attempts:', err);
        setBannerMessage({ type: 'error', text: err.message || 'Failed to load quiz attempts.' });
      })
      .finally(() => setIsLoadingAttempts(false));
  }, [activeTab, selectedRoomId]);

  const handleCopyInviteLink = async (room: Room) => {
    const inviteUrl = new URL(window.location.origin);
    inviteUrl.searchParams.set('room', room.code);
    try {
      await navigator.clipboard.writeText(inviteUrl.toString());
      setCopiedRoomId(room.id);
      setBannerMessage({ type: 'success', text: 'Student quiz link copied to clipboard.' });
      window.setTimeout(() => setCopiedRoomId(null), 2000);
    } catch (err) {
      console.error('Failed to copy quiz invite link:', err);
      setBannerMessage({ type: 'error', text: 'Could not copy the invite link. Check browser clipboard permissions.' });
    }
  };

  const handleExportCsv = async (room: Room) => {
    try {
      const csv = await api.exportRoomResults(room.id);
      const url = URL.createObjectURL(csv);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LogicRush_Room_${room.code}_Results.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Failed to export room results:', err);
      setBannerMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to export CSV results.' });
    }
  };

  const handleRefreshAttempts = async () => {
    if (!selectedRoomId) return;
    setIsLoadingAttempts(true);
    try {
      const data = await api.getRoomAttempts(selectedRoomId);
      setAttempts(data.attempts || []);
    } catch (err) {
      console.error('Failed to refresh quiz attempts:', err);
      setBannerMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to refresh attempts.' });
    } finally {
      setIsLoadingAttempts(false);
    }
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
          { id: 'rooms', name: 'Quiz Rooms & Student Links', icon: Users },
          { id: 'attempts', name: 'Attempts & Scores', icon: ClipboardCheck },
          { id: 'questions', name: 'Question Bank & Authoring', icon: Brain }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'rooms' | 'attempts' | 'questions')}
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
                        onClick={() => handleCopyInviteLink(room)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold border border-emerald-700 flex items-center gap-1.5 transition-colors"
                      >
                        {copiedRoomId === room.id
                          ? <ClipboardCheck className="w-3.5 h-3.5" />
                          : <Copy className="w-3.5 h-3.5" />}
                        {copiedRoomId === room.id ? 'Link Copied' : 'Copy Student Link'}
                      </button>
                      <button
                        onClick={() => handleExportCsv(room)}
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

      {/* TAB 3: STUDENT ATTEMPTS & SCORES */}
      {activeTab === 'attempts' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                Student Attempts & Scores
              </h3>
              <p className="text-xs text-slate-400 mt-1">See who started and completed each hosted quiz.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedRoomId}
                onChange={(event) => setSelectedRoomId(event.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                {myRooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.title} ({room.code})</option>
                ))}
              </select>
              <button
                onClick={handleRefreshAttempts}
                disabled={!selectedRoomId || isLoadingAttempts}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
                aria-label="Refresh attempts"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingAttempts ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {isLoadingAttempts ? (
            <p className="py-10 text-center text-sm text-slate-400">Loading student attempts…</p>
          ) : attempts.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              {selectedRoomId ? 'No students have started this quiz yet.' : 'Create a room to start collecting quiz attempts.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 pr-4">Student</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Correct</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 pl-4">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.user_id} className="border-b border-slate-800/70 text-slate-200">
                      <td className="py-3 pr-4">
                        <span className="font-bold text-white">{attempt.name || 'Student'}</span>
                        <span className="block text-[10px] text-slate-500">{attempt.college || 'College not provided'}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-300">{attempt.score}</td>
                      <td className="py-3 px-4">{attempt.correct_count} / {attempt.total_questions}</td>
                      <td className="py-3 px-4 capitalize">{attempt.status.replace('_', ' ')}</td>
                      <td className="py-3 pl-4 text-slate-400">
                        {attempt.completed_at ? new Date(attempt.completed_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
