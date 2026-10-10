import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { defaultTopics, seedQuestions } from '../data/seedQuestions.js';

const router = express.Router();

function isValidTableData(value) {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string' || value.length > 10000) return false;
  try {
    const rows = JSON.parse(value);
    return Array.isArray(rows) &&
      rows.length > 0 &&
      rows.length <= 30 &&
      rows.every(row => Array.isArray(row) && row.length > 0 && row.length <= 12 &&
        row.every(cell => ['string', 'number'].includes(typeof cell) && String(cell).length <= 500));
  } catch {
    return false;
  }
}

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

router.get('/bank', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const questions = await query('SELECT * FROM questions ORDER BY created_at DESC LIMIT 500');
    return res.json({
      questions: questions.map(question => ({
        ...question,
        options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
      }))
    });
  } catch (err) {
    console.error('Failed to fetch host question bank:', err);
    return res.status(500).json({ error: 'Failed to fetch question bank.' });
  }
});

router.get('/sets/mine', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const sets = await query(
      `SELECT qs.id, qs.title, qs.description, qs.topic_id, qs.difficulty, COUNT(qsi.question_id) AS question_count
       FROM question_sets qs
       LEFT JOIN question_set_items qsi ON qsi.set_id = qs.id
       WHERE qs.created_by = $1
       GROUP BY qs.id
       ORDER BY qs.created_at DESC`,
      [req.user.id]
    );
    return res.json({ sets });
  } catch (err) {
    console.error('Failed to fetch host question sets:', err);
    return res.status(500).json({ error: 'Failed to fetch question sets.' });
  }
});

router.post('/sets', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  const { title, description = '', question_ids: questionIds } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 255 ||
      !Array.isArray(questionIds) || questionIds.length < 1 || questionIds.length > 100 ||
      questionIds.some(id => typeof id !== 'string') || new Set(questionIds).size !== questionIds.length) {
    return res.status(400).json({ error: 'Provide a title and 1–100 unique question IDs.' });
  }

  try {
    for (const questionId of questionIds) {
      const question = await queryOne('SELECT id, author_id FROM questions WHERE id = $1', [questionId]);
      if (!question || (question.author_id && question.author_id !== req.user.id && req.user.role !== 'admin')) {
        return res.status(400).json({ error: 'Question set contains a question you cannot use.' });
      }
    }

    const setId = `set_${uuidv4().substring(0, 12)}`;
    await query(
      'INSERT INTO question_sets (id, title, description, created_by, is_public) VALUES ($1, $2, $3, $4, false)',
      [setId, title.trim(), String(description).slice(0, 2000), req.user.id]
    );
    for (const [orderIndex, questionId] of questionIds.entries()) {
      await query(
        'INSERT INTO question_set_items (id, set_id, question_id, order_index) VALUES ($1, $2, $3, $4)',
        [`qsi_${uuidv4().substring(0, 12)}`, setId, questionId, orderIndex]
      );
    }
    return res.status(201).json({ set: { id: setId, title: title.trim(), question_count: questionIds.length } });
  } catch (err) {
    console.error('Failed to create question set:', err);
    return res.status(500).json({ error: 'Failed to create question set.' });
  }
});

router.put('/sets/:setId', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  const { title, description = '', question_ids: questionIds } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 255 ||
      !Array.isArray(questionIds) || questionIds.length < 1 || questionIds.length > 100 ||
      questionIds.some(id => typeof id !== 'string') || new Set(questionIds).size !== questionIds.length) {
    return res.status(400).json({ error: 'Provide a title and 1–100 unique question IDs.' });
  }

  try {
    const set = await queryOne('SELECT id, created_by FROM question_sets WHERE id = $1', [req.params.setId]);
    if (!set) return res.status(404).json({ error: 'Question set not found.' });
    if (set.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this question set.' });
    }
    for (const questionId of questionIds) {
      const question = await queryOne('SELECT id, author_id FROM questions WHERE id = $1', [questionId]);
      if (!question || (question.author_id && question.author_id !== req.user.id && req.user.role !== 'admin')) {
        return res.status(400).json({ error: 'Question set contains a question you cannot use.' });
      }
    }

    await query('UPDATE question_sets SET title = $1, description = $2 WHERE id = $3', [
      title.trim(), String(description).slice(0, 2000), set.id
    ]);
    await query('DELETE FROM question_set_items WHERE set_id = $1', [set.id]);
    for (const [orderIndex, questionId] of questionIds.entries()) {
      await query(
        'INSERT INTO question_set_items (id, set_id, question_id, order_index) VALUES ($1, $2, $3, $4)',
        [`qsi_${uuidv4().substring(0, 12)}`, set.id, questionId, orderIndex]
      );
    }
    return res.json({ message: 'Question set updated.' });
  } catch (err) {
    console.error('Failed to update question set:', err);
    return res.status(500).json({ error: 'Failed to update question set.' });
  }
});

router.get('/sets/:setId', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const set = await queryOne(
      'SELECT id, title, description, created_by FROM question_sets WHERE id = $1',
      [req.params.setId]
    );
    if (!set) return res.status(404).json({ error: 'Question set not found.' });
    if (set.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to this question set.' });
    }
    const items = await query(
      'SELECT question_id FROM question_set_items WHERE set_id = $1 ORDER BY order_index ASC',
      [set.id]
    );
    return res.json({ set, question_ids: items.map(item => item.question_id) });
  } catch (err) {
    console.error('Failed to fetch question set:', err);
    return res.status(500).json({ error: 'Failed to fetch question set.' });
  }
});

// Get Questions with Random Selection & Topic Filtering
router.post('/sessions/start', authenticate, async (req, res) => {
  const {
    topics = [],
    difficulty = 'mixed',
    question_count: questionCount = 10
  } = req.body || {};
  if (!Array.isArray(topics) || topics.some(topic => typeof topic !== 'string') ||
      !Number.isInteger(questionCount) || questionCount < 1 || questionCount > 50 ||
      !['easy', 'medium', 'hard', 'mixed'].includes(difficulty)) {
    return res.status(400).json({ error: 'Practice session settings are invalid.' });
  }

  try {
    const params = [];
    let sql = 'SELECT id, topic_id, statement, options, difficulty, solving_time_sec, image_url, table_data FROM questions WHERE 1=1';
    const topicList = topics.filter(topic => topic !== 'all' && topic !== 'mixed');
    if (topicList.length === 1) {
      params.push(topicList[0]);
      sql += ` AND topic_id = $${params.length}`;
    } else if (topicList.length > 1) {
      const placeholders = topicList.map((_, index) => `$${params.length + index + 1}`).join(',');
      params.push(...topicList);
      sql += ` AND topic_id IN (${placeholders})`;
    }
    if (difficulty !== 'mixed') {
      params.push(difficulty);
      sql += ` AND difficulty = $${params.length}`;
    }
    sql += ` ORDER BY RANDOM() LIMIT ${questionCount}`;
    let questions = await query(sql, params);
    if (!questions.length) {
      let seeds = seedQuestions;
      if (topicList.length) seeds = seeds.filter(question => topicList.includes(question.topic_id));
      if (difficulty !== 'mixed') seeds = seeds.filter(question => question.difficulty === difficulty);
      questions = [...seeds].sort(() => Math.random() - 0.5).slice(0, questionCount);
    }
    if (questions.length < questionCount) {
      return res.status(400).json({ error: `Only ${questions.length} questions match these filters.` });
    }

    const sessionId = `practice_${uuidv4().substring(0, 12)}`;
    await query(
      'INSERT INTO question_sessions (id, user_id, question_ids, expires_at) VALUES ($1, $2, $3, $4)',
      [sessionId, req.user.id, JSON.stringify(questions.map(question => question.id)), new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()]
    );
    return res.status(201).json({
      session_id: sessionId,
      questions: questions.map(question => ({
        ...question,
        options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options
      }))
    });
  } catch (err) {
    console.error('Failed to start practice session:', err);
    return res.status(500).json({ error: 'Failed to start practice session.' });
  }
});

router.post('/sessions/:sessionId/answer', authenticate, async (req, res) => {
  try {
    const { question_id: questionId, selected_option_index: selectedOption } = req.body || {};
    if (typeof questionId !== 'string' || !Number.isInteger(selectedOption) || selectedOption < -1) {
      return res.status(400).json({ error: 'Question and selected option are required.' });
    }
    const session = await queryOne(
      'SELECT * FROM question_sessions WHERE id = $1 AND user_id = $2',
      [req.params.sessionId, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Practice session not found.' });
    if (session.completed) return res.status(409).json({ error: 'Practice session is already complete.' });
    if (Date.parse(session.expires_at) <= Date.now()) return res.status(410).json({ error: 'Practice session has expired.' });
    const questionIds = Array.isArray(session.question_ids) ? session.question_ids : JSON.parse(session.question_ids);
    if (!questionIds.includes(questionId)) return res.status(400).json({ error: 'Question is not in this practice session.' });
    const previousAnswer = await queryOne(
      'SELECT id FROM question_session_answers WHERE session_id = $1 AND question_id = $2',
      [session.id, questionId]
    );
    if (previousAnswer) return res.status(409).json({ error: 'This question has already been answered.' });
    const question = await queryOne(
      'SELECT options, correct_option, explanation FROM questions WHERE id = $1',
      [questionId]
    );
    if (!question) return res.status(404).json({ error: 'Practice question not found.' });
    const options = typeof question.options === 'string' ? JSON.parse(question.options) : question.options;
    if (selectedOption >= options.length) return res.status(400).json({ error: 'Selected option is invalid.' });
    const isCorrect = selectedOption === question.correct_option;
    const answer = await queryOne(
      `INSERT INTO question_session_answers (id, session_id, question_id, selected_option, is_correct)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id, question_id) DO NOTHING
       RETURNING id`,
      [`psa_${uuidv4().substring(0, 12)}`, session.id, questionId, selectedOption, isCorrect]
    );
    if (!answer) return res.status(409).json({ error: 'This question has already been answered.' });
    return res.json({
      isCorrect,
      correctOptionIndex: question.correct_option,
      explanation: question.explanation || ''
    });
  } catch (err) {
    console.error('Failed to record practice answer:', err);
    return res.status(500).json({ error: 'Failed to record practice answer.' });
  }
});

router.post('/sessions/:sessionId/complete', authenticate, async (req, res) => {
  try {
    const session = await queryOne(
      'SELECT * FROM question_sessions WHERE id = $1 AND user_id = $2',
      [req.params.sessionId, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Practice session not found.' });
    const questionIds = Array.isArray(session.question_ids) ? session.question_ids : JSON.parse(session.question_ids);
    const answers = await query(
      'SELECT question_id, is_correct FROM question_session_answers WHERE session_id = $1',
      [session.id]
    );
    if (answers.length !== questionIds.length) {
      return res.status(400).json({ error: 'Answer every question before completing the session.' });
    }
    await query('UPDATE question_sessions SET completed = true WHERE id = $1 AND completed = false', [session.id]);
    const correctCount = answers.filter(answer => answer.is_correct === true || answer.is_correct === 1).length;
    return res.json({ completed: true, score: correctCount * 1000, correctCount, totalQuestions: questionIds.length });
  } catch (err) {
    console.error('Failed to complete practice session:', err);
    return res.status(500).json({ error: 'Failed to complete practice session.' });
  }
});

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
      id: q.id,
      topic_id: q.topic_id,
      statement: q.statement,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      difficulty: q.difficulty,
      solving_time_sec: q.solving_time_sec,
      image_url: q.image_url || null,
      table_data: q.table_data || null
    }));

    return res.json({ questions: formatted });
  } catch (err) {
    console.error('Error fetching questions:', err);
    // Safe memory fallback
    const shuffled = [...seedQuestions].sort(() => 0.5 - Math.random());
    const formatted = shuffled.slice(0, parseInt(req.query.limit) || 10).map(q => ({
      id: q.id,
      topic_id: q.topic_id,
      statement: q.statement,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      difficulty: q.difficulty,
      solving_time_sec: q.solving_time_sec,
      image_url: q.image_url || null,
      table_data: q.table_data || null
    }));
    return res.json({ questions: formatted });
  }
});

// Create Question (Host / Admin)
router.post('/', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const {
      topic_id,
      statement,
      options,
      correct_option,
      explanation,
      difficulty = 'medium',
      solving_time_sec = 30,
      tags = '',
      image_url = null,
      table_data = null
    } = req.body;

    if (typeof statement !== 'string' || !statement.trim() || statement.length > 10000 ||
        !Array.isArray(options) || options.length < 2 || options.length > 6 ||
        options.some(option => typeof option !== 'string' || !option.trim() || option.length > 500) ||
        !Number.isInteger(correct_option) || correct_option < 0 || correct_option >= options.length ||
        !['easy', 'medium', 'hard'].includes(difficulty) ||
        (image_url !== null && (typeof image_url !== 'string' || !/^https?:\/\//i.test(image_url))) ||
        !isValidTableData(table_data)) {
      return res.status(400).json({ error: 'Provide valid question text, 2–6 options, a correct answer, difficulty, and optional HTTPS image or table data.' });
    }

    const qId = 'q_' + uuidv4().substring(0, 8);
    await query(
      `INSERT INTO questions (id, topic_id, statement, options, correct_option, explanation, difficulty, solving_time_sec, tags, author_id, image_url, table_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [qId, topic_id || 'mixed', statement.trim(), JSON.stringify(options), correct_option, explanation || '', difficulty, solving_time_sec, tags, req.user.id, image_url, table_data]
    );

    return res.status(201).json({ message: 'Question created successfully!', question_id: qId });
  } catch (err) {
    console.error('Failed to create question:', err);
    return res.status(500).json({ error: 'Failed to create question.' });
  }
});

router.put('/:questionId', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const question = await queryOne('SELECT id, author_id FROM questions WHERE id = $1', [req.params.questionId]);
    if (!question) return res.status(404).json({ error: 'Question not found.' });
    if (question.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to edit this question.' });
    }
    const { topic_id, statement, options, correct_option, explanation, difficulty, solving_time_sec, tags, image_url, table_data } = req.body || {};
    if (typeof statement !== 'string' || !statement.trim() || statement.length > 10000 ||
        !Array.isArray(options) || options.length < 2 || options.length > 6 ||
        options.some(option => typeof option !== 'string' || !option.trim() || option.length > 500) ||
        !Number.isInteger(correct_option) || correct_option < 0 || correct_option >= options.length ||
        !['easy', 'medium', 'hard'].includes(difficulty) ||
        (image_url !== null && image_url !== undefined && (typeof image_url !== 'string' || !/^https?:\/\//i.test(image_url))) ||
        !isValidTableData(table_data)) {
      return res.status(400).json({ error: 'Question data is invalid.' });
    }

    await query(
      `UPDATE questions
       SET topic_id = $1, statement = $2, options = $3, correct_option = $4, explanation = $5,
           difficulty = $6, solving_time_sec = $7, tags = $8, image_url = $9, table_data = $10
       WHERE id = $11`,
      [topic_id || 'mixed', statement.trim(), JSON.stringify(options), correct_option, explanation || '', difficulty,
        solving_time_sec || 30, tags || '', image_url || null, table_data || null, question.id]
    );
    return res.json({ message: 'Question updated.' });
  } catch (err) {
    console.error('Failed to update question:', err);
    return res.status(500).json({ error: 'Failed to update question.' });
  }
});

router.delete('/:questionId', authenticate, requireRole(['host', 'admin']), async (req, res) => {
  try {
    const question = await queryOne('SELECT id, author_id FROM questions WHERE id = $1', [req.params.questionId]);
    if (!question) return res.status(404).json({ error: 'Question not found.' });
    if (question.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have access to delete this question.' });
    }
    await query('DELETE FROM questions WHERE id = $1', [question.id]);
    return res.json({ message: 'Question deleted.' });
  } catch (err) {
    console.error('Failed to delete question:', err);
    return res.status(500).json({ error: 'Failed to delete question.' });
  }
});

export default router;
