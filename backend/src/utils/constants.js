/* Role and Status constants */
const ROLES = {
  ADMIN: 'ADMIN',
  HOD: 'HOD',
  DEAN: 'DEAN',
  PRINCIPAL: 'PRINCIPAL',
  GUARDIAN: 'GUARDIAN'
};

const EBC_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REJECTED_WITH_QUERY: 'Rejected with Query'
};

const SCHOLARSHIP_STATUS = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  REJECTED_WITH_QUERY: 'Rejected with Query'
};

module.exports = { ROLES, EBC_STATUS, SCHOLARSHIP_STATUS };
