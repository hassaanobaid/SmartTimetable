const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { SECRET, auth } = require('../middleware/auth');
const { validateEmail, validatePassword } = require('../validators');

const router = express.Router();
const ROLES = ['admin', 'teacher', 'student'];
const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.full_name }, SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role });

router.post('/register', async (req, res) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const role = ROLES.includes(req.body.role) ? req.body.role : 'student';

    if (full_name.length < 2) return res.status(400).json({ error: 'Full name must be at least 2 characters' });
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    const pwErrs = validatePassword(password);
    if (pwErrs.length) return res.status(400).json({ error: 'Weak password: ' + pwErrs.join(', ') });

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ error: 'This email is already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [full_name, email, hash, role]
    );
    const user = { id: r.insertId, full_name, email, role };
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Wrong email or password' });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const [rows] = await pool.query('SELECT id, full_name, email, role FROM users WHERE id = ?', [req.user.id]);
  if (!rows[0]) return res.status(401).json({ error: 'User no longer exists' });
  res.json(rows[0]);
});

module.exports = router;
