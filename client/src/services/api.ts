export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

  async resetPassword(data: any) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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

  async createQuestion(data: any) {
    const res = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
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

  async getLeagues() {
    const res = await fetch(`${API_BASE_URL}/social/leagues`);
    return res.json();
  },

  async getTeams() {
    const res = await fetch(`${API_BASE_URL}/social/teams`);
    return res.json();
  },

  async getDailyChallenge() {
    const res = await fetch(`${API_BASE_URL}/social/daily-challenge`);
    return res.json();
  },

  async submitDailyChallenge(data: any) {
    const res = await fetch(`${API_BASE_URL}/social/daily-challenge/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
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
