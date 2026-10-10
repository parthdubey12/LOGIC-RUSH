export interface UserProfile {
  name: string;
  college: string;
  course: string;
  year: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  total_games: number;
  total_correct: number;
  total_questions: number;
  accuracy: number;
}

export interface User {
  id: string;
  email: string;
  role: 'student' | 'host' | 'admin';
  isGuest?: boolean;
  profile?: UserProfile;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

export interface Question {
  id: string;
  topic_id: string;
  statement: string;
  options: string[];
  correct_option?: number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solving_time_sec?: number;
  tags?: string;
  image_url?: string | null;
  table_data?: string | null;
}

export interface PublicQuestion {
  index: number;
  total: number;
  id: string;
  topic_id: string;
  statement: string;
  options: string[];
  difficulty: string;
  timeLimitSec: number;
  startTime: number;
  remainingTimeMs?: number;
  receivedAt?: number;
  image_url?: string | null;
  table_data?: string | null;
}

export interface RoomParticipant {
  socketId: string;
  userId: string;
  name: string;
  avatar: string;
  college: string;
  score: number;
  streak: number;
  correctCount: number;
  isReady: boolean;
  isHost: boolean;
  isSpectator: boolean;
  teamId?: string | null;
  teamName?: string | null;
  connected?: boolean;
  powerups?: {
    fiftyFifty: number;
    doublePoints: number;
  };
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  title: string;
  topicId: string;
  difficulty: string;
  max_players: number;
  question_count: number;
  time_per_question: number;
  question_set_id?: string | null;
  questionSetId?: string | null;
  team_battle?: boolean;
  teamBattle?: boolean;
  powerups_enabled: boolean;
  status: 'waiting' | 'starting' | 'active' | 'question' | 'round_review' | 'finished';
  totalPlayers?: number;
}

export interface RoomAttempt {
  user_id: string;
  name: string | null;
  college: string | null;
  score: number;
  correct_count: number;
  total_questions: number;
  rank: number;
  status: 'in_progress' | 'completed' | 'incomplete' | 'joined';
  joined_at: string;
  completed_at: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  socketId?: string;
  name: string;
  avatar: string;
  college: string;
  score: number;
  streak: number;
  correctCount: number;
  lastPoints?: number;
  lastResponseTimeMs?: number;
  isCorrectThisRound?: boolean;
  isDisqualified?: boolean;
  accuracy?: number;
  xpEarned?: number;
}

export interface TeamLeaderboardEntry {
  teamId: string;
  name: string;
  score: number;
  memberCount: number;
  rank: number;
}

export interface WeaknessDiagnostic {
  topic_id: string;
  name: string;
  accuracy: number;
  attempts: number;
  cause: string;
  advice: string;
  recommendedDifficulty: string;
  readinessIndex: number;
  fixPlan: {
    conceptToRevise: string;
    practiceDuration: string;
    drillQuestionsCount: number;
  };
}

export interface TopicStat {
  topic_id: string;
  name: string;
  category: string;
  icon: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avgTimeSec: string;
  status: string;
}

export interface AnalyticsData {
  profile: UserProfile;
  overall: {
    totalGames: number;
    totalQuestions: number;
    totalCorrect: number;
    accuracy: number;
    avgResponseTimeSec: number;
    placementReadinessIndex: number;
  };
  topicAnalysis: TopicStat[];
  strengths: TopicStat[];
  weaknesses: WeaknessDiagnostic[];
  weeklyProgress: { day: string; xp: number; accuracy: number }[];
  difficultyDistribution: { name: string; correct: number; incorrect: number }[];
  recentActivity: any[];
}

export interface ChatMessage {
  id?: string;
  sender: 'user' | 'bot';
  content: string;
  mode?: string;
  timestamp: string;
}
