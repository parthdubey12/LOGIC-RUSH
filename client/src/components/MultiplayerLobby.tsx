import React, { useState, useEffect } from 'react';
import { Room, RoomParticipant } from '../types';
import { getSocket } from '../services/socket';
import { sound } from '../services/audio';
import {
  Users,
  Copy,
  Check,
  Zap,
  Play,
  Settings,
  ShieldCheck,
  Share2,
  Tv,
  MessageSquare,
  Send,
  Sparkles,
  Flame,
  AlertCircle
} from 'lucide-react';

interface MultiplayerLobbyProps {
  room: Room;
  players: RoomParticipant[];
  isHost: boolean;
  isSpectator?: boolean;
  spectatorsCount?: number;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  room,
  players,
  isHost,
  isSpectator = false,
  spectatorsCount = 0,
  onStartGame,
  onLeaveRoom
}) => {
  const socket = getSocket();
  const [copied, setCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: string; avatar: string; message: string; timestamp: string }[]>([
    { sender: 'LogicRush Bot', avatar: '🤖', message: `Welcome to Room ${room.code}! Get ready for high-speed aptitude.`, timestamp: 'Just now' }
  ]);

  // Host settings state
  const [topicId, setTopicId] = useState(room.topicId || 'mixed');
  const [difficulty, setDifficulty] = useState(room.difficulty || 'medium');
  const [questionCount, setQuestionCount] = useState(room.question_count || 10);
  const [timePerQuestion, setTimePerQuestion] = useState(room.time_per_question || 20);
  const [powerupsEnabled, setPowerupsEnabled] = useState(room.powerups_enabled ?? true);

  useEffect(() => {
    socket.on('new_chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on('room_settings_updated', (settings) => {
      if (settings.topicId) setTopicId(settings.topicId);
      if (settings.difficulty) setDifficulty(settings.difficulty);
      if (settings.questionCount) setQuestionCount(settings.questionCount);
      if (settings.timePerQuestion) setTimePerQuestion(settings.timePerQuestion);
      if (settings.powerupsEnabled !== undefined) setPowerupsEnabled(settings.powerupsEnabled);
    });

    return () => {
      socket.off('new_chat_message');
      socket.off('room_settings_updated');
    };
  }, [socket]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    socket.emit('toggle_ready');
    setIsReady(!isReady);
    sound.playTick();
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socket.emit('send_chat', { message: chatInput.trim() });
      setChatInput('');
    }
  };

  const handleHostSettingsUpdate = (updates: any) => {
    socket.emit('update_room_settings', updates);
  };

  const readyCount = players.filter(p => p.isReady).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. LOBBY HEADER & ROOM CODE HERO */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/40">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Arena Lobby
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Up to 50 Players</span>
              {room.teamBattle && (
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 text-xs font-bold">
                  Team Battle
                </span>
              )}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
              {room.title || 'LogicRush Arena Match'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Invite your classmates or team. Match begins as soon as the host hits Start.
            </p>
          </div>

          {/* Big Room Code Box */}
          <div className="flex items-center gap-4 bg-slate-950/90 border-2 border-purple-500/50 p-4 rounded-2xl shadow-xl shadow-purple-500/10">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">ROOM JOIN CODE</span>
              <span className="text-3xl font-black font-mono tracking-widest text-cyan-400 select-all">
                {room.code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-3 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Player Grid & Host Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Players Roster */}
          <div className="glass-panel rounded-3xl p-6 bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-cyan" />
                <h3 className="text-lg font-bold text-white">
                  Players in Lobby ({players.length}/50)
                </h3>
              </div>
              <div className="text-xs font-semibold text-purple-300">
                {readyCount} of {players.length} Ready • {spectatorsCount} watching
              </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 max-h-80 overflow-y-auto pr-1">
              {players.map((p) => (
                <div
                  key={p.socketId || p.userId}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                    p.isReady
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shadow">
                    {p.avatar || '⚡'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                      {p.name}
                      {p.isHost && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {p.college || 'Campus Arena'}
                    </div>
                    {room.teamBattle && (
                      <div className="text-[10px] text-cyan-300 truncate">{p.teamName || 'Not on a team'}</div>
                    )}
                    <div className="text-[10px] mt-0.5">
                      {p.isReady ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-slate-500">Waiting</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {room.teamBattle && (
              <p className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3 text-xs text-cyan-100">
                Team battle starts when at least two teams each have 3–5 connected players. Every participant must belong to a team.
              </p>
            )}

            {/* Action Bar (Ready & Start Buttons) */}
            <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={onLeaveRoom}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-colors"
              >
                Leave Room
              </button>

              <div className="flex items-center gap-3">
                {!isHost && !isSpectator && (
                  <button
                    onClick={handleToggleReady}
                    className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${
                      isReady
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {isReady ? '✓ You Are Ready!' : 'Mark as Ready'}
                  </button>
                )}

                {isHost && !isSpectator && (
                  <button
                    onClick={onStartGame}
                    disabled={players.length === 0}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Multiplayer Match
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Host Settings Controls (Visible to Host) */}
          {isHost && !isSpectator && (
            <div className="glass-panel rounded-3xl p-6 bg-slate-900/80 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-white font-bold text-base mb-4">
                <Settings className="w-4 h-4 text-emerald-400" />
                Host Arena Settings
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Topic</label>
                  <select
                    value={topicId}
                    disabled={Boolean(room.questionSetId)}
                    onChange={(e) => {
                      setTopicId(e.target.value);
                      handleHostSettingsUpdate({ topicId: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="mixed">Mixed Challenge (All Topics)</option>
                    <option value="percentages">Percentages, Ratios & Averages</option>
                    <option value="tsd">Time, Speed and Distance</option>
                    <option value="num_series">Number Series</option>
                    <option value="probability">Probability and Permutations</option>
                    <option value="dsa">Data Structures & Algorithms</option>
                    <option value="placement">TCS & Company Placement</option>
                  </select>
                  {room.questionSetId && <p className="mt-1 text-[10px] text-slate-500">This room uses the host's saved question set.</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Time per Question</label>
                  <select
                    value={timePerQuestion}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setTimePerQuestion(val);
                      handleHostSettingsUpdate({ timePerQuestion: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value={15}>15 Seconds (Blitz)</option>
                    <option value={20}>20 Seconds (Standard)</option>
                    <option value={30}>30 Seconds (Thoughtful)</option>
                    <option value={45}>45 Seconds (Complex)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right 1 Column: In-Lobby Live Chat & Reactions */}
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/80 border border-slate-800 flex flex-col h-[480px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-brand-cyan" />
              Lobby Chat & Banter
            </div>
            <span className="text-[10px] text-slate-500">Live Sync</span>
          </div>

          {/* Chat Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {chatMessages.map((msg, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span className="font-bold text-purple-300 flex items-center gap-1">
                    <span>{msg.avatar}</span> {msg.sender}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="text-slate-200 leading-snug break-words">
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Reaction Emojis */}
          <div className="flex items-center gap-1.5 py-2 border-t border-slate-800/80">
            {['🔥', '⚡', '🧠', '👑', '☕', '🚀'].map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => socket.emit('send_chat', { message: em })}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
              >
                {em}
              </button>
            ))}
          </div>

          {/* Chat Input Box */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Drop a quick hype message..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
