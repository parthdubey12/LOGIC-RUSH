import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/db.js';
import { authenticate } from '../middleware/auth.js';
import { defaultAchievements, seedQuestions } from '../data/seedQuestions.js';

const router = express.Router();

// 1. Leaderboards (Global, College, Friends, Topics)
router.get('/leaderboard', async (req, res) => {
  try {
    const topicId = typeof req.query.topic_id === 'string' ? req.query.topic_id : '';
    const college = typeof req.query.college === 'string' ? req.query.college : '';
    let users;
    if (topicId) {
      users = await query(
        `SELECT up.user_id, up.name, up.college, up.course, up.avatar, up.xp, up.level, up.streak, up.accuracy, up.total_games
         FROM user_profiles up
         JOIN topic_statistics ts ON ts.user_id = up.user_id
         WHERE ts.topic_id = $1
         ORDER BY ts.correct DESC, ts.attempts DESC, up.name ASC
         LIMIT 50`,
        [topicId]
      );
    } else if (college) {
      users = await query(
        `SELECT user_id, name, college, course, avatar, xp, level, streak, accuracy, total_games
         FROM user_profiles WHERE college = $1
         ORDER BY xp DESC, accuracy DESC LIMIT 50`,
        [college]
      );
    } else {
      users = await query(`
        SELECT up.user_id, up.name, up.college, up.course, up.avatar, up.xp, up.level, up.streak, up.accuracy, up.total_games
        FROM user_profiles up
        ORDER BY up.xp DESC, up.accuracy DESC
        LIMIT 50
      `);
    }

    const formatted = users.map((u, idx) => ({
      rank: idx + 1,
      ...u,
      avgSpeedSec: null
    }));

    return res.json({ leaderboard: formatted });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// 2. College Leagues & Standings
router.get('/leagues', async (req, res) => {
  try {
    const topicId = typeof req.query.topic_id === 'string' ? req.query.topic_id : '';
    const now = new Date();
    const seasonStart = new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1))
      .toISOString().slice(0, 10);
    const rawRows = topicId
      ? await query(
        `SELECT COALESCE(up.college, 'Unlisted college') AS college,
                SUM(rta.correct * 100) AS points,
                COUNT(DISTINCT rta.user_id) AS participants
         FROM room_topic_attempts rta
         JOIN rooms r ON r.id = rta.room_id
         JOIN room_attempts ra ON ra.room_id = rta.room_id AND ra.user_id = rta.user_id
         JOIN user_profiles up ON up.user_id = rta.user_id
         WHERE rta.topic_id = $1 AND r.status = 'finished'
           AND ra.status = 'completed' AND ra.completed_at >= $2
         GROUP BY COALESCE(up.college, 'Unlisted college')
         ORDER BY points DESC, college ASC
         LIMIT 50`,
        [topicId, seasonStart]
      )
      : await query(
        `SELECT COALESCE(up.college, 'Unlisted college') AS college,
                SUM(ra.score) AS points,
                COUNT(DISTINCT ra.user_id) AS participants,
                SUM(CASE WHEN ra.rank = 1 THEN 1 ELSE 0 END) AS wins
         FROM room_attempts ra
         JOIN rooms r ON r.id = ra.room_id
         JOIN user_profiles up ON up.user_id = ra.user_id
         WHERE ra.status = 'completed' AND ra.completed_at >= $1
         GROUP BY COALESCE(up.college, 'Unlisted college')
         ORDER BY points DESC, college ASC
         LIMIT 50`,
        [seasonStart]
      );
    const standings = rawRows.map((row, index) => ({
      rank: index + 1,
      college: row.college,
      points: Number(row.points) || 0,
      wins: Number(row.wins) || 0,
      participants: Number(row.participants) || 0,
      badge: ['🏆', '🥈', '🥉'][index] || '⭐'
    }));
    return res.json({
      activeLeague: {
        title: topicId ? `College Topic League: ${topicId}` : 'LogicRush College League',
        season: `Q${Math.floor(now.getUTCMonth() / 3) + 1} ${now.getUTCFullYear()}`
      },
      standings
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch college leagues.' });
  }
});

// 3. Teams / Battle Squads
router.get('/teams', authenticate, async (req, res) => {
  try {
    const teams = await query(
      `SELECT t.id, t.name, t.total_score,
              COALESCE(c.name, captain_profile.college, 'Independent') AS college,
              captain_profile.name AS leader,
              COUNT(DISTINCT tm.user_id) AS members_count,
              MAX(CASE WHEN tm.user_id = $1 THEN 1 ELSE 0 END) AS joined_by_me
       FROM teams t
       LEFT JOIN colleges c ON c.id = t.college_id
       LEFT JOIN user_profiles captain_profile ON captain_profile.user_id = t.captain_id
       LEFT JOIN team_members tm ON tm.team_id = t.id
       GROUP BY t.id, c.name, captain_profile.college, captain_profile.name
       ORDER BY t.total_score DESC, t.name ASC
       LIMIT 100`,
      [req.user.id]
    );
    return res.json({ teams });
  } catch (err) {
    console.error('Failed to fetch teams:', err);
    return res.status(500).json({ error: 'Failed to fetch teams.' });
  }
});

router.post('/teams', authenticate, async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name || name.length > 128) return res.status(400).json({ error: 'Team name must be between 1 and 128 characters.' });
  try {
    const membership = await queryOne('SELECT team_id FROM team_members WHERE user_id = $1', [req.user.id]);
    if (membership) return res.status(409).json({ error: 'Leave your current team before creating another.' });
    const teamId = `team_${uuidv4().substring(0, 12)}`;
    await query('INSERT INTO teams (id, name, captain_id, member_count) VALUES ($1, $2, $3, 1)', [teamId, name, req.user.id]);
    await query(
      'INSERT INTO team_members (id, team_id, user_id) VALUES ($1, $2, $3)',
      [`tm_${uuidv4().substring(0, 12)}`, teamId, req.user.id]
    );
    return res.status(201).json({ team: { id: teamId, name, members_count: 1, joined_by_me: 1 } });
  } catch (err) {
    console.error('Failed to create team:', err);
    return res.status(500).json({ error: 'Failed to create team.' });
  }
});

router.post('/teams/:teamId/join', authenticate, async (req, res) => {
  try {
    const team = await queryOne('SELECT id FROM teams WHERE id = $1', [req.params.teamId]);
    if (!team) return res.status(404).json({ error: 'Team not found.' });
    const membership = await queryOne('SELECT team_id FROM team_members WHERE user_id = $1', [req.user.id]);
    if (membership?.team_id === team.id) return res.json({ message: 'You are already on this team.' });
    if (membership) return res.status(409).json({ error: 'You are already a member of another team.' });
    const reservation = await queryOne(
      'UPDATE teams SET member_count = member_count + 1 WHERE id = $1 AND member_count < 5 RETURNING id',
      [team.id]
    );
    if (!reservation) return res.status(409).json({ error: 'Teams can have at most five members.' });
    try {
      await query(
        'INSERT INTO team_members (id, team_id, user_id) VALUES ($1, $2, $3)',
        [`tm_${uuidv4().substring(0, 12)}`, team.id, req.user.id]
      );
    } catch (err) {
      await query('UPDATE teams SET member_count = member_count - 1 WHERE id = $1', [team.id]);
      if (err.code === '23505' || err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'You are already a member of a team.' });
      }
      throw err;
    }
    return res.json({ message: 'You joined the team.' });
  } catch (err) {
    console.error('Failed to join team:', err);
    return res.status(500).json({ error: 'Failed to join team.' });
  }
});

router.delete('/teams/:teamId/membership', authenticate, async (req, res) => {
  try {
    const membership = await queryOne(
      `SELECT tm.id AS membership_id, t.id AS team_id, t.captain_id
       FROM team_members tm JOIN teams t ON t.id = tm.team_id
       WHERE tm.team_id = $1 AND tm.user_id = $2`,
      [req.params.teamId, req.user.id]
    );
    if (!membership) return res.status(404).json({ error: 'You are not a member of this team.' });
    if (membership.captain_id === req.user.id) {
      const nextCaptain = await queryOne(
        'SELECT user_id FROM team_members WHERE team_id = $1 AND user_id <> $2 ORDER BY joined_at ASC LIMIT 1',
        [membership.team_id, req.user.id]
      );
      if (nextCaptain) {
        await query('UPDATE teams SET captain_id = $1 WHERE id = $2', [nextCaptain.user_id, membership.team_id]);
      } else {
        await query('DELETE FROM room_team_scores WHERE team_id = $1', [membership.team_id]);
        await query('DELETE FROM team_members WHERE team_id = $1', [membership.team_id]);
        await query('DELETE FROM teams WHERE id = $1', [membership.team_id]);
        return res.json({ message: 'Team deleted because its only member left.' });
      }
    }
    await query('DELETE FROM team_members WHERE id = $1', [membership.membership_id]);
    await query(
      'UPDATE teams SET member_count = CASE WHEN member_count > 0 THEN member_count - 1 ELSE 0 END WHERE id = $1',
      [membership.team_id]
    );
    return res.json({ message: 'You left the team.' });
  } catch (err) {
    console.error('Failed to leave team:', err);
    return res.status(500).json({ error: 'Failed to leave team.' });
  }
});

// 4. Daily Challenge
router.get('/daily-challenge', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayNumber = Math.floor(Date.parse(`${todayStr}T00:00:00Z`) / 86400000);
    const questionIds = Array.from({ length: 5 }, (_, index) => (
      seedQuestions[(dayNumber * 5 + index) % seedQuestions.length].id
    ));
    const challengeId = `dc_${todayStr}`;
    await query(
      `INSERT INTO daily_challenges (id, challenge_date, title, question_ids, xp_reward)
       VALUES ($1, $2, $3, $4, 300)
       ON CONFLICT (challenge_date) DO NOTHING`,
      [challengeId, todayStr, `Daily Logic Rush #${todayStr}`, JSON.stringify(questionIds)]
    );
    const challenge = await queryOne('SELECT * FROM daily_challenges WHERE challenge_date = $1', [todayStr]);
    const storedIds = Array.isArray(challenge.question_ids) ? challenge.question_ids : JSON.parse(challenge.question_ids);
    const challengeQuestions = [];
    for (const questionId of storedIds) {
      const question = await queryOne(
        `SELECT id, topic_id, statement, options, difficulty, solving_time_sec, image_url, table_data
         FROM questions WHERE id = $1`,
        [questionId]
      );
      if (question) {
        challengeQuestions.push({
          ...question,
          options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
        });
      }
    }
    if (challengeQuestions.length !== storedIds.length) {
      throw new Error('Stored daily challenge references missing questions.');
    }

    return res.json({
      challenge: {
        id: challenge.id,
        date: todayStr,
        title: challenge.title,
        topic: 'Mixed Aptitude & Speed',
        questionsCount: challengeQuestions.length,
        xpReward: challenge.xp_reward,
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
    const { challenge_id: challengeId, question_id: questionId, selected_option_index: selectedOption } = req.body || {};
    if (typeof challengeId !== 'string' || typeof questionId !== 'string' ||
        !Number.isInteger(selectedOption) || selectedOption < -1) {
      return res.status(400).json({ error: 'Challenge, question and selected option are required.' });
    }
    const today = new Date().toISOString().split('T')[0];
    const challenge = await queryOne(
      'SELECT * FROM daily_challenges WHERE id = $1 AND challenge_date = $2',
      [challengeId, today]
    );
    if (!challenge) return res.status(404).json({ error: 'Daily challenge is no longer available.' });
    const questionIds = Array.isArray(challenge.question_ids) ? challenge.question_ids : JSON.parse(challenge.question_ids);
    if (!questionIds.includes(questionId)) return res.status(400).json({ error: 'Question is not part of this challenge.' });

    const question = await queryOne('SELECT id, options, correct_option, explanation FROM questions WHERE id = $1', [questionId]);
    if (!question) return res.status(404).json({ error: 'Challenge question not found.' });
    const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    if (selectedOption >= options.length) return res.status(400).json({ error: 'Selected option is invalid.' });

    let attempt = await queryOne(
      'SELECT id, completed FROM challenge_attempts WHERE challenge_id = $1 AND user_id = $2',
      [challenge.id, req.user.id]
    );
    if (attempt?.completed) return res.status(409).json({ error: 'This daily challenge is already complete.' });
    if (!attempt) {
      const attemptId = `attempt_${uuidv4().substring(0, 12)}`;
      const createdAttempt = await queryOne(
        `INSERT INTO challenge_attempts (id, challenge_id, user_id, completed)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (challenge_id, user_id) DO NOTHING
         RETURNING id, completed`,
        [attemptId, challenge.id, req.user.id]
      );
      attempt = createdAttempt || await queryOne(
        'SELECT id, completed FROM challenge_attempts WHERE challenge_id = $1 AND user_id = $2',
        [challenge.id, req.user.id]
      );
    }
    const previousAnswer = await queryOne(
      'SELECT is_correct FROM daily_challenge_answers WHERE attempt_id = $1 AND question_id = $2',
      [attempt.id, questionId]
    );
    if (previousAnswer) return res.status(409).json({ error: 'This question has already been answered.' });

    const isCorrect = selectedOption === question.correct_option;
    const savedAnswer = await queryOne(
      `INSERT INTO daily_challenge_answers (id, attempt_id, question_id, selected_option, is_correct)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (attempt_id, question_id) DO NOTHING
       RETURNING id`,
      [`dca_${uuidv4().substring(0, 12)}`, attempt.id, questionId, selectedOption, isCorrect]
    );
    if (!savedAnswer) return res.status(409).json({ error: 'This question has already been answered.' });
    return res.json({
      isCorrect,
      correctOptionIndex: question.correct_option,
      explanation: question.explanation || '',
      answered: true
    });
  } catch (err) {
    console.error('Failed to record daily challenge answer:', err);
    return res.status(500).json({ error: 'Failed to record daily challenge answer.' });
  }
});

router.post('/daily-challenge/complete', authenticate, async (req, res) => {
  try {
    const { challenge_id: challengeId } = req.body || {};
    if (typeof challengeId !== 'string') return res.status(400).json({ error: 'Challenge ID is required.' });
    const today = new Date().toISOString().split('T')[0];
    const challenge = await queryOne(
      'SELECT * FROM daily_challenges WHERE id = $1 AND challenge_date = $2',
      [challengeId, today]
    );
    if (!challenge) return res.status(404).json({ error: 'Daily challenge is no longer available.' });
    const questionIds = Array.isArray(challenge.question_ids) ? challenge.question_ids : JSON.parse(challenge.question_ids);
    const attempt = await queryOne(
      'SELECT id, completed, score FROM challenge_attempts WHERE challenge_id = $1 AND user_id = $2',
      [challenge.id, req.user.id]
    );
    if (!attempt) return res.status(400).json({ error: 'Answer the daily challenge before completing it.' });
    if (attempt.completed) {
      const streak = await queryOne('SELECT streak FROM daily_challenge_streaks WHERE user_id = $1', [req.user.id]);
      return res.json({ completed: true, score: attempt.score, streak: streak?.streak || 0, xpGained: 0 });
    }
    const answers = await query(
      'SELECT question_id, is_correct FROM daily_challenge_answers WHERE attempt_id = $1',
      [attempt.id]
    );
    if (answers.length !== questionIds.length ||
        questionIds.some(id => !answers.some(answer => answer.question_id === id))) {
      return res.status(400).json({ error: 'Answer every daily challenge question before completing it.' });
    }

    const correctCount = answers.filter(answer => answer.is_correct === true || answer.is_correct === 1).length;
    const score = correctCount * 1000;
    const xpGained = 150 + Math.round(score / 5);
    const claimed = await queryOne(
      `UPDATE challenge_attempts SET completed = true, score = $1
       WHERE id = $2 AND completed = false
       RETURNING id`,
      [score, attempt.id]
    );
    if (!claimed) {
      const completedAttempt = await queryOne('SELECT score FROM challenge_attempts WHERE id = $1', [attempt.id]);
      const currentStreak = await queryOne('SELECT streak FROM daily_challenge_streaks WHERE user_id = $1', [req.user.id]);
      return res.json({
        completed: true,
        score: completedAttempt?.score || score,
        streak: currentStreak?.streak || 0,
        xpGained: 0
      });
    }

    const streakRecord = await queryOne(
      'SELECT streak, last_challenge_date FROM daily_challenge_streaks WHERE user_id = $1',
      [req.user.id]
    );
    const previousDate = streakRecord?.last_challenge_date
      ? String(streakRecord.last_challenge_date).slice(0, 10)
      : null;
    const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
    const streak = previousDate === yesterday ? (Number(streakRecord.streak) || 0) + 1 : 1;
    await query(
      `INSERT INTO daily_challenge_streaks (user_id, streak, last_challenge_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET streak = EXCLUDED.streak, last_challenge_date = EXCLUDED.last_challenge_date`,
      [req.user.id, streak, today]
    );
    await query(
      `UPDATE user_profiles
       SET xp = xp + $1, streak = $2, total_games = total_games + 1,
           total_correct = total_correct + $3, total_questions = total_questions + $4
       WHERE user_id = $5`,
      [xpGained, streak, correctCount, questionIds.length, req.user.id]
    );
    return res.json({ completed: true, score, correctCount, totalQuestions: questionIds.length, streak, xpGained });
  } catch (err) {
    console.error('Failed to complete daily challenge:', err);
    return res.status(500).json({ error: 'Failed to complete daily challenge.' });
  }
});

// 5. Achievements
router.get('/achievements', authenticate, async (req, res) => {
  try {
    const userAch = await query('SELECT achievement_id FROM user_achievements WHERE user_id = $1', [req.user.id]);
    const unlockedIds = new Set(userAch.map(a => a.achievement_id));

    const enriched = defaultAchievements.map(ach => ({
      ...ach,
      unlocked: unlockedIds.has(ach.id)
    }));

    return res.json({ achievements: enriched });
  } catch (err) {
    console.error('Failed to fetch achievements:', err);
    return res.status(500).json({ error: 'Failed to fetch achievements.' });
  }
});

// 6. Notifications
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await query(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    return res.json({ notifications });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

export default router;
