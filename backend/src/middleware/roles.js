/* Role and branch-based authorization helpers */
const { ROLES } = require('../utils/constants');

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

function restrictToOwnBranch(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role === ROLES.ADMIN || req.user.role === ROLES.HOD) {
    req.branchFilter = req.user.branch_id;
  }
  next();
}

module.exports = { requireRole, restrictToOwnBranch };
