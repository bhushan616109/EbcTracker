const { EBC_STATUS, ROLES, SCHOLARSHIP_STATUS } = require('../utils/constants')
const bcrypt = require('bcryptjs')
const persist = require('./persist')

let branches = [
  { id: 1, branch_name: 'CSE' },
  { id: 2, branch_name: 'CIVIL' },
  { id: 3, branch_name: 'MECH' }
]

const passwordHash = '$2a$10$ejz4dWmzg.1sjSAu9iuScO6ASZBUAWvoVPQ/ukW3qOlipusCBb1eS'

let users = [
  { id: 1, name: 'Principal User', email: 'principal@example.com', username: 'principal', password: passwordHash, role: ROLES.PRINCIPAL, branch_id: null },
  { id: 2, name: 'Dean User', email: 'dean@example.com', username: 'dean', password: passwordHash, role: ROLES.DEAN, branch_id: null },
  { id: 3, name: 'CSE HOD', email: 'hod.cse@example.com', username: 'hod.cse', password: passwordHash, role: ROLES.HOD, branch_id: 1 },
  { id: 4, name: 'CSE Admin A', email: 'admin.a.cse@example.com', username: 'admin.a.cse', password: passwordHash, role: ROLES.ADMIN, branch_id: 1, roll_range_from: null, roll_range_to: null },
  { id: 5, name: 'CSE Admin B', email: 'admin.b.cse@example.com', username: 'admin.b.cse', password: passwordHash, role: ROLES.ADMIN, branch_id: 1, roll_range_from: null, roll_range_to: null }
]

let guardians = [
  // seed one guardian under CSE
  {
    id: 1,
    name: 'CSE Guardian 1',
    username: 'guardian.cse1',
    password: passwordHash,
    branch_id: 1,
    division: 'A',
    batch_from: 2023,
    batch_to: 2027
  }
]
let guardianIdCounter = guardians.length ? Math.max(...guardians.map((g) => g.id)) + 1 : 1

let studentIdCounter = 1
let students = Array.from({ length: 30 }).map((_, i) => {
  const statuses = [EBC_STATUS.PENDING, EBC_STATUS.APPROVED, EBC_STATUS.REJECTED, EBC_STATUS.REJECTED_WITH_QUERY]
  const status = statuses[i % statuses.length]
  return {
    id: studentIdCounter++,
    name: `Student ${i + 1}`,
    roll_no: `CSE${String(i + 1).padStart(3, '0')}`,
    branch_id: 1,
    created_by_admin_id: 4,
    ebc_status: status,
    remark: status === EBC_STATUS.REJECTED_WITH_QUERY ? 'Need clarification on documents' : null,
    created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)
  }
})

;(() => {
  const loaded = persist.loadInitial({ branches, users, guardians, guardianIdCounter, students, studentIdCounter })
  branches = loaded.branches || branches
  users = loaded.users || users
  guardians = loaded.guardians || guardians
  guardianIdCounter = loaded.guardianIdCounter || guardianIdCounter
  students = loaded.students || students
  studentIdCounter = loaded.studentIdCounter || studentIdCounter
})()

;(() => {
  const needMigrate = Array.isArray(guardians) && guardians.length > 0
  if (needMigrate) {
    let changed = false
    for (const g of guardians) {
      const exists = (users || []).some((u) => String(u.username || '').toLowerCase() === String(g.username || '').toLowerCase())
      if (!exists) {
        const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1
        users.push({
          id,
          name: g.name,
          email: `${g.username}@example.com`,
          username: g.username,
          password: g.password,
          role: ROLES.ADMIN,
          branch_id: g.branch_id
        })
        changed = true
      }
    }
    guardians = []
    guardianIdCounter = 1
    if (changed) persist.save(snapshot())
  }
})()

;(() => {
  const before = students.length
  students = students.filter((s) => s.branch_id !== 2)
  if (students.length !== before) persist.save(snapshot())
})()

function snapshot() {
  return { branches, users, guardians, guardianIdCounter, students, studentIdCounter }
}

function ensureSeed() {
  const hasEntc = branches.some((b) => b.branch_name === 'ENTC')
  if (!hasEntc) {
    const newId = branches.length ? Math.max(...branches.map((b) => b.id)) + 1 : 1
    branches.push({ id: newId, branch_name: 'ENTC' })
    const hodEmail = 'hod.entc@example.com'
    const existsHod = users.some((u) => u.email === hodEmail)
    if (!existsHod) {
      const newUserId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1
      users.push({ id: newUserId, name: 'ENTC HOD', email: hodEmail, password: passwordHash, role: ROLES.HOD, branch_id: newId })
    }
    persist.save(snapshot())
  }
}
ensureSeed()

function ensureCivilAdminSeed() {
  if (process.env.DEMO_CIVIL_ADMIN !== 'true') return
  const civil = branches.find((b) => b.branch_name === 'CIVIL') || { id: 2 }
  const email = 'admin.a.civil@example.com'
  let changed = false
  let civilAdmin = users.find((u) => u.email === email)
  if (!civilAdmin) {
    const newUserId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1
    civilAdmin = { id: newUserId, name: 'CIVIL Admin A', email, username: 'admin.a.civil', password: passwordHash, role: ROLES.ADMIN, branch_id: civil.id, roll_range_from: 1, roll_range_to: 13 }
    users.push(civilAdmin)
    changed = true
  } else {
    if (civilAdmin.roll_range_from == null || civilAdmin.roll_range_to == null) {
      civilAdmin.roll_range_from = 1
      civilAdmin.roll_range_to = 13
      changed = true
    }
  }
  const existingCount = students.filter((s) => s.created_by_admin_id === civilAdmin.id).length
  if (existingCount < 20) {
    const need = 20 - existingCount
    const statuses = [EBC_STATUS.PENDING, EBC_STATUS.APPROVED, EBC_STATUS.REJECTED, EBC_STATUS.REJECTED_WITH_QUERY]
    for (let i = 0; i < need; i++) {
      const status = statuses[i % statuses.length]
      const id = studentIdCounter++
      const s = {
        id,
        name: `Civil Student ${i + 1}`,
        roll_no: `CIV${String(i + 1).padStart(3, '0')}`,
        branch_id: civil.id,
        created_by_admin_id: civilAdmin.id,
        ebc_status: status,
        remark: status === EBC_STATUS.REJECTED_WITH_QUERY ? 'Docs verification pending' : null,
        created_at: new Date(Date.now() - (i + 1) * 12 * 60 * 60 * 1000)
      }
      students.unshift(s)
      changed = true
    }
  }
  if (changed) persist.save(snapshot())
}
ensureCivilAdminSeed()

function getBranchName(branch_id) {
  const b = branches.find((x) => x.id === branch_id)
  return b ? b.branch_name : ''
}

function getUserByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null
}
function getUserByUsername(username) {
  return users.find((u) => (u.username || '').toLowerCase() === String(username).toLowerCase()) || null
}

function getGuardianByUsername(username) {
  return guardians.find((g) => g.username.toLowerCase() === String(username).toLowerCase()) || null
}

function getUserById(id) {
  return users.find((u) => u.id === Number(id)) || null
}

function createUser({ name, email, username, password, role, branch_id }) {
  const id = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1
  const user = { id, name, email, username: username || null, password, role, branch_id: role === ROLES.DEAN || role === ROLES.PRINCIPAL ? null : branch_id || null }
  users.push(user)
  persist.save(snapshot())
  return { id: user.id, name: user.name, email: user.email, role: user.role, branch_id: user.branch_id }
}

function createGuardian({ name, username, password, branch_id, division, batch_from, batch_to }) {
  const id = guardianIdCounter++
  const g = { id, name, username, password, branch_id, division, batch_from, batch_to }
  guardians.push(g)
  persist.save(snapshot())
  return g
}

function listGuardiansByBranch(branch_id) {
  return users
    .filter((u) => u.role === ROLES.ADMIN && u.branch_id === Number(branch_id))
    .map((u) => ({ id: u.id, name: u.name, username: u.username || '', branch_id: u.branch_id }))
}

function createStudent(payload) {
  const id = studentIdCounter++
  const s = {
    id,
    name: payload.name,
    roll_no: payload.roll_no,
    enrollment_no: payload.enrollment_no || '',
    branch_id: payload.branch_id,
    division: payload.division || '',
    class: payload.class || '',
    semester: payload.semester || '',
    mobile: payload.mobile || '',
    parent_mobile: payload.parent_mobile || '',
    local_address: payload.local_address || '',
    permanent_address: payload.permanent_address || '',
    parent_occupation: payload.parent_occupation || '',
    scholarship_id: payload.scholarship_id || '',
    scholarship_password: payload.scholarship_password || '',
    scholarship_status: payload.scholarship_status || SCHOLARSHIP_STATUS.PENDING,
    exam_form_status: payload.exam_form_status || '',
    prev_results: payload.prev_results || {},
    created_by_admin_id: payload.created_by_admin_id,
    ebc_status: EBC_STATUS.PENDING,
    remark: null,
    created_at: new Date()
  }
  students.unshift(s)
  persist.save(snapshot())
  return withJoins(s)
}

function createStudentByGuardian(guardian, payload) {
  const id = studentIdCounter++
  const s = {
    id,
    name: payload.name,
    roll_no: payload.roll_no,
    enrollment_no: payload.enrollment_no || '',
    branch_id: guardian.branch_id,
    division: payload.division || guardian.division || '',
    class: payload.class || '',
    semester: payload.semester || '',
    mobile: payload.mobile || '',
    parent_mobile: payload.parent_mobile || '',
    local_address: payload.local_address || '',
    permanent_address: payload.permanent_address || '',
    parent_occupation: payload.parent_occupation || '',
    scholarship_id: payload.scholarship_id || '',
    scholarship_status: payload.scholarship_status || SCHOLARSHIP_STATUS.PENDING,
    exam_form_status: payload.exam_form_status || '',
    prev_results: payload.prev_results || {}, // { '1': 72, '2': 48, ... } percentages
    guardian_id: guardian.id,
    created_by_admin_id: null,
    ebc_status: EBC_STATUS.PENDING,
    remark: null,
    created_at: new Date()
  }
  students.unshift(s)
  persist.save(snapshot())
  return s
}

function withJoins(s) {
  const admin = users.find((u) => u.id === s.created_by_admin_id)
  const guardian = s.guardian_id ? guardians.find((g) => g.id === s.guardian_id) : null
  return {
    ...s,
    branch_name: getBranchName(s.branch_id),
    admin_name: admin ? admin.name : '',
    guardian_name: guardian ? guardian.name : ''
  }
}

function listStudents({ role, user, status, search, page = 1, limit = 10 }) {
  let data = students.slice()
  if (role === ROLES.ADMIN) {
    data = data.filter((s) => s.created_by_admin_id === user.id)
  } else if (role === ROLES.HOD) {
    data = data.filter((s) => s.branch_id === user.branch_id)
  } else if (role === ROLES.GUARDIAN) {
    data = data.filter((s) => s.guardian_id === user.id)
  }
  if (status) data = data.filter((s) => s.ebc_status === status)
  if (search) {
    const q = search.toLowerCase()
    data = data.filter((s) => s.name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q))
  }
  data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  const total = data.length
  const start = (page - 1) * limit
  const items = data.slice(start, start + limit).map(withJoins)
  return { items, page, limit, total }
}

function getStudentById(id) {
  const s = students.find((x) => x.id === Number(id))
  return s ? withJoins(s) : null
}

function updateStudentStatus(id, ebc_status, remark, requester) {
  const idx = students.findIndex((x) => x.id === Number(id))
  if (idx === -1) return null
  const s = students[idx]
  if (requester.role === ROLES.ADMIN && s.created_by_admin_id !== requester.id) return 'FORBIDDEN'
  if (requester.role === ROLES.GUARDIAN && s.guardian_id !== requester.id) return 'FORBIDDEN'
  s.ebc_status = ebc_status
  s.remark = ebc_status === EBC_STATUS.REJECTED_WITH_QUERY ? (remark || '') : (remark || null)
  students[idx] = s
  persist.save(snapshot())
  return withJoins(s)
}

function getStudentByRollNo(roll_no) {
  return students.find((x) => x.roll_no.toLowerCase() === String(roll_no).toLowerCase()) || null
}

function updateStudent(id, fields, requester) {
  const idx = students.findIndex((x) => x.id === Number(id))
  if (idx === -1) return null
  const s = students[idx]
  if (requester.role === ROLES.ADMIN && s.created_by_admin_id !== requester.id) return 'FORBIDDEN'
  if (requester.role === ROLES.GUARDIAN && s.guardian_id !== requester.id) return 'FORBIDDEN'
  if (fields.roll_no && fields.roll_no.toLowerCase() !== s.roll_no.toLowerCase()) {
    const dup = getStudentByRollNo(fields.roll_no)
    if (dup) return 'DUPLICATE'
  }
  const next = {
    ...s,
    name: fields.name ?? s.name,
    roll_no: fields.roll_no ?? s.roll_no,
    ebc_status: fields.ebc_status ?? s.ebc_status,
    remark: fields.remark ?? s.remark,
    enrollment_no: fields.enrollment_no ?? s.enrollment_no,
    class: fields.class ?? s.class,
    semester: fields.semester ?? s.semester,
    mobile: fields.mobile ?? s.mobile,
    parent_mobile: fields.parent_mobile ?? s.parent_mobile,
    local_address: fields.local_address ?? s.local_address,
    permanent_address: fields.permanent_address ?? s.permanent_address,
    parent_occupation: fields.parent_occupation ?? s.parent_occupation,
    scholarship_id: fields.scholarship_id ?? s.scholarship_id,
    scholarship_password: fields.scholarship_password ?? s.scholarship_password,
    scholarship_status: fields.scholarship_status ?? s.scholarship_status,
    exam_form_status: fields.exam_form_status ?? s.exam_form_status,
    prev_results: fields.prev_results ?? s.prev_results
  }
  students[idx] = next
  persist.save(snapshot())
  return withJoins(next)
}

function deleteStudent(id, requester) {
  const idx = students.findIndex((x) => x.id === Number(id))
  if (idx === -1) return null
  const s = students[idx]
  if (requester.role === ROLES.ADMIN && s.created_by_admin_id !== requester.id) return 'FORBIDDEN'
  if (requester.role === ROLES.GUARDIAN && s.guardian_id !== requester.id) return 'FORBIDDEN'
  students.splice(idx, 1)
  persist.save(snapshot())
  return true
}
function dashboardSummary(role, user, branch_id) {
  let data = students.slice()
  if (role === ROLES.ADMIN) {
    data = data.filter((s) => s.created_by_admin_id === user.id)
  } else if (role === ROLES.HOD) {
    data = data.filter((s) => s.branch_id === user.branch_id)
  } else if ((role === ROLES.DEAN || role === ROLES.PRINCIPAL) && branch_id) {
    data = data.filter((s) => s.branch_id === Number(branch_id))
  } else if (role === ROLES.GUARDIAN) {
    data = data.filter((s) => s.guardian_id === user.id)
  }
  const totals = {
    pending: data.filter((s) => s.ebc_status === EBC_STATUS.PENDING).length,
    approved: data.filter((s) => s.ebc_status === EBC_STATUS.APPROVED).length,
    rejected: data.filter((s) => s.ebc_status === EBC_STATUS.REJECTED).length,
    rejected_with_query: data.filter((s) => s.ebc_status === EBC_STATUS.REJECTED_WITH_QUERY).length,
    total: data.length
  }
  let breakdown = []
  if (role === ROLES.HOD) {
    const groups = {}
    data.forEach((s) => {
      const admin = users.find((u) => u.id === s.created_by_admin_id)
      const key = admin ? admin.id : 0
      const name = admin ? admin.name : ''
      groups[key] = groups[key] || { admin_id: key, admin_name: name, total: 0, pending: 0, approved: 0, rejected: 0, rejected_with_query: 0 }
      const g = groups[key]
      g.total++
      if (s.ebc_status === EBC_STATUS.PENDING) g.pending++
      if (s.ebc_status === EBC_STATUS.APPROVED) g.approved++
      if (s.ebc_status === EBC_STATUS.REJECTED) g.rejected++
      if (s.ebc_status === EBC_STATUS.REJECTED_WITH_QUERY) g.rejected_with_query++
    })
    breakdown = Object.values(groups).map((r) => ({ type: 'admin', ...r }))
  } else if (role === ROLES.DEAN || role === ROLES.PRINCIPAL) {
    const groups = {}
    data.forEach((s) => {
      const b = branches.find((x) => x.id === s.branch_id)
      const key = b ? b.id : 0
      const name = b ? b.branch_name : ''
      groups[key] = groups[key] || { branch_id: key, branch_name: name, total: 0, pending: 0, approved: 0, rejected: 0, rejected_with_query: 0 }
      const g = groups[key]
      g.total++
      if (s.ebc_status === EBC_STATUS.PENDING) g.pending++
      if (s.ebc_status === EBC_STATUS.APPROVED) g.approved++
      if (s.ebc_status === EBC_STATUS.REJECTED) g.rejected++
      if (s.ebc_status === EBC_STATUS.REJECTED_WITH_QUERY) g.rejected_with_query++
    })
    breakdown = Object.values(groups).map((r) => ({ type: 'branch', ...r }))
  }
  return { totals, breakdown }
}

function extendedSummary(role, user, branch_id) {
  let stu = students.slice()
  let gList = guardians.slice()
  if (role === ROLES.HOD) {
    stu = stu.filter((s) => s.branch_id === user.branch_id)
    gList = gList.filter((g) => g.branch_id === user.branch_id)
  } else if ((role === ROLES.DEAN || role === ROLES.PRINCIPAL) && branch_id) {
    stu = stu.filter((s) => s.branch_id === Number(branch_id))
    gList = gList.filter((g) => g.branch_id === Number(branch_id))
  }
  const totalStudents = stu.length
  const guardianCount = gList.length
  const batchKey = (g) => `${g.division}:${g.batch_from}-${g.batch_to}`
  const batches = new Set(gList.map(batchKey))
  const scholarshipApproved = stu.filter((s) => s.scholarship_status === SCHOLARSHIP_STATUS.APPROVED).length
  const scholarshipNotApproved = stu.filter((s) => s.scholarship_status !== SCHOLARSHIP_STATUS.APPROVED).length
  const weakStudents = stu.filter((s) => {
    const pr = s.prev_results || {}
    const below = Object.values(pr).filter((p) => Number(p) < 50).length
    return below >= 2
  }).length
  return {
    totals: {
      total_students: totalStudents,
      guardians: guardianCount,
      batches: batches.size,
      scholarship_approved: scholarshipApproved,
      scholarship_not_approved: scholarshipNotApproved,
      weak_students: weakStudents
    }
  }
}

module.exports = {
  branches,
  users,
  guardians,
  students,
  getUserByEmail,
  getUserByUsername,
  getGuardianByUsername,
  createUser,
  createGuardian,
  listGuardiansByBranch,
  createStudent,
  createStudentByGuardian,
  listStudents,
  getStudentById,
  getStudentByRollNo,
  updateStudentStatus,
  updateStudent,
  deleteStudent,
  dashboardSummary,
  extendedSummary
}
