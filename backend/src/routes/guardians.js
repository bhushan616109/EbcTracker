const express = require('express')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const store = require('../store/memory')
const useMem = process.env.USE_MEMORY_STORE !== 'false'
const { authenticate } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { ROLES } = require('../utils/constants')

const router = express.Router()

router.post(
  '/',
  authenticate,
  requireRole(ROLES.HOD),
  body('name').isString().isLength({ min: 2 }),
  body('username').isString().isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const { name, username, password } = req.body
    const existingUsers = store.users || []
    const taken = existingUsers.find((u) => String(u.username || '').toLowerCase() === username.toLowerCase())
    if (taken) return res.status(409).json({ message: 'Username already exists' })
    const hash = await bcrypt.hash(password, 10)
    const created = store.createUser({
      name,
      email: `${username}@example.com`,
      username,
      password: hash,
      role: ROLES.ADMIN,
      branch_id: req.user.branch_id
    })
    res.status(201).json({ id: created.id, name: created.name, username, branch_id: created.branch_id })
  }
)

router.get(
  '/',
  authenticate,
  requireRole(ROLES.HOD, ROLES.DEAN, ROLES.PRINCIPAL),
  async (req, res) => {
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const branchId = req.user.role === ROLES.HOD ? req.user.branch_id : req.query.branch_id ? Number(req.query.branch_id) : null
    const list = branchId ? store.listGuardiansByBranch(branchId) : (store.users || []).filter((u) => u.role === ROLES.ADMIN)
    res.json(list)
  }
)

router.get(
  '/:id/students',
  authenticate,
  requireRole(ROLES.HOD),
  async (req, res) => {
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const id = Number(req.params.id)
    const admin = (store.users || []).find((u) => u.id === id && u.role === ROLES.ADMIN)
    if (!admin || admin.branch_id !== req.user.branch_id) return res.status(404).json({ message: 'Not found' })
    const items = (store.students || []).filter((s) => s.created_by_admin_id === admin.id).map((s) => ({
      id: s.id,
      name: s.name,
      roll_no: s.roll_no,
      class: s.class,
      semester: s.semester
    }))
    res.json({ guardian: { id: admin.id, name: admin.name }, items })
  }
)

// Deprecated guardian self endpoints; admins should use /students

// Deprecated guardian self endpoints; admins should use /students

module.exports = router
