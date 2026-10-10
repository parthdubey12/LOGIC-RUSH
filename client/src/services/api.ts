export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('logicrush_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async guestLogin() {
    const res = await fetch(`${API_BASE_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  // Questions & Topics
  async getTopics() {
    const res = await fetch(`${API_BASE_URL}/questions/topics`);
    return res.json();
  },

  async getQuestions(topicId?: string, difficulty?: string, limit = 50, topics?: string[]) {
    const query = new URLSearchParams();
    if (topics?.length) query.set('topics', topics.join(','));
    else if (topicId) query.set('topic_id', topicId);
    if (difficulty) query.set('difficulty', difficulty);
    query.set('limit', String(limit));
    const res = await fetch(`${API_BASE_URL}/questions?${query.toString()}`);
    return res.json();
  },

  async getQuestionBank() {
    const res = await fetch(`${API_BASE_URL}/questions/bank`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch question bank.');
    return data;
  },

  async startPracticeSession(data: { topics: string[]; difficulty: string; question_count: number }) {
    const res = await fetch(`${API_BASE_URL}/questions/sessions/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to start practice session.');
    return result;
  },

  async submitPracticeAnswer(sessionId: string, data: { question_id: string; selected_option_index: number }) {
    const res = await fetch(`${API_BASE_URL}/questions/sessions/${encodeURIComponent(sessionId)}/answer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit practice answer.');
    return result;
  },

  async completePracticeSession(sessionId: string) {
    const res = await fetch(`${API_BASE_URL}/questions/sessions/${encodeURIComponent(sessionId)}/complete`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to complete practice session.');
    return result;
  },

  async createQuestion(data: any) {
    const res = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getMyQuestionSets() {
    const res = await fetch(`${API_BASE_URL}/questions/sets/mine`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch question sets.');
    return data;
  },

  async getQuestionSet(setId: string) {
    const res = await fetch(`${API_BASE_URL}/questions/sets/${encodeURIComponent(setId)}`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch question set.');
    return data;
  },

  async saveQuestionSet(data: { id?: string; title: string; description?: string; question_ids: string[] }) {
    const isUpdate = Boolean(data.id);
    const res = await fetch(
      `${API_BASE_URL}/questions/sets${isUpdate ? `/${encodeURIComponent(data.id!)}` : ''}`,
      {
        method: isUpdate ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to save question set.');
    return result;
  },

  // Rooms
  async createRoom(data: any) {
    const res = await fetch(`${API_BASE_URL}/rooms/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getRoomByCode(code: string) {
    const res = await fetch(`${API_BASE_URL}/rooms/code/${code}`);
    return res.json();
  },

  async getPublicRooms() {
    const res = await fetch(`${API_BASE_URL}/rooms/public`);
    return res.json();
  },

  async getMyRooms() {
    const res = await fetch(`${API_BASE_URL}/rooms/my-rooms`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getRoomAttempts(roomId: string) {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/attempts`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch room attempts.');
    return data;
  },

  async getRoomQuestionAnalytics(roomId: string) {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/question-analytics`, {
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch question analytics.');
    return data;
  },

  async exportRoomResults(roomId: string) {
    const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/export-csv`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to export room results.');
    }
    return res.blob();
  },

  // Analytics & Weakness
  async getMyAnalytics() {
    const res = await fetch(`${API_BASE_URL}/analytics/my-stats`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async fixWeaknessSession(data: any) {
    const res = await fetch(`${API_BASE_URL}/analytics/fix-weakness`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Social & Leaderboards
  async getLeaderboard(type = 'global', topic_id?: string) {
    const query = new URLSearchParams({ type });
    if (topic_id) query.set('topic_id', topic_id);
    const res = await fetch(`${API_BASE_URL}/social/leaderboard?${query.toString()}`);
    return res.json();
  },

  async getLeagues(topicId?: string) {
    const query = new URLSearchParams();
    if (topicId) query.set('topic_id', topicId);
    const res = await fetch(`${API_BASE_URL}/social/leagues?${query.toString()}`);
    return res.json();
  },

  async getTeams() {
    const res = await fetch(`${API_BASE_URL}/social/teams`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch teams.');
    return data;
  },

  async createTeam(name: string) {
    const res = await fetch(`${API_BASE_URL}/social/teams`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create team.');
    return data;
  },

  async joinTeam(teamId: string) {
    const res = await fetch(`${API_BASE_URL}/social/teams/${encodeURIComponent(teamId)}/join`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join team.');
    return data;
  },

  async leaveTeam(teamId: string) {
    const res = await fetch(`${API_BASE_URL}/social/teams/${encodeURIComponent(teamId)}/membership`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to leave team.');
    return data;
  },

  async getDailyChallenge() {
    const res = await fetch(`${API_BASE_URL}/social/daily-challenge`);
    return res.json();
  },

  async submitDailyChallengeAnswer(data: {
    challenge_id: string;
    question_id: string;
    selected_option_index: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/social/daily-challenge/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit daily challenge answer.');
    return result;
  },

  async completeDailyChallenge(challengeId: string) {
    const res = await fetch(`${API_BASE_URL}/social/daily-challenge/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ challenge_id: challengeId })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to complete daily challenge.');
    return result;
  },

  async getAchievements() {
    const res = await fetch(`${API_BASE_URL}/social/achievements`, {
      headers: getAuthHeaders()
    });
    return res.json();
  },

  async getNotifications() {
    const res = await fetch(`${API_BASE_URL}/social/notifications`, {
      headers: getAuthHeaders()
    });
    return res.json();
  }
};
