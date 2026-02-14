const express = require('express')
const db = require('../config/db')
const store = require('../store/memory')
const useMem = process.env.USE_MEMORY_STORE !== 'false'
const { authenticate } = require('../middleware/auth')
const { ROLES } = require('../utils/constants')
const { requireRole } = require('../middleware/roles')

const router = express.Router()

router.get(
  '/',
  authenticate,
  requireRole(ROLES.DEAN, ROLES.PRINCIPAL, ROLES.HOD, ROLES.ADMIN, ROLES.GUARDIAN),
  async (_req, res) => {
    try {
      if (useMem) {
        return res.json(store.branches)
      }
      const { rows } = await db.query('SELECT id, branch_name FROM branches ORDER BY branch_name')
      res.json(rows)
    } catch (err) {
      console.error(err)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

module.exports = router
