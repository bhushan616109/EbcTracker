# College Guardian Management System

Production-ready RBAC system for tracking EBC forms across branches and roles.

Roles
- ADMIN: manage own students in own branch, create/update status
- HOD: read-only for entire branch
- DEAN: read-only across all branches, filter by branch
- PRINCIPAL: read-only full institute

Stack
- Backend: Node.js, Express, JWT, express-validator, pg
- Frontend: React (Vite), react-router, chart.js
- DB: PostgreSQL

Setup
1) Create .env in backend from backend/.env.example
2) Ensure PostgreSQL is running and credentials match .env
3) In backend:
   - npm install
   - npm run db:migrate
   - npm run db:seed
   - npm run dev
4) In frontend:
   - create .env from frontend/.env.example if needed
   - npm install
   - npm run dev

Sample Users
- principal@example.com / Password123!
- dean@example.com / Password123!
- hod.cse@example.com / Password123!
- admin.a.cse@example.com / Password123!

Key Files
- Backend server: [server.js](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/src/server.js)
- Routes: [auth.js](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/src/routes/auth.js), [students.js](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/src/routes/students.js), [dashboard.js](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/src/routes/dashboard.js)
- DB config: [db.js](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/src/config/db.js)
- Constants: [constants.js](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/src/utils/constants.js)
- DB schema: [schema.sql](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/db/schema.sql)
- Seed data: [seed.sql](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/db/seed.sql)
- DB scripts: [db.js](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/backend/src/scripts/db.js)
- API docs: [API.md](file:///c:/Users/bhush/Documents/trae_projects/EBCTrcaker/API.md)

Notes
- Admin cannot see or modify other admins' students
- HOD limited to branch
- Dean can filter by branch
- Principal can view all
