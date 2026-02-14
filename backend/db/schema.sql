-- PostgreSQL schema for College Guardian
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  branch_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(180) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','HOD','DEAN','PRINCIPAL')),
  branch_id INTEGER NULL REFERENCES branches(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  roll_no VARCHAR(40) NOT NULL UNIQUE,
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  created_by_admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ebc_status VARCHAR(40) NOT NULL CHECK (ebc_status IN ('Pending','Approved','Rejected','Rejected with Query')),
  remark TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_admin ON students(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(ebc_status);
