const express = require('express');
const db = require('../config/db');
const store = require('../store/memory');
const useMem = process.env.USE_MEMORY_STORE !== 'false';
const { authenticate } = require('../middleware/auth');
const { ROLES, EBC_STATUS } = require('../utils/constants');
const { query, validationResult } = require('express-validator');

const router = express.Router();

router.get(
  '/summary',
  authenticate,
  query('branch_id').optional().isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      if (useMem) {
        const branchFilter = (req.user.role === ROLES.DEAN || req.user.role === ROLES.PRINCIPAL) ? (req.query.branch_id ? Number(req.query.branch_id) : null) : null
        const result = store.dashboardSummary(req.user.role, req.user, branchFilter)
        return res.json({
          scope: req.user.role,
          totals: result.totals,
          breakdown: result.breakdown
        })
      } else {
        let branchFilter = null;
        if (req.user.role === ROLES.ADMIN) {
          const { rows } = await db.query(
            `SELECT 
               COUNT(*) FILTER (WHERE ebc_status = $1) AS pending,
               COUNT(*) FILTER (WHERE ebc_status = $2) AS approved,
               COUNT(*) FILTER (WHERE ebc_status = $3) AS rejected,
               COUNT(*) FILTER (WHERE ebc_status = $4) AS rejected_with_query,
               COUNT(*) AS total
             FROM students
             WHERE created_by_admin_id = $5`,
            [EBC_STATUS.PENDING, EBC_STATUS.APPROVED, EBC_STATUS.REJECTED, EBC_STATUS.REJECTED_WITH_QUERY, req.user.id]
          );
          return res.json({
            scope: 'ADMIN',
            totals: rows[0],
            breakdown: []
          });
        }
        if (req.user.role === ROLES.HOD) {
          branchFilter = req.user.branch_id;
        }
        if (req.user.role === ROLES.DEAN) {
          branchFilter = req.query.branch_id ? Number(req.query.branch_id) : null;
        }
        const where = branchFilter ? 'WHERE s.branch_id = $1' : '';
        const params = branchFilter ? [branchFilter] : [];
        const totalsQuery = `
          SELECT 
            COUNT(*) FILTER (WHERE ebc_status = $${params.length + 1}) AS pending,
            COUNT(*) FILTER (WHERE ebc_status = $${params.length + 2}) AS approved,
            COUNT(*) FILTER (WHERE ebc_status = $${params.length + 3}) AS rejected,
            COUNT(*) FILTER (WHERE ebc_status = $${params.length + 4}) AS rejected_with_query,
            COUNT(*) AS total
          FROM students s
          ${where}
        `;
        const breakdownBranchQuery = `
          SELECT b.id AS branch_id, b.branch_name,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 1}) AS pending,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 2}) AS approved,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 3}) AS rejected,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 4}) AS rejected_with_query,
            COUNT(*) AS total
          FROM students s
          JOIN branches b ON b.id = s.branch_id
          ${where}
          GROUP BY b.id, b.branch_name
          ORDER BY b.branch_name
        `;
        const breakdownAdminQuery = `
          SELECT u.id AS admin_id, u.name AS admin_name,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 1}) AS pending,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 2}) AS approved,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 3}) AS rejected,
            COUNT(*) FILTER (WHERE s.ebc_status = $${params.length + 4}) AS rejected_with_query,
            COUNT(*) AS total
          FROM students s
          JOIN users u ON u.id = s.created_by_admin_id
          ${where}
          GROUP BY u.id, u.name
          ORDER BY u.name
        `;
        const statusParams = [EBC_STATUS.PENDING, EBC_STATUS.APPROVED, EBC_STATUS.REJECTED, EBC_STATUS.REJECTED_WITH_QUERY];
        const totalsRes = await db.query(totalsQuery, [...params, ...statusParams]);
        let breakdown = [];
        if (req.user.role === ROLES.HOD) {
          const adminRes = await db.query(breakdownAdminQuery, [...params, ...statusParams]);
          breakdown = adminRes.rows.map((r) => ({ type: 'admin', ...r }));
        } else if (req.user.role === ROLES.DEAN || req.user.role === ROLES.PRINCIPAL) {
          const branchRes = await db.query(breakdownBranchQuery, [...params, ...statusParams]);
          breakdown = branchRes.rows.map((r) => ({ type: 'branch', ...r }));
        }
        return res.json({
          scope: req.user.role,
          totals: totalsRes.rows[0],
          breakdown
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.get(
  '/extended',
  authenticate,
  query('branch_id').optional().isInt(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      if (useMem) {
        const branchFilter = (req.user.role === ROLES.DEAN || req.user.role === ROLES.PRINCIPAL) ? (req.query.branch_id ? Number(req.query.branch_id) : null) : null
        const result = store.extendedSummary(req.user.role, req.user, branchFilter)
        return res.json({ scope: req.user.role, totals: result.totals })
      } else {
        return res.status(501).json({ message: 'Not implemented for DB mode' })
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
