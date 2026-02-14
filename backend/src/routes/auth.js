const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const store = require('../store/memory');
const useMem = process.env.USE_MEMORY_STORE !== 'false';
const { ROLES } = require('../utils/constants');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

router.post(
  '/register',
  authenticate,
  requireRole(ROLES.PRINCIPAL),
  body('name').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(Object.values(ROLES)),
  body('branch_id').optional({ nullable: true }).isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, password, role, branch_id } = req.body;
    try {
      if (useMem) {
        const existing = store.getUserByEmail(email);
        if (existing) return res.status(409).json({ message: 'Email already exists' });
        const hash = await bcrypt.hash(password, 10);
        const created = store.createUser({ name, email, password: hash, role, branch_id });
        return res.status(201).json(created);
      } else {
        const { rows: existing } = await db.query('SELECT id FROM users WHERE email=$1', [email]);
        if (existing.length) return res.status(409).json({ message: 'Email already exists' });
        const hash = await bcrypt.hash(password, 10);
        const { rows } = await db.query(
          `INSERT INTO users (name, email, password, role, branch_id)
           VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, branch_id`,
          [name, email, hash, role, role === ROLES.DEAN || role === ROLES.PRINCIPAL ? null : branch_id]
        );
        return res.status(201).json(rows[0]);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/login',
  body('identifier').isString().isLength({ min: 2 }),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { identifier, password } = req.body;
    try {
      if (useMem) {
        const lower = String(identifier).toLowerCase()
        let user = identifier.includes('@') ? store.getUserByEmail(identifier) : store.getUserByUsername(identifier);
        if (!user && !identifier.includes('@')) {
          user = (store.users || []).find((u) => String(u.email || '').toLowerCase().split('@')[0] === lower) || null
        }
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign(
          { id: user.id, role: user.role, branch_id: user.branch_id, name: user.name },
          process.env.JWT_SECRET || 'dev_secret',
          { expiresIn: '8h' }
        );
        return res.json({
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, branch_id: user.branch_id }
        });
      } else {
        const email = identifier;
        const { rows } = await db.query(
          'SELECT id, name, email, password, role, branch_id FROM users WHERE email=$1',
          [email]
        );
        if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
        const token = jwt.sign(
          { id: user.id, role: user.role, branch_id: user.branch_id, name: user.name },
          process.env.JWT_SECRET || 'dev_secret',
          { expiresIn: '8h' }
        );
        return res.json({
          token,
          user: { id: user.id, name: user.name, email: user.email, role: user.role, branch_id: user.branch_id }
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/login-guardian',
  body('username').isString().isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' });
    const { username, password } = req.body;
    try {
      const g = store.getGuardianByUsername(username);
      if (!g) return res.status(401).json({ message: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, g.password);
      if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
      const token = jwt.sign(
        { id: g.id, role: ROLES.GUARDIAN, branch_id: g.branch_id, name: g.name },
        process.env.JWT_SECRET || 'dev_secret',
        { expiresIn: '8h' }
      );
      res.json({
        token,
        user: { id: g.id, name: g.name, email: null, role: ROLES.GUARDIAN, branch_id: g.branch_id }
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
