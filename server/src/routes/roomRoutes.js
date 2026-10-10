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
      powerups_enabled = true,
      scoring_rules = {}
    } = req.body;

    const roomId = 'room_' + uuidv4().substring(0, 8);
    const code = generateRoomCode();

    await query(
      `INSERT INTO rooms (id, code, host_id, title, topic_id, difficulty, max_players, question_count, time_per_question, powerups_enabled, scoring_rules, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'waiting')`,
      [
        roomId,
        code,
        req.user.id,
        title,
        topic_id,
        difficulty,
        Math.min(max_players || 50, 50),
        question_count || 10,
        time_per_question || 20,
        Boolean(powerups_enabled),
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
        question_count,
        time_per_question,
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

// Export Match Results to CSV
router.get('/:roomId/export-csv', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await queryOne('SELECT * FROM rooms WHERE id = $1', [roomId]);
    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const participants = await query(
      `SELECT rp.*, up.name, up.college, up.course 
       FROM room_participants rp
       LEFT JOIN user_profiles up ON rp.user_id = up.user_id
       WHERE rp.room_id = $1
       ORDER BY rp.score DESC`,
      [roomId]
    );

    // Format as CSV
    let csv = 'Rank,Name,College,Course,Score,Correct Answers,Total Time (s)\n';
    participants.forEach((p, idx) => {
      csv += `${idx + 1},"${p.name || 'Anonymous'}","${p.college || 'N/A'}","${p.course || 'N/A'}",${p.score || 0},${p.correct_count || 0},${p.total_time || 0}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=LogicRush_Room_${room.code}_Results.csv`);
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to export CSV results.' });
  }
});

export default router;
