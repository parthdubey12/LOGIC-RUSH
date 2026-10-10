import express from 'express';
import { query, queryOne } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { defaultAchievements, defaultLeagues, seedQuestions } from '../data/seedQuestions.js';

const router = express.Router();

// 1. Leaderboards (Global, College, Friends, Topics)
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'global', topic_id, college } = req.query;

    let users = await query(`
      SELECT up.user_id, up.name, up.college, up.course, up.avatar, up.xp, up.level, up.streak, up.accuracy, up.total_games
      FROM user_profiles up
      ORDER BY up.xp DESC, up.accuracy DESC
      LIMIT 50
    `);

    // Add demo ranked players if DB has few users for live-feeling leaderboard preview
    if (users.length < 5) {
      const demoPlayers = [
        { user_id: 'usr_demo_1', name: 'Aarav Sharma', college: 'IIT Bombay', course: 'CSE', avatar: '⚡', xp: 4850, level: 12, streak: 14, accuracy: 94.2, total_games: 48 },
        { user_id: 'usr_demo_2', name: 'Priya Patel', college: 'BITS Pilani', course: 'ECE', avatar: '🔥', xp: 4200, level: 10, streak: 9, accuracy: 91.5, total_games: 42 },
        { user_id: 'usr_demo_3', name: 'Rohan Gupta', college: 'NIT Trichy', course: 'CSE', avatar: '🧠', xp: 3900, level: 9, streak: 7, accuracy: 88.0, total_games: 39 },
        { user_id: 'usr_demo_4', name: 'Sneha Rao', college: 'IIIT Hyderabad', course: 'IT', avatar: '🎯', xp: 3550, level: 8, streak: 12, accuracy: 89.4, total_games: 34 },
        { user_id: 'usr_demo_5', name: 'Vikram Singh', college: 'DTU Delhi', course: 'Mechanical', avatar: '🚀', xp: 3100, level: 7, streak: 5, accuracy: 85.0, total_games: 29 }
      ];
      users = [...users, ...demoPlayers];
    }

    const formatted = users.map((u, idx) => ({
      rank: idx + 1,
      ...u,
      avgSpeedSec: (10 + (idx * 0.4)).toFixed(1)
    }));

    return res.json({ leaderboard: formatted });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// 2. College Leagues & Standings
router.get('/leagues', async (req, res) => {
  try {
    const standings = [
      { rank: 1, college: 'IIT Bombay', points: 14200, wins: 42, participants: 180, badge: '🏆' },
      { rank: 2, college: 'BITS Pilani', points: 12850, wins: 38, participants: 165, badge: '🥈' },
      { rank: 3, college: 'IIIT Hyderabad', points: 11900, wins: 35, participants: 140, badge: '🥉' },
      { rank: 4, college: 'NIT Trichy', points: 10400, wins: 29, participants: 130, badge: '⭐' },
      { rank: 5, college: 'DTU Delhi', points: 9800, wins: 26, participants: 115, badge: '⭐' }
    ];

    return res.json({
      activeLeague: defaultLeagues[0],
      standings
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch college leagues.' });
  }
});

// 3. Teams / Battle Squads
router.get('/teams', async (req, res) => {
  try {
    const teams = [
      { id: 'team_1', name: 'Algorithm Avengers', college: 'IIT Bombay', membersCount: 5, totalScore: 8400, leader: 'Aarav Sharma' },
      { id: 'team_2', name: 'Quantum Quants', college: 'BITS Pilani', membersCount: 4, totalScore: 7650, leader: 'Priya Patel' },
      { id: 'team_3', name: 'Logic Ninjas', college: 'IIIT Hyderabad', membersCount: 5, totalScore: 7100, leader: 'Sneha Rao' }
    ];
    return res.json({ teams });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch teams.' });
  }
});

// 4. Daily Challenge
router.get('/daily-challenge', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const challengeQuestions = seedQuestions.slice(0, 5).map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    return res.json({
      challenge: {
        id: 'dc_' + todayStr,
        date: todayStr,
        title: 'Daily Logic Rush # ' + todayStr,
        topic: 'Mixed Aptitude & Speed',
        questionsCount: 5,
        xpReward: 300,
        questions: challengeQuestions
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch daily challenge.' });
  }
});

// Submit Daily Challenge Attempt
router.post('/daily-challenge/submit', authenticate, async (req, res) => {
  try {
    const { score = 0, correctCount = 0, totalQuestions = 5 } = req.body;
    const xpGained = Math.round(score / 5) + 150;

    // Update user profile streak & XP
    await query(
      `UPDATE user_profiles 
       SET xp = xp + $1, streak = streak + 1, total_games = total_games + 1, total_correct = total_correct + $2, total_questions = total_questions + $3
       WHERE user_id = $4`,
      [xpGained, correctCount, totalQuestions, req.user.id]
    );

    return res.json({
      message: 'Daily Challenge Completed! Streak updated.',
      xpGained,
      streakUpdated: true
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record daily challenge attempt.' });
  }
});

// 5. Achievements
router.get('/achievements', authenticate, async (req, res) => {
  try {
    const userAch = await query('SELECT achievement_id FROM user_achievements WHERE user_id = $1', [req.user.id]);
    const unlockedIds = new Set(userAch.map(a => a.achievement_id));

    const enriched = defaultAchievements.map(ach => ({
      ...ach,
      unlocked: unlockedIds.has(ach.id) || ach.id === 'ach_speed_demon' // Seeded default unlock for demonstration
    }));

    return res.json({ achievements: enriched });
  } catch (err) {
    return res.json({ achievements: defaultAchievements.map(a => ({ ...a, unlocked: false })) });
  }
});

// 6. Notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = [
      { id: 'notif_1', title: 'Daily Challenge Ready', message: 'Test your speed on today\'s mixed aptitude set and keep your streak alive!', type: 'challenge', created_at: new Date().toISOString() },
      { id: 'notif_2', title: 'League Tournament Active', message: 'National Campus Placement League - Season 1 matches are live now.', type: 'league', created_at: new Date().toISOString() }
    ];
    return res.json({ notifications });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

export default router;
