import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/db.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register User
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'student', college = 'LogicRush Institute', course = 'Computer Science', year = '3rd Year', avatar = '⚡' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'usr_' + uuidv4().substring(0, 8);

    // Insert user
    await query('INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)', [
      userId,
      email.toLowerCase().trim(),
      hashedPassword,
      role
    ]);

    // Insert profile
    await query(`INSERT INTO user_profiles (user_id, name, college, course, year, avatar, xp, level, streak, accuracy)
                 VALUES ($1, $2, $3, $4, $5, $6, 100, 1, 1, 85.0)`, [
      userId,
      name.trim(),
      college,
      course,
      year,
      avatar
    ]);

    const token = generateToken({ id: userId, email: email.toLowerCase().trim(), role, name });

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        role,
        profile: { name, college, course, year, avatar, xp: 100, level: 1, streak: 1, accuracy: 85.0 }
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const profile = await queryOne('SELECT * FROM user_profiles WHERE user_id = $1', [user.id]);
    const token = generateToken({ id: user.id, email: user.email, role: user.role, name: profile?.name || 'Player' });

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: profile || { name: 'Player', avatar: '⚡', xp: 100, level: 1 }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Guest Practice Mode Login
router.post('/guest', async (req, res) => {
  try {
    const guestId = 'guest_' + Math.floor(1000 + Math.random() * 9000);
    const guestName = 'SpeedyGuest' + Math.floor(10 + Math.random() * 90);
    const token = generateToken({ id: guestId, email: `${guestId}@logicrush.guest`, role: 'student', isGuest: true, name: guestName });

    return res.json({
      message: 'Logged in as Guest Player',
      token,
      user: {
        id: guestId,
        email: `${guestId}@logicrush.guest`,
        role: 'student',
        isGuest: true,
        profile: {
          name: guestName,
          college: 'Guest Arena',
          course: 'Practice Mode',
          year: 'Unranked',
          avatar: '🎮',
          xp: 0,
          level: 1,
          streak: 0,
          accuracy: 0
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Guest login failed.' });
  }
});

// Get Current Profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    let profile = await queryOne('SELECT * FROM user_profiles WHERE user_id = $1', [req.user.id]);
    
    if (!profile && req.user.isGuest) {
      profile = {
        name: req.user.name || 'Guest Player',
        college: 'Guest Practice Mode',
        avatar: '🎮',
        xp: 0,
        level: 1,
        streak: 0
      };
    }

    return res.json({ user: { ...user, profile } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Reset Password Flow
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password required.' });
  }

  const user = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id]);

  return res.json({ message: 'Password reset successfully! Please login with your new password.' });
});

export default router;
