-- Seed branches
INSERT INTO branches (branch_name) VALUES 
 ('CSE'), ('CIVIL'), ('MECH')
ON CONFLICT (branch_name) DO NOTHING;

-- Seed users (password: Password123!)
-- Principal
INSERT INTO users (name, email, password, role, branch_id)
VALUES ('Principal User', 'principal@example.com', '$2a$10$LEymx1GStK8xTn3Le/wjU.amIvmRzpI7hUUr3z1u2XBS.rP8i/nDq', 'PRINCIPAL', NULL)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    branch_id = EXCLUDED.branch_id;

-- Dean
INSERT INTO users (name, email, password, role, branch_id)
VALUES ('Dean User', 'dean@example.com', '$2a$10$LEymx1GStK8xTn3Le/wjU.amIvmRzpI7hUUr3z1u2XBS.rP8i/nDq', 'DEAN', NULL)
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    branch_id = EXCLUDED.branch_id;

-- HOD CSE
INSERT INTO users (name, email, password, role, branch_id)
SELECT 'CSE HOD', 'hod.cse@example.com', '$2a$10$LEymx1GStK8xTn3Le/wjU.amIvmRzpI7hUUr3z1u2XBS.rP8i/nDq', 'HOD', b.id
FROM branches b WHERE b.branch_name='CSE'
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    branch_id = EXCLUDED.branch_id;

-- Admins
INSERT INTO users (name, email, password, role, branch_id)
SELECT 'CSE Admin A', 'admin.a.cse@example.com', '$2a$10$LEymx1GStK8xTn3Le/wjU.amIvmRzpI7hUUr3z1u2XBS.rP8i/nDq', 'ADMIN', b.id
FROM branches b WHERE b.branch_name='CSE'
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    branch_id = EXCLUDED.branch_id;

INSERT INTO users (name, email, password, role, branch_id)
SELECT 'CSE Admin B', 'admin.b.cse@example.com', '$2a$10$LEymx1GStK8xTn3Le/wjU.amIvmRzpI7hUUr3z1u2XBS.rP8i/nDq', 'ADMIN', b.id
FROM branches b WHERE b.branch_name='CSE'
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    branch_id = EXCLUDED.branch_id;

-- Sample students for Admin A (30)
WITH admin_a AS (
  SELECT id AS admin_id, branch_id FROM users WHERE email='admin.a.cse@example.com'
), cse AS (
  SELECT id AS branch_id FROM branches WHERE branch_name='CSE'
)
INSERT INTO students (name, roll_no, branch_id, created_by_admin_id, year, batch, ebc_status, remark, created_at)
SELECT 
  CONCAT('Student ', i)::varchar(120) AS name,
  CONCAT('CSE', LPAD(i::text, 3, '0'))::varchar(40) AS roll_no,
  (SELECT branch_id FROM cse) AS branch_id,
  (SELECT admin_id FROM admin_a) AS created_by_admin_id,
  (ARRAY['1st Year','2nd Year','3rd Year','4th Year'])[((i-1)%4)+1]::varchar(20) AS year,
  (ARRAY['2023-2027','2022-2026','2021-2025','2020-2024'])[((i-1)%4)+1]::varchar(20) AS batch,
  (ARRAY['Pending','Approved','Rejected','Rejected with Query'])[((random()*3)::int + 1)]::varchar(40) AS ebc_status,
  CASE WHEN ((random()*3)::int)=3 THEN 'Need clarification on documents' ELSE NULL END,
  NOW() - (i || ' days')::interval
FROM generate_series(1, 30) s(i);
