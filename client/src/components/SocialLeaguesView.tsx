import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Trophy,
  Users,
  Flame,
  Award,
  Medal,
  Calendar,
  Sparkles,
  Shield,
  Zap,
  Target
} from 'lucide-react';

interface SocialLeaguesViewProps {
  onStartDailyChallenge: () => void;
}

export const SocialLeaguesView: React.FC<SocialLeaguesViewProps> = ({ onStartDailyChallenge }) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'leagues' | 'teams' | 'achievements'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [teamName, setTeamName] = useState('');
  const [leagueTopic, setLeagueTopic] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getLeaderboard('global').then(res => setLeaderboard(res.leaderboard || []));
    api.getLeagues(leagueTopic || undefined).then(res => setLeagues(res)).catch(err => setMessage(err.message));
    api.getTeams().then(res => setTeams(res.teams || [])).catch(err => setMessage(err.message));
    api.getAchievements().then(res => setAchievements(res.achievements || []));
  }, [leagueTopic]);

  const refreshTeams = async () => {
    const response = await api.getTeams();
    setTeams(response.teams || []);
  };

  const handleCreateTeam = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await api.createTeam(teamName);
      setTeamName('');
      setMessage('Team created. Invite up to four teammates to join.');
      await refreshTeams();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create team.');
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      const result = await api.joinTeam(teamId);
      setMessage(result.message || 'You joined the team.');
      await refreshTeams();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to join team.');
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    try {
      const result = await api.leaveTeam(teamId);
      setMessage(result.message || 'You left the team.');
      await refreshTeams();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to leave team.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. LEAGUES & SOCIAL HEADER */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-950/40 via-slate-900 to-purple-950/40 border border-amber-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Inter-College Placement League
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Autumn Season 2026</span>
            </div>
            <h2 className="text-3xl font-black text-white font-['Outfit']">
              LEAGUES, TEAMS & <span className="text-amber-400">LEADERBOARD</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Climb individual and college rankings, form competitive squads, and earn badges for speed milestones.
            </p>
          </div>

          <button
            onClick={onStartDailyChallenge}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-xl shadow-amber-500/20 hover:opacity-95 flex items-center gap-2"
          >
            <Flame className="w-4 h-4 fill-white" />
            Play Server-Scored Daily Challenge
          </button>
        </div>
      </div>

      {message && (
        <p role="status" className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200">
          {message}
        </p>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'leaderboard', name: 'Global Standings', icon: Trophy },
          { id: 'leagues', name: 'Inter-College Leagues', icon: Medal },
          { id: 'teams', name: 'Battle Squads', icon: Users },
          { id: 'achievements', name: 'Achievements & Badges', icon: Award }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                isSelected
                  ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* TAB 1: GLOBAL LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Top Ranked Students (Global)
            </h3>
            <span className="text-xs text-slate-400">Updated after each match</span>
          </div>

          <div className="space-y-2.5">
            {leaderboard.map((user, idx) => (
              <div
                key={user.user_id || idx}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 font-mono font-black text-slate-500 text-sm">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-lg">
                    {user.avatar || '⚡'}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{user.name}</div>
                    <div className="text-[10px] text-slate-400">{user.college} • {user.course}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="font-mono text-purple-300 font-black text-sm">{user.xp} XP</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">{user.accuracy}% Accuracy</div>
                  </div>
                  <div className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-extrabold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {user.streak}d
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: COLLEGE LEAGUES */}
      {activeTab === 'leagues' && leagues && (
        <div className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{leagues.activeLeague?.title}</h3>
              <p className="text-xs text-slate-400">{leagues.activeLeague?.season} Season • Inter-College Points Table</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              Active League
            </span>
          </div>
          <label className="flex items-center gap-3 text-xs text-slate-300">
            Topic standings
            <select
              value={leagueTopic}
              onChange={(event) => setLeagueTopic(event.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            >
              <option value="">All topics</option>
              <option value="percentages">Quantitative</option>
              <option value="tsd">Time, Speed & Distance</option>
              <option value="num_series">Logical</option>
              <option value="probability">Probability</option>
              <option value="dsa">Data Structures</option>
              <option value="placement">Placement</option>
            </select>
          </label>

          <div className="space-y-3">
            {leagues.standings?.map((st: any) => (
              <div
                key={st.rank}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{st.badge}</span>
                  <div>
                    <div className="font-bold text-white text-sm">{st.college}</div>
                    <div className="text-[10px] text-slate-400">{st.participants} active competitors</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-amber-300 font-black text-base block">{st.points.toLocaleString()} pts</span>
                  <span className="text-[10px] text-purple-300">Rank #{st.rank}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BATTLE SQUADS */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <form onSubmit={handleCreateTeam} className="glass-panel rounded-3xl p-5 bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row gap-3">
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              required
              maxLength={128}
              placeholder="Create a team name"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white"
            />
            <button type="submit" disabled={teams.some(team => Number(team.joined_by_me) === 1)} className="px-5 py-2 rounded-xl bg-cyan-700 text-white text-xs font-bold disabled:opacity-50">
              Create Team
            </button>
          </form>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teams.map((t) => (
              <div key={t.id} className="glass-panel rounded-3xl p-6 bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold text-cyan-400">{t.college}</span>
                    <span className="text-xs font-mono text-purple-300 font-bold">{Number(t.total_score) || 0} pts</span>
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">{t.name}</h4>
                  <p className="text-xs text-slate-400">Captain: {t.leader || 'Team captain'} • {t.members_count} / 5 Members</p>
                  <p className="text-[10px] text-slate-500 mt-2">Team battles require 3–5 participating players on each team.</p>
                </div>

                <button
                  onClick={() => Number(t.joined_by_me) === 1 ? void handleLeaveTeam(t.id) : void handleJoinTeam(t.id)}
                  disabled={Number(t.joined_by_me) !== 1 && (Number(t.members_count) >= 5 || teams.some(team => Number(team.joined_by_me) === 1))}
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50 ${Number(t.joined_by_me) === 1 ? 'bg-rose-950/60 border-rose-800 text-rose-200' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'}`}
                >
                  {Number(t.joined_by_me) === 1 ? 'Leave Team' : Number(t.members_count) >= 5 ? 'Team Full' : 'Join Team'}
                </button>
              </div>
            ))}
            {!teams.length && <p className="text-sm text-slate-400">No teams yet. Create the first one and invite teammates.</p>}
          </div>
        </div>
      )}

      {/* TAB 4: ACHIEVEMENTS */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-6 rounded-3xl border transition-all ${
                ach.unlocked
                  ? 'bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-500/50 shadow-lg shadow-purple-500/10'
                  : 'bg-slate-900/50 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl shadow">
                  {ach.unlocked ? '🏆' : '🔒'}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono font-bold">
                  +{ach.xp_reward} XP
                </span>
              </div>
              <h4 className="font-bold text-white text-base mb-1">{ach.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{ach.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-bold uppercase">
                {ach.unlocked ? (
                  <span className="text-emerald-400">✓ Unlocked</span>
                ) : (
                  <span className="text-slate-500">In Progress</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
