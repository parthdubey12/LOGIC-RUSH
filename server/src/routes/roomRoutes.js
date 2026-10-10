import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Generate a clean 6-character room code (e.g., RUSH26)
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a Room (Host / Student Practice)
router.post('/create', authenticate, async (req, res) => {
  try {
    const {
      title = 'LogicRush Arena',
      topic_id = 'mixed',
      difficulty = 'medium',
      max_players = 50,
      question_count = 10,
      time_per_question = 20,
      question_set_id = null,
      team_battle = false,
      powerups_enabled = true,
      scoring_rules = {}
    } = req.body;

    let selectedQuestionCount = Math.max(1, Math.min(parseInt(question_count, 10) || 10, 100));
    if (question_set_id) {
      const questionSet = await queryOne(
        `SELECT id, created_by FROM question_sets WHERE id = $1`,
        [question_set_id]
      );
      if (!questionSet) return res.status(404).json({ error: 'Question set not found.' });
      if (questionSet.created_by !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have access to this question set.' });
      }
      const setQuestions = await query(
        'SELECT question_id FROM question_set_items WHERE set_id = $1 ORDER BY order_index ASC',
        [question_set_id]
      );
      if (!setQuestions.length) return res.status(400).json({ error: 'This question set has no questions.' });
      selectedQuestionCount = Math.min(selectedQuestionCount, setQuestions.length);
    }

    const roomId = 'room_' + uuidv4().substring(0, 8);
    const code = generateRoomCode();

    await query(
      `INSERT INTO rooms (id, code, host_id, title, topic_id, difficulty, max_players, question_count, time_per_question, question_set_id, team_battle, powerups_enabled, scoring_rules, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'waiting')`,
      [
        roomId,
        code,
        req.user.id,
        title,
        topic_id,
        difficulty,
        Math.min(max_players || 50, 50),
        selectedQuestionCount,
        time_per_question || 20,
        question_set_id,
        team_battle === true,
        powerups_enabled !== false,
        JSON.stringify(scoring_rules || {})
      ]
    );

    return res.status(201).json({
      message: 'Room created successfully!',
      room: {
        id: roomId,
        code,
        host_id: req.user.id,
        title,
        topic_id,
        difficulty,
        max_players,
        question_count: selectedQuestionCount,
        time_per_question,
        question_set_id,
        team_battle: team_battle === true,
        powerups_enabled,
        status: 'waiting'
      }
    });
  } catch (err) {
    console.error('Error creating room:', err);
    return res.status(500).json({ error: 'Failed to create room.' });
  }
});

// Get Room by Code
router.get('/code/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const room = await queryOne('SELECT * FROM rooms WHERE code = $1', [code]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found. Check the code or ask the host.' });
    }
    return res.json({ room });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to find room.' });
  }
});

// List Public Live Rooms
router.get('/public', async (req, res) => {
  try {
    const rooms = await query(`SELECT * FROM rooms WHERE status = 'waiting' ORDER BY created_at DESC LIMIT 10`);
    return res.json({ rooms });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch public rooms.' });
  }
});

// Get Host's Created Rooms
router.get('/my-rooms', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const rooms = await query('SELECT * FROM rooms WHERE host_id = $1 ORDER BY created_at DESC', [req.user.id]);
    return res.json({ rooms });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch host rooms.' });
  }
});

// Get student attempts for a room owned by the authenticated host.
router.get('/:roomId/attempts', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const room = await queryOne('SELECT id, host_id FROM rooms WHERE id = $1', [req.params.roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    if (room.host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this room.' });
    }

    const attempts = await query(
      `SELECT ra.user_id, ra.score, ra.correct_count, ra.total_questions, ra.rank,
              ra.status, ra.joined_at, ra.completed_at, up.name, up.college
       FROM room_attempts ra
       LEFT JOIN user_profiles up ON ra.user_id = up.user_id
       WHERE ra.room_id = $1
       ORDER BY ra.rank ASC, ra.score DESC, up.name ASC`,
      [req.params.roomId]
    );
    return res.json({ attempts });
  } catch (err) {
    console.error('Failed to fetch room attempts:', err);
    return res.status(500).json({ error: 'Failed to fetch room attempts.' });
  }
});

router.get('/:roomId/question-analytics', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const room = await queryOne('SELECT id, host_id FROM rooms WHERE id = $1', [req.params.roomId]);
    if (!room) return res.status(404).json({ error: 'Room not found.' });
    if (room.host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this room.' });
    }
    const questions = await query(
      `SELECT q.id AS question_id, q.statement, q.topic_id, stats.correct_count, stats.wrong_count,
              CASE WHEN stats.correct_count + stats.wrong_count = 0 THEN 0
                   ELSE ROUND(100.0 * stats.wrong_count / (stats.correct_count + stats.wrong_count), 1)
              END AS wrong_percent
       FROM room_question_stats stats
       JOIN questions q ON q.id = stats.question_id
       WHERE stats.room_id = $1
       ORDER BY stats.wrong_count DESC, wrong_percent DESC, q.statement ASC`,
      [req.params.roomId]
    );
    return res.json({ questions });
  } catch (err) {
    console.error('Failed to fetch room question analytics:', err);
    return res.status(500).json({ error: 'Failed to fetch question analytics.' });
  }
});

// Export Match Results to CSV
router.get('/:roomId/export-csv', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }
    if (room.host_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this room.' });
    }

    const participants = await query(
      `SELECT ra.*, up.name, up.college, up.course
       FROM room_attempts ra
       LEFT JOIN user_profiles up ON ra.user_id = up.user_id
       WHERE ra.room_id = $1
       ORDER BY ra.rank ASC, ra.score DESC`,
      [roomId]
    );

    let csv = 'Rank,Name,College,Course,Score,Correct Answers,Total Questions,Status,Completed At\n';
    participants.forEach((p, idx) => {
      const fields = [
        p.rank || idx + 1,
        p.name || 'Anonymous',
        p.college || 'N/A',
        p.course || 'N/A',
        p.score || 0,
        p.correct_count || 0,
        p.total_questions || 0,
        p.status,
        p.completed_at || ''
      ];
      csv += `${fields.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=LogicRush_Room_${room.code}_Results.csv`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export CSV results.' });
  }
});

export default router;
