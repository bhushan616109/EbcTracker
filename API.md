# API Documentation

Base URL: http://localhost:4000/api

Auth
- POST /auth/login
  - Body: { email, password }
  - Response: { token, user }
- POST /auth/register
  - Restricted to PRINCIPAL
  - Body: { name, email, password, role, branch_id? }
  - Response: created user

Students
- POST /students
  - Role: ADMIN
  - Body: { name, roll_no, branch_id }
  - Validations: branch_id must equal admin's branch
  - Response: student
- GET /students
  - Roles: ADMIN, HOD, DEAN, PRINCIPAL
  - Query: status?, search?, page?, limit?, branch_id?, year?, batch?
  - RBAC:
    - ADMIN: only own students
    - HOD: only own branch
    - DEAN: branch_id optional
    - PRINCIPAL: branch_id, year, batch optional
  - Response: { items, page, limit, total }
- GET /students/:id
  - Roles: ADMIN, HOD, DEAN, PRINCIPAL
  - RBAC: checks same as list
  - Response: student
- PUT /students/:id/status
  - Role: ADMIN
  - Body: { ebc_status, remark? }
  - Restriction: admin can update only own students
  - Response: updated student

Dashboard
- GET /dashboard/summary
  - Roles: all
  - Query: branch_id? (Dean optional)
  - Response:
    - totals: { total, pending, approved, rejected, rejected_with_query }
    - breakdown:
      - HOD: admin-wise
      - Dean/Principal: branch-wise

Health
- GET /health
  - Response: { status, uptime }
