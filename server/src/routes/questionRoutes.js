import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { defaultTopics, seedQuestions } from '../data/seedQuestions.js';

const router = express.Router();

// Seed initial topics and questions into database if empty or reseed
export async function seedDbIfEmpty() {
  const existingTopics = await query('SELECT COUNT(*) as count FROM question_topics');
  const topicCount = parseInt(existingTopics[0]?.count || 0);

  if (topicCount === 0) {
    console.log('🌱 Seeding default topics...');
    for (const t of defaultTopics) {
      await query(
        'INSERT INTO question_topics (id, name, description, category, icon) VALUES ($1, $2, $3, $4, $5)',
        [t.id, t.name, t.description, t.category, t.icon]
      );
    }
  }

  const existingQs = await query('SELECT COUNT(*) as count FROM questions');
  const qCount = parseInt(existingQs[0]?.count || 0);

  if (qCount < seedQuestions.length) {
    console.log('🌱 Seeding full aptitude question repository...');
    for (const q of seedQuestions) {
      await query(
        `INSERT INTO questions (id, topic_id, statement, options, correct_option, explanation, difficulty, solving_time_sec, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           topic_id = EXCLUDED.topic_id,
           statement = EXCLUDED.statement,
           options = EXCLUDED.options,
           correct_option = EXCLUDED.correct_option,
           explanation = EXCLUDED.explanation,
           difficulty = EXCLUDED.difficulty,
           solving_time_sec = EXCLUDED.solving_time_sec,
           tags = EXCLUDED.tags`,
        [q.id, q.topic_id, q.statement, q.options, q.correct_option, q.explanation, q.difficulty, q.solving_time_sec, q.tags]
      );
    }
  }
}

// Get All Topics
router.get('/topics', async (req, res) => {
  try {
    const topics = await query('SELECT * FROM question_topics');
    return res.json({ topics: topics.length > 0 ? topics : defaultTopics });
  } catch (err) {
    return res.json({ topics: defaultTopics });
  }
});

// Get Questions with Random Selection & Topic Filtering
router.get('/', async (req, res) => {
  try {
    const { topic_id, topics, difficulty, limit = 50 } = req.query;
    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params = [];

    // Multi-topic or single-topic filter
    const topicList = (topics ? topics.split(',') : [topic_id]).filter(t => t && t !== 'all' && t !== 'mixed');
    
    if (topicList.length === 1) {
      params.push(topicList[0]);
      sql += ` AND topic_id = $${params.length}`;
    } else if (topicList.length > 1) {
      const placeholders = topicList.map((_, i) => `$${params.length + i + 1}`).join(',');
      params.push(...topicList);
      sql += ` AND topic_id IN (${placeholders})`;
    }

    if (difficulty && difficulty !== 'all' && difficulty !== 'mixed') {
      params.push(difficulty);
      sql += ` AND difficulty = $${params.length}`;
    }

    // Randomized question selection
    sql += ` ORDER BY RANDOM() LIMIT ${Math.min(parseInt(limit) || 20, 50)}`;
    let questions = await query(sql, params);

    // If database returned fewer than requested (or in memory fallback), pad with seed questions
    if (questions.length === 0) {
      let candidatePool = seedQuestions;
      if (topicList.length > 0) {
        candidatePool = candidatePool.filter(q => topicList.includes(q.topic_id));
      }
      if (difficulty && difficulty !== 'all' && difficulty !== 'mixed') {
        candidatePool = candidatePool.filter(q => q.difficulty === difficulty);
      }
      if (candidatePool.length === 0) {
        candidatePool = seedQuestions;
      }
      // Shuffle candidates randomly
      const shuffled = [...candidatePool].sort(() => 0.5 - Math.random());
      questions = shuffled.slice(0, parseInt(limit) || 10);
    }

    // Format options for clients
    const formatted = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    return res.json({ questions: formatted });
  } catch (err) {
    console.error('Error fetching questions:', err);
    // Safe memory fallback
    const shuffled = [...seedQuestions].sort(() => 0.5 - Math.random());
    const formatted = shuffled.slice(0, parseInt(req.query.limit) || 10).map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));
    return res.json({ questions: formatted });
  }
});

// Create Question (Host / Admin)
router.post('/', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const { topic_id, statement, options, correct_option, explanation, difficulty = 'medium', solving_time_sec = 30, tags = '' } = req.body;

    if (!statement || !options || options.length < 2 || correct_option === undefined) {
      return res.status(400).json({ error: 'Statement, at least 2 options, and correct_option index are required.' });
    }

    const qId = 'q_' + uuidv4().substring(0, 8);
    await query(
      `INSERT INTO questions (id, topic_id, statement, options, correct_option, explanation, difficulty, solving_time_sec, tags, author_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [qId, topic_id || 'mixed', statement, JSON.stringify(options), correct_option, explanation || '', difficulty, solving_time_sec, tags, req.user.id]
    );

    return res.status(201).json({ message: 'Question created successfully!', question_id: qId });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create question.' });
  }
});

export default router;
