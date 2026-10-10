-- LogicRush PostgreSQL Database Schema Definition

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'student', -- 'student', 'host', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  college VARCHAR(255) DEFAULT 'LogicRush University',
  course VARCHAR(128) DEFAULT 'Computer Science & Engineering',
  year VARCHAR(32) DEFAULT '3rd Year',
  avatar VARCHAR(255) DEFAULT '⚡',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Colleges
CREATE TABLE IF NOT EXISTS colleges (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  code VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- College Memberships
CREATE TABLE IF NOT EXISTS college_memberships (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  college_id VARCHAR(64) REFERENCES colleges(id) ON DELETE CASCADE,
  role VARCHAR(32) DEFAULT 'student',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Topics
CREATE TABLE IF NOT EXISTS question_topics (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(64) DEFAULT 'General Aptitude',
  icon VARCHAR(64) DEFAULT 'Brain'
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  topic_id VARCHAR(64) REFERENCES question_topics(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of 4 string options
  correct_option INTEGER NOT NULL, -- 0-indexed integer
  explanation TEXT,
  difficulty VARCHAR(32) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  solving_time_sec INTEGER DEFAULT 30,
  tags TEXT,
  author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  image_url TEXT,
  table_data TEXT,
  usage_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Sets
CREATE TABLE IF NOT EXISTS question_sets (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  topic_id VARCHAR(64),
  difficulty VARCHAR(32) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question Set Items
CREATE TABLE IF NOT EXISTS question_set_items (
  id VARCHAR(64) PRIMARY KEY,
  set_id VARCHAR(64) REFERENCES question_sets(id) ON DELETE CASCADE,
  question_id VARCHAR(64) REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL
);

-- Multiplayer Rooms
CREATE TABLE IF NOT EXISTS rooms (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(16) UNIQUE NOT NULL,
  host_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  topic_id VARCHAR(64),
  difficulty VARCHAR(32) DEFAULT 'medium',
  max_players INTEGER DEFAULT 50,
  question_count INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 20,
  question_set_id VARCHAR(64) REFERENCES question_sets(id) ON DELETE SET NULL,
  team_battle BOOLEAN DEFAULT false,
  powerups_enabled BOOLEAN DEFAULT true,
  scoring_rules JSONB,
  status VARCHAR(32) DEFAULT 'waiting', -- 'waiting', 'active', 'finished'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Room Participants
CREATE TABLE IF NOT EXISTS room_participants (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  total_time NUMERIC(10,2) DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Latest attempt by each student in a host-created room
CREATE TABLE IF NOT EXISTS room_attempts (
  room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'joined',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_question_stats (
  room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, question_id)
);

CREATE TABLE IF NOT EXISTS room_topic_attempts (
  room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  topic_id VARCHAR(64) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  total_time_ms BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, user_id, topic_id)
);

-- Matches History
CREATE TABLE IF NOT EXISTS matches (
  id VARCHAR(64) PRIMARY KEY,
  room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE SET NULL,
  host_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER DEFAULT 10,
  summary JSONB
);

-- Match Questions
CREATE TABLE IF NOT EXISTS match_questions (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) REFERENCES matches(id) ON DELETE CASCADE,
  question_id VARCHAR(64) REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL
);

-- Answers
CREATE TABLE IF NOT EXISTS answers (
  id VARCHAR(64) PRIMARY KEY,
  match_id VARCHAR(64) REFERENCES matches(id) ON DELETE CASCADE,
  question_id VARCHAR(64) REFERENCES questions(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  selected_option INTEGER,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Player Topic Statistics
CREATE TABLE IF NOT EXISTS topic_statistics (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  topic_id VARCHAR(64) REFERENCES question_topics(id) ON DELETE CASCADE,
  attempts INTEGER DEFAULT 0,
  correct INTEGER DEFAULT 0,
  total_time_ms BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_topic UNIQUE(user_id, topic_id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  badge_icon VARCHAR(64) DEFAULT 'Trophy',
  xp_reward INTEGER DEFAULT 100,
  category VARCHAR(64) DEFAULT 'General'
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(64) REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_achievement UNIQUE(user_id, achievement_id)
);

-- Teams & Battle System
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  college_id VARCHAR(64) REFERENCES colleges(id) ON DELETE CASCADE,
  captain_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_team_scores (
  room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
  team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (room_id, team_id)
);

CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR(64) PRIMARY KEY,
  team_id VARCHAR(64) REFERENCES teams(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_team_member UNIQUE(team_id, user_id)
);

ALTER TABLE teams ADD COLUMN IF NOT EXISTS member_count INTEGER NOT NULL DEFAULT 0;
UPDATE teams SET member_count = (SELECT COUNT(*) FROM team_members WHERE team_members.team_id = teams.id);
CREATE UNIQUE INDEX IF NOT EXISTS unique_team_member_user_idx ON team_members(user_id);

-- College Leagues
CREATE TABLE IF NOT EXISTS college_leagues (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  season VARCHAR(64) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(32) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS league_standings (
  id VARCHAR(64) PRIMARY KEY,
  league_id VARCHAR(64) REFERENCES college_leagues(id) ON DELETE CASCADE,
  college_id VARCHAR(64) REFERENCES colleges(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0
);

-- Daily Challenges
CREATE TABLE IF NOT EXISTS daily_challenges (
  id VARCHAR(64) PRIMARY KEY,
  challenge_date DATE UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  topic_id VARCHAR(64) REFERENCES question_topics(id),
  question_ids JSONB NOT NULL,
  xp_reward INTEGER DEFAULT 250,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id VARCHAR(64) PRIMARY KEY,
  challenge_id VARCHAR(64) REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT true,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_challenge_attempt_user_idx
  ON challenge_attempts(challenge_id, user_id);

CREATE TABLE IF NOT EXISTS daily_challenge_answers (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) REFERENCES challenge_attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS daily_challenge_streaks (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  streak INTEGER NOT NULL DEFAULT 0,
  last_challenge_date DATE
);

CREATE TABLE IF NOT EXISTS question_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_ids JSONB NOT NULL,
  completed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS question_session_answers (
  id VARCHAR(64) PRIMARY KEY,
  session_id VARCHAR(64) REFERENCES question_sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (session_id, question_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(64) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  action VARCHAR(128) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS table_data TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS question_set_id VARCHAR(64) REFERENCES question_sets(id) ON DELETE SET NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS team_battle BOOLEAN DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS unique_team_member_idx ON team_members(team_id, user_id);
