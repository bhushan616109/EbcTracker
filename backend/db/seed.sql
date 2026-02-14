-- Seed branches
INSERT INTO branches (branch_name) VALUES 
 ('CSE'), ('CIVIL'), ('MECH')
ON CONFLICT (branch_name) DO NOTHING;

-- Seed users (password: Password123!)
-- Principal
INSERT INTO users (name, email, password, role, branch_id)
VALUES ('Principal User', 'principal@example.com', '$2a$10$0bYVnUT4cOAu8wC6OJpVSeiT5GgLkF7cFZBqYzYF1bIO5zKZmx6Iq', 'PRINCIPAL', NULL)
ON CONFLICT (email) DO NOTHING;

-- Dean
INSERT INTO users (name, email, password, role, branch_id)
VALUES ('Dean User', 'dean@example.com', '$2a$10$0bYVnUT4cOAu8wC6OJpVSeiT5GgLkF7cFZBqYzYF1bIO5zKZmx6Iq', 'DEAN', NULL)
ON CONFLICT (email) DO NOTHING;

-- HOD CSE
INSERT INTO users (name, email, password, role, branch_id)
SELECT 'CSE HOD', 'hod.cse@example.com', '$2a$10$0bYVnUT4cOAu8wC6OJpVSeiT5GgLkF7cFZBqYzYF1bIO5zKZmx6Iq', 'HOD', b.id
FROM branches b WHERE b.branch_name='CSE'
ON CONFLICT (email) DO NOTHING;

-- Admins
INSERT INTO users (name, email, password, role, branch_id)
SELECT 'CSE Admin A', 'admin.a.cse@example.com', '$2a$10$0bYVnUT4cOAu8wC6OJpVSeiT5GgLkF7cFZBqYzYF1bIO5zKZmx6Iq', 'ADMIN', b.id
FROM branches b WHERE b.branch_name='CSE'
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (name, email, password, role, branch_id)
SELECT 'CSE Admin B', 'admin.b.cse@example.com', '$2a$10$0bYVnUT4cOAu8wC6OJpVSeiT5GgLkF7cFZBqYzYF1bIO5zKZmx6Iq', 'ADMIN', b.id
FROM branches b WHERE b.branch_name='CSE'
ON CONFLICT (email) DO NOTHING;

-- Sample students for Admin A (30)
WITH admin_a AS (
  SELECT id AS admin_id, branch_id FROM users WHERE email='admin.a.cse@example.com'
), cse AS (
  SELECT id AS branch_id FROM branches WHERE branch_name='CSE'
)
INSERT INTO students (name, roll_no, branch_id, created_by_admin_id, ebc_status, remark, created_at)
SELECT 
  CONCAT('Student ', i)::varchar(120) AS name,
  CONCAT('CSE', LPAD(i::text, 3, '0'))::varchar(40) AS roll_no,
  (SELECT branch_id FROM cse) AS branch_id,
  (SELECT admin_id FROM admin_a) AS created_by_admin_id,
  (ARRAY['Pending','Approved','Rejected','Rejected with Query'])[((random()*3)::int + 1)]::varchar(40) AS ebc_status,
  CASE WHEN ((random()*3)::int)=3 THEN 'Need clarification on documents' ELSE NULL END,
  NOW() - (i || ' days')::interval
FROM generate_series(1, 30) s(i);
