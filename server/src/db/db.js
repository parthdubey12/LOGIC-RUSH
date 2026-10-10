import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isPg = false;
let pgPool = null;
let sqliteDb = null;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (process.env.NODE_ENV === 'production' && !connectionString) {
  throw new Error('DATABASE_URL must be set in production; SQLite storage is ephemeral on hosted services.');
}

if (connectionString) {
  console.log('🔗 Connecting to PostgreSQL database...');
  pgPool = new pg.Pool({ connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
  isPg = true;
} else {
  console.log('💾 DATABASE_URL not set. Initializing local SQLite database...');
  const dbPath = path.join(__dirname, 'logicrush_local.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
}

// Convert PostgreSQL $1, $2 params to SQLite ? params if using SQLite
function adaptSql(sql) {
  if (isPg) return sql;
  return sql.replace(/\$\d+/g, '?');
}

export async function query(sql, params = []) {
  const adaptedSql = adaptSql(sql);

  if (isPg) {
    const res = await pgPool.query(adaptedSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      const trimmed = adaptedSql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA') || /\bRETURNING\b/.test(trimmed)) {
        sqliteDb.all(adaptedSql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      } else {
        sqliteDb.run(adaptedSql, params, function (err) {
          if (err) reject(err);
          else resolve([{ changes: this.changes, lastID: this.lastID }]);
        });
      }
    });
  }
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function initDb() {
  if (isPg) {
    await pgPool.query('SELECT 1');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await pgPool.query(schemaSql);
    console.log('✅ PostgreSQL schema verified.');
    return;
  }

  // Helper for SQLite schema creation
  const runAsync = (sql) => new Promise((res, rej) => sqliteDb.run(sql, (err) => err ? rej(err) : res()));

  await runAsync(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    college TEXT DEFAULT 'LogicRush University',
    course TEXT DEFAULT 'Computer Science & Engineering',
    year TEXT DEFAULT '3rd Year',
    avatar TEXT DEFAULT '⚡',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    total_games INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0.00,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS colleges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    code TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS college_memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    college_id TEXT,
    role TEXT DEFAULT 'student',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS question_topics (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'General Aptitude',
    icon TEXT DEFAULT 'Brain'
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT,
    statement TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_option INTEGER NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'medium',
    solving_time_sec INTEGER DEFAULT 30,
    tags TEXT,
    author_id TEXT,
    image_url TEXT,
    table_data TEXT,
    usage_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS question_sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by TEXT,
    is_public INTEGER DEFAULT 1,
    topic_id TEXT,
    difficulty TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS question_set_items (
    id TEXT PRIMARY KEY,
    set_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (set_id) REFERENCES question_sets(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    host_id TEXT,
    title TEXT NOT NULL,
    topic_id TEXT,
    difficulty TEXT DEFAULT 'medium',
    max_players INTEGER DEFAULT 50,
    question_count INTEGER DEFAULT 10,
    time_per_question INTEGER DEFAULT 20,
    question_set_id TEXT,
    team_battle INTEGER DEFAULT 0,
    powerups_enabled INTEGER DEFAULT 1,
    scoring_rules TEXT,
    status TEXT DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS room_participants (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    user_id TEXT,
    score INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    total_time REAL DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS room_attempts (
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'joined',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS room_question_stats (
    room_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (room_id, question_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS room_topic_attempts (
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    correct INTEGER NOT NULL DEFAULT 0,
    total_time_ms INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (room_id, user_id, topic_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    host_id TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    total_questions INTEGER DEFAULT 10,
    summary TEXT
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS answers (
    id TEXT PRIMARY KEY,
    match_id TEXT,
    question_id TEXT,
    user_id TEXT,
    selected_option INTEGER,
    is_correct INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    points_earned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS topic_statistics (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    topic_id TEXT,
    attempts INTEGER DEFAULT 0,
    correct INTEGER DEFAULT 0,
    total_time_ms INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    badge_icon TEXT DEFAULT 'Trophy',
    xp_reward INTEGER DEFAULT 100,
    category TEXT DEFAULT 'General'
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    achievement_id TEXT,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    college_id TEXT,
    captain_id TEXT,
    member_count INTEGER NOT NULL DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT,
    user_id TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  await runAsync('CREATE UNIQUE INDEX IF NOT EXISTS unique_team_member_idx ON team_members(team_id, user_id);');
  await runAsync('CREATE UNIQUE INDEX IF NOT EXISTS unique_team_member_user_idx ON team_members(user_id);');

  await runAsync(`CREATE TABLE IF NOT EXISTS room_team_scores (
    room_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (room_id, team_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS college_leagues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    season TEXT NOT NULL,
    start_date DATETIME,
    end_date DATETIME,
    status TEXT DEFAULT 'active'
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS league_standings (
    id TEXT PRIMARY KEY,
    league_id TEXT,
    college_id TEXT,
    points INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS daily_challenges (
    id TEXT PRIMARY KEY,
    challenge_date TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    topic_id TEXT,
    question_ids TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 250,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS challenge_attempts (
    id TEXT PRIMARY KEY,
    challenge_id TEXT,
    user_id TEXT,
    score INTEGER DEFAULT 0,
    completed INTEGER DEFAULT 1,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  await runAsync('CREATE UNIQUE INDEX IF NOT EXISTS unique_challenge_attempt_user_idx ON challenge_attempts(challenge_id, user_id);');

  await runAsync(`CREATE TABLE IF NOT EXISTS daily_challenge_answers (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    selected_option INTEGER NOT NULL,
    is_correct INTEGER NOT NULL,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES challenge_attempts(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS daily_challenge_streaks (
    user_id TEXT PRIMARY KEY,
    streak INTEGER NOT NULL DEFAULT 0,
    last_challenge_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS question_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question_ids TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS question_session_answers (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    selected_option INTEGER NOT NULL,
    is_correct INTEGER NOT NULL,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (session_id, question_id),
    FOREIGN KEY (session_id) REFERENCES question_sessions(id) ON DELETE CASCADE
  );`);

  await runAsync(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);

  for (const [tableName, columnName, columnDefinition] of [
    ['questions', 'table_data', 'TEXT'],
    ['rooms', 'question_set_id', 'TEXT'],
    ['rooms', 'team_battle', 'INTEGER DEFAULT 0'],
    ['teams', 'member_count', 'INTEGER NOT NULL DEFAULT 0']
  ]) {
    const columns = await query(`PRAGMA table_info(${tableName})`);
    if (!columns.some(column => column.name === columnName)) {
      await query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  await runAsync('UPDATE teams SET member_count = (SELECT COUNT(*) FROM team_members WHERE team_members.team_id = teams.id);');

  console.log('✅ SQLite Local Database Initialized.');
}
