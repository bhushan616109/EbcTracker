const express = require('express')
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const store = require('../store/memory')
const useMem = process.env.USE_MEMORY_STORE !== 'false'
const { authenticate } = require('../middleware/auth')
const { requireRole } = require('../middleware/roles')
const { ROLES, EBC_STATUS } = require('../utils/constants')

const router = express.Router()

router.get(
  '/me/students',
  authenticate,
  requireRole(ROLES.GUARDIAN, ROLES.ADMIN),
  async (req, res) => {
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const items = (store.students || [])
      .filter((s) => {
        return req.user.role === ROLES.ADMIN
          ? s.created_by_admin_id === req.user.id
          : s.guardian_id === req.user.id
      })
      .map((s) => ({
        id: s.id,
        name: s.name,
        roll_no: s.roll_no,
        enrollment_no: s.enrollment_no || '',
        year: s.year || '',
        batch: s.batch || '',
        division: s.division || '',
        class: s.class || '',
        semester: s.semester || '',
        mobile: s.mobile || '',
        parent_mobile: s.parent_mobile || '',
        local_address: s.local_address || '',
        permanent_address: s.permanent_address || '',
        parent_occupation: s.parent_occupation || '',
        scholarship_id: s.scholarship_id || '',
        scholarship_status: s.scholarship_status || '',
        exam_form_status: s.exam_form_status || '',
        ebc_status: s.ebc_status || '',
        remark: s.remark || '',
        prev_results: s.prev_results || {}
      }))
    res.json({ items })
  }
)

router.post(
  '/me/students',
  authenticate,
  requireRole(ROLES.GUARDIAN, ROLES.ADMIN),
  body('roll_no').isString().isLength({ min: 1 }),
  body('year').optional().isString(),
  body('batch').optional().isString(),
  body('enrollment_no').optional({ nullable: true, checkFalsy: true }).isString(),
  body('name').isString().isLength({ min: 2 }),
  body('division').optional({ nullable: true, checkFalsy: true }).isString(),
  body('class').optional({ nullable: true, checkFalsy: true }).isString(),
  body('semester').optional({ nullable: true, checkFalsy: true }).isIn(['I','II','III','IV','V','VI']),
  body('mobile').optional({ nullable: true, checkFalsy: true }).isString(),
  body('parent_mobile').optional({ nullable: true, checkFalsy: true }).isString(),
  body('local_address').optional({ nullable: true, checkFalsy: true }).isString(),
  body('permanent_address').optional({ nullable: true, checkFalsy: true }).isString(),
  body('parent_occupation').optional({ nullable: true, checkFalsy: true }).isString(),
  body('scholarship_id').optional({ nullable: true, checkFalsy: true }).isString(),
  body('scholarship_status').optional({ nullable: true, checkFalsy: true }).isString(),
  body('exam_form_status').optional({ nullable: true, checkFalsy: true }).isString(),
  body('remark').optional({ nullable: true, checkFalsy: true }).isString(),
  body('prev_results').optional({ nullable: true, checkFalsy: true }).isObject(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    let created
    if (req.user.role === ROLES.ADMIN) {
      created = store.createStudent({
        ...req.body,
        branch_id: req.user.branch_id,
        created_by_admin_id: req.user.id
      })
    } else {
      created = store.createStudentByGuardian(req.user, req.body)
    }
    res.status(201).json(created)
  }
)

router.put(
  '/me/students/:id',
  authenticate,
  requireRole(ROLES.GUARDIAN, ROLES.ADMIN),
  body('name').optional().isString().isLength({ min: 2 }),
  body('roll_no').optional({ nullable: true, checkFalsy: true }).isString().isLength({ min: 1 }),
  body('year').optional({ nullable: true, checkFalsy: true }).isString(),
  body('batch').optional({ nullable: true, checkFalsy: true }).isString(),
  body('enrollment_no').optional({ nullable: true, checkFalsy: true }).isString(),
  body('division').optional({ nullable: true, checkFalsy: true }).isString(),
  body('class').optional({ nullable: true, checkFalsy: true }).isString(),
  body('semester').optional({ nullable: true, checkFalsy: true }).isIn(['I','II','III','IV','V','VI']),
  body('mobile').optional({ nullable: true, checkFalsy: true }).isString(),
  body('parent_mobile').optional({ nullable: true, checkFalsy: true }).isString(),
  body('local_address').optional({ nullable: true, checkFalsy: true }).isString(),
  body('permanent_address').optional({ nullable: true, checkFalsy: true }).isString(),
  body('parent_occupation').optional({ nullable: true, checkFalsy: true }).isString(),
  body('scholarship_id').optional({ nullable: true, checkFalsy: true }).isString(),
  body('scholarship_status').optional({ nullable: true, checkFalsy: true }).isString(),
  body('exam_form_status').optional({ nullable: true, checkFalsy: true }).isString(),
  body('ebc_status').optional({ nullable: true, checkFalsy: true }).isIn(Object.values(EBC_STATUS)),
  body('prev_results').optional({ nullable: true, checkFalsy: true }).isObject(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const id = req.params.id
    const fields = { 
      name: req.body.name,
      roll_no: req.body.roll_no,
      year: req.body.year,
      batch: req.body.batch,
      enrollment_no: req.body.enrollment_no,
      division: req.body.division,
      class: req.body.class,
      semester: req.body.semester,
      mobile: req.body.mobile,
      parent_mobile: req.body.parent_mobile,
      local_address: req.body.local_address,
      permanent_address: req.body.permanent_address,
      parent_occupation: req.body.parent_occupation,
      scholarship_id: req.body.scholarship_id,
      scholarship_status: req.body.scholarship_status,
      exam_form_status: req.body.exam_form_status,
      ebc_status: req.body.ebc_status,
      remark: req.body.remark,
      prev_results: req.body.prev_results
    }
    const updated = store.updateStudent(id, fields, req.user)
    if (updated === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  }
)

router.delete(
  '/me/students/:id',
  authenticate,
  requireRole(ROLES.GUARDIAN, ROLES.ADMIN),
  async (req, res) => {
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const ok = store.deleteStudent(req.params.id, req.user)
    if (ok === 'FORBIDDEN') return res.status(403).json({ message: 'Forbidden' })
    if (!ok) return res.status(404).json({ message: 'Not found' })
    return res.status(204).send()
  }
)

router.get(
  '/me/meetings',
  authenticate,
  requireRole(ROLES.GUARDIAN, ROLES.ADMIN),
  async (req, res) => {
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const list = store.listMeetings(req.user, req.query.student_id ? Number(req.query.student_id) : null)
    res.json({ items: list })
  }
)

router.post(
  '/me/meetings',
  authenticate,
  requireRole(ROLES.GUARDIAN, ROLES.ADMIN),
  body('student_id').isInt({ min: 1 }),
  body('meeting_date').optional().isString(),
  body('attendance').isIn(['Present','Absent']),
  body('ebc_notes').optional({ nullable: true, checkFalsy: true }).isString(),
  body('result_notes').optional({ nullable: true, checkFalsy: true }).isString(),
  body('personal_notes').optional({ nullable: true, checkFalsy: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const created = store.createMeeting(req.user, req.body)
    res.status(201).json(created)
  }
)

router.post(
  '/',
  authenticate,
  requireRole(ROLES.HOD),
  body('name').isString().isLength({ min: 2 }),
  body('username').isString().isLength({ min: 3 }),
  body('password').isLength({ min: 6 }),
  body('roll_range_from').optional().isInt({ min: 1 }),
  body('roll_range_to').optional().isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
    if (!useMem) return res.status(501).json({ message: 'Not implemented for DB mode' })
    const { name, username, password, roll_range_from, roll_range_to } = req.body
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
      branch_id: req.user.branch_id,
      roll_range_from,
      roll_range_to
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
    const items = (store.students || [])
      .filter((s) => s.created_by_admin_id === admin.id)
      .map((s) => ({
        id: s.id,
        name: s.name,
        roll_no: s.roll_no,
        enrollment_no: s.enrollment_no,
        class: s.class,
        semester: s.semester,
        mobile: s.mobile,
        parent_mobile: s.parent_mobile,
        scholarship_status: s.scholarship_status
      }))
    res.json({ guardian: { id: admin.id, name: admin.name }, items })
  }
)

// Deprecated guardian self endpoints; admins should use /students

// Deprecated guardian self endpoints; admins should use /students

module.exports = router
