const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/db');
const store = require('../store/memory');
const useMem = process.env.USE_MEMORY_STORE !== 'false';
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { ROLES, EBC_STATUS, SCHOLARSHIP_STATUS } = require('../utils/constants');

const router = express.Router();

router.post(
  '/',
  authenticate,
  requireRole(ROLES.ADMIN),
  body('name').isString().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('roll_no').isString().isLength({ min: 1 }).withMessage('Roll No must be at least 1 character'),
  body('branch_id').optional().isInt().withMessage('Branch must be a valid integer'),
  body('year').optional().isString(),
  body('batch').optional().isString(),
  body('enrollment_no').optional().isString(),
  body('class').optional().isString(),
  body('semester').optional().isIn(['I','II','III','IV','V','VI']).withMessage('Invalid semester'),
  body('mobile').optional().isString(),
  body('parent_mobile').optional().isString(),
  body('local_address').optional().isString(),
  body('permanent_address').optional().isString(),
  body('parent_occupation').optional().isString(),
  body('scholarship_id').optional().isString(),
  body('scholarship_password').optional().isString(),
  body('scholarship_status').optional().isIn(Object.values(SCHOLARSHIP_STATUS)).withMessage('Invalid scholarship status'),
  body('exam_form_status').optional().isString(),
  body('prev_results').optional().isObject().withMessage('Previous results must be an object'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('POST /students validation errors:', errors.array(), 'body:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, roll_no } = req.body;
      const branch_id = Number(req.body.branch_id ?? req.user.branch_id);
      if (req.user.branch_id !== branch_id) return res.status(403).json({ message: 'Branch mismatch' });
      if (useMem) {
        if (req.user.roll_range_from != null && req.user.roll_range_to != null) {
          const match = String(roll_no).match(/\d+$/)
          const num = match ? Number(match[0]) : NaN
          if (!Number.isFinite(num)) return res.status(400).json({ message: 'Invalid roll number format' })
          if (num < Number(req.user.roll_range_from) || num > Number(req.user.roll_range_to)) {
            return res.status(403).json({ message: `Roll number out of allowed range ${req.user.roll_range_from}-${req.user.roll_range_to}` })
          }
        }
        const currentCount = store.listStudents({ role: ROLES.ADMIN, user: req.user, page: 1, limit: 1000 }).total
        if (currentCount >= 20) return res.status(403).json({ message: 'Limit reached: max 20 students per admin' });
        const dup = store.getStudentByRollNoInBranch(roll_no, branch_id);
        if (dup) return res.status(409).json({ message: 'Roll number already exists' });
        const created = store.createStudent({
          name,
          roll_no,
          branch_id,
          year: req.body.year,
          batch: req.body.batch,
          created_by_admin_id: req.user.id,
          enrollment_no: req.body.enrollment_no,
          class: req.body.class,
          semester: req.body.semester,
          mobile: req.body.mobile,
          parent_mobile: req.body.parent_mobile,
          local_address: req.body.local_address,
          permanent_address: req.body.permanent_address,
          parent_occupation: req.body.parent_occupation,
          scholarship_id: req.body.scholarship_id,
          scholarship_password: req.body.scholarship_password,
          scholarship_status: req.body.scholarship_status,
          exam_form_status: req.body.exam_form_status,
          prev_results: req.body.prev_results
        });
        return res.status(201).json(created);
      } else {
        const { rows: countRows } = await db.query('SELECT COUNT(*)::int AS cnt FROM students WHERE created_by_admin_id=$1', [req.user.id]);
        if (Number(countRows[0].cnt) >= 20) return res.status(403).json({ message: 'Limit reached: max 20 students per admin' });
        // NOTE: For DB mode, roll range enforcement would require columns on users; skipping here.
        const { rows: existing } = await db.query('SELECT id FROM students WHERE roll_no=$1', [roll_no]);
        if (existing.length) return res.status(409).json({ message: 'Roll number already exists' });
        const { rows } = await db.query(
          `INSERT INTO students (name, roll_no, branch_id, created_by_admin_id, year, batch, ebc_status, remark, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW())
           RETURNING id, name, roll_no, branch_id, created_by_admin_id, year, batch, ebc_status, remark, created_at`,
          [name, roll_no, branch_id, req.user.id, req.body.year || null, req.body.batch || null, EBC_STATUS.PENDING, null]
        );
        return res.status(201).json(rows[0]);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/',
  authenticate,
  query('status').optional().isString(),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('branch_id').optional().isInt(),
  query('year').optional().isString(),
  query('batch').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { status, search, branch_id, year, batch } = req.query;
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      if (useMem) {
        const result = store.listStudents({ role: req.user.role, user: req.user, status, search, page, limit, branch_id, year, batch });
        return res.json(result);
      } else {
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
        if (req.user.role === ROLES.ADMIN) {
          params.push(req.user.id);
          conditions.push(`created_by_admin_id = $${params.length}`);
        } else if (req.user.role === ROLES.HOD) {
          params.push(req.user.branch_id);
          conditions.push(`branch_id = $${params.length}`);
        } else if (req.user.role === ROLES.DEAN) {
          if (branch_id) {
            params.push(branch_id);
            conditions.push(`branch_id = $${params.length}`);
          }
        } else if (req.user.role === ROLES.PRINCIPAL) {
          if (branch_id) {
            params.push(branch_id);
            conditions.push(`branch_id = $${params.length}`);
          }
          if (year) {
            params.push(year);
            conditions.push(`year = $${params.length}`);
          }
          if (batch) {
            params.push(batch);
            conditions.push(`batch = $${params.length}`);
          }
        }
        if (status) {
          params.push(status);
          conditions.push(`ebc_status = $${params.length}`);
        }
        if (search) {
          params.push(`%${search}%`);
          conditions.push(`(name ILIKE $${params.length} OR roll_no ILIKE $${params.length})`);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const dataQuery = `
          SELECT s.id, s.name, s.roll_no, s.branch_id, s.created_by_admin_id, s.year, s.batch, s.ebc_status, s.remark, s.created_at,
                 b.branch_name, u.name AS admin_name
          FROM students s
          JOIN branches b ON b.id = s.branch_id
          JOIN users u ON u.id = s.created_by_admin_id
          ${where}
          ORDER BY s.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const countQuery = `SELECT COUNT(*) FROM students s ${where}`;
        const [dataRes, countRes] = await Promise.all([
          db.query(dataQuery, params),
          db.query(countQuery, params)
        ]);
        return res.json({
          items: dataRes.rows,
          page,
          limit,
          total: Number(countRes.rows[0].count)
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    if (useMem) {
      const student = store.getStudentById(id);
      if (!student) return res.status(404).json({ message: 'Not found' });
      if (req.user.role === ROLES.ADMIN && student.created_by_admin_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (req.user.role === ROLES.HOD && student.branch_id !== req.user.branch_id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return res.json(student);
    } else {
      const { rows } = await db.query(
        `SELECT s.*, b.branch_name, u.name AS admin_name FROM students s
         JOIN branches b ON b.id = s.branch_id
         JOIN users u ON u.id = s.created_by_admin_id
         WHERE s.id = $1`,
        [id]
      );
      if (!rows.length) return res.status(404).json({ message: 'Not found' });
      const student = rows[0];
      if (req.user.role === ROLES.ADMIN && student.created_by_admin_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      if (req.user.role === ROLES.HOD && student.branch_id !== req.user.branch_id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      return res.json(student);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put(
  '/:id',
  authenticate,
  requireRole(ROLES.ADMIN),
  body('name').optional().isString().isLength({ min: 2 }),
  body('roll_no').optional().isString().isLength({ min: 1 }),
  body('ebc_status').optional().isIn(Object.values(EBC_STATUS)),
  body('remark').optional({ nullable: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { id } = req.params;
      const { name, roll_no, ebc_status, remark } = req.body;
      if (useMem) {
        if (roll_no) {
          const admin = store.getUserById(req.user.id)
          if (admin && admin.roll_range_from != null && admin.roll_range_to != null) {
            const match = String(roll_no).match(/\d+$/)
            const num = match ? Number(match[0]) : NaN
            if (!Number.isFinite(num)) return res.status(400).json({ message: 'Invalid roll number format' })
            if (num < Number(admin.roll_range_from) || num > Number(admin.roll_range_to)) {
              return res.status(403).json({ message: `Roll number out of allowed range ${admin.roll_range_from}-${admin.roll_range_to}` })
            }
          }
        }
        const updated = store.updateStudent(id, { name, roll_no, ebc_status, remark }, req.user);
        if (updated === 'FORBIDDEN') return res.status(403).json({ message: 'Not allowed to modify other admin students' });
        if (updated === 'DUPLICATE') return res.status(409).json({ message: 'Roll number already exists' });
        if (!updated) return res.status(404).json({ message: 'Not found' });
        return res.json(updated);
      } else {
        const { rows: found } = await db.query('SELECT id, created_by_admin_id FROM students WHERE id=$1', [id]);
        if (!found.length) return res.status(404).json({ message: 'Not found' });
        if (found[0].created_by_admin_id !== req.user.id) {
          return res.status(403).json({ message: 'Not allowed to modify other admin students' });
        }
        if (roll_no) {
          const { rows: existing } = await db.query('SELECT id FROM students WHERE roll_no=$1 AND id<>$2', [roll_no, id]);
          if (existing.length) return res.status(409).json({ message: 'Roll number already exists' });
        }
        const fields = [];
        const params = [];
        if (name) { params.push(name); fields.push(`name=$${params.length}`); }
        if (roll_no) { params.push(roll_no); fields.push(`roll_no=$${params.length}`); }
        if (ebc_status) { params.push(ebc_status); fields.push(`ebc_status=$${params.length}`); }
        if (typeof remark !== 'undefined') { params.push(remark || null); fields.push(`remark=$${params.length}`); }
        params.push(id);
        const { rows } = await db.query(
          `UPDATE students SET ${fields.join(', ')} WHERE id=$${params.length}
           RETURNING id, name, roll_no, branch_id, created_by_admin_id, ebc_status, remark, created_at`,
          params
        );
        return res.json(rows[0]);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/:id/status',
  authenticate,
  requireRole(ROLES.ADMIN),
  body('ebc_status').isIn(Object.values(EBC_STATUS)),
  body('remark').optional({ nullable: true }).isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { id } = req.params;
      const { ebc_status, remark } = req.body;
      if (useMem) {
        const updated = store.updateStudentStatus(id, ebc_status, remark, req.user);
        if (updated === 'FORBIDDEN') return res.status(403).json({ message: 'Not allowed to modify other admin students' });
        if (!updated) return res.status(404).json({ message: 'Not found' });
        return res.json(updated);
      } else {
        const { rows: found } = await db.query(
          'SELECT id, created_by_admin_id FROM students WHERE id=$1',
          [id]
        );
        if (!found.length) return res.status(404).json({ message: 'Not found' });
        if (found[0].created_by_admin_id !== req.user.id) {
          return res.status(403).json({ message: 'Not allowed to modify other admin students' });
        }
        const { rows } = await db.query(
          `UPDATE students SET ebc_status=$1, remark=$2 WHERE id=$3
           RETURNING id, name, roll_no, branch_id, created_by_admin_id, ebc_status, remark, created_at`,
          [ebc_status, ebc_status === EBC_STATUS.REJECTED_WITH_QUERY ? remark || '' : remark || null, id]
        );
        return res.json(rows[0]);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete('/:id', authenticate, requireRole(ROLES.ADMIN), async (req, res) => {
  try {
    const { id } = req.params;
    if (useMem) {
      const ok = store.deleteStudent(id, req.user);
      if (ok === 'FORBIDDEN') return res.status(403).json({ message: 'Not allowed to delete other admin students' });
      if (!ok) return res.status(404).json({ message: 'Not found' });
      return res.status(204).send();
    } else {
      const { rows: found } = await db.query('SELECT id, created_by_admin_id FROM students WHERE id=$1', [id]);
      if (!found.length) return res.status(404).json({ message: 'Not found' });
      if (found[0].created_by_admin_id !== req.user.id) {
        return res.status(403).json({ message: 'Not allowed to delete other admin students' });
      }
      await db.query('DELETE FROM students WHERE id=$1', [id]);
      return res.status(204).send();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
