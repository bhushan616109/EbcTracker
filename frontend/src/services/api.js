import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export const fetchDashboard = async (branch_id) => {
  const params = branch_id ? { branch_id } : {}
  const res = await axios.get('/dashboard/summary', { params })
  return res.data
}

export const fetchStudents = async (q = {}) => {
  const res = await axios.get('/students', { params: q })
  return res.data
}

export const createStudent = async (payload) => {
  const res = await axios.post('/students', payload)
  return res.data
}

export const updateStatus = async (id, payload) => {
  const res = await axios.put(`/students/${id}/status`, payload)
  return res.data
}

export const createGuardian = async (payload) => {
  const res = await axios.post('/guardians', payload)
  return res.data
}

export const listGuardians = async (params = {}) => {
  const res = await axios.get('/guardians', { params })
  return res.data
}

export const guardianAddStudent = async (payload) => {
  const res = await axios.post('/guardians/me/students', payload)
  return res.data
}

export const guardianListStudents = async () => {
  const res = await axios.get('/guardians/me/students')
  return res.data
}

export const guardianUpdateStudent = async (id, payload) => {
  const res = await axios.put(`/guardians/me/students/${id}`, payload)
  return res.data
}

export const guardianDeleteStudent = async (id) => {
  const res = await axios.delete(`/guardians/me/students/${id}`)
  return res.status === 204
}

export const fetchStudentById = async (id) => {
  const res = await axios.get(`/students/${id}`)
  return res.data
}

export const guardianListMeetings = async (student_id) => {
  const url = student_id ? `/guardians/me/meetings?student_id=${student_id}` : '/guardians/me/meetings'
  const res = await axios.get(url)
  return res.data
}

export const guardianAddMeeting = async (payload) => {
  const res = await axios.post('/guardians/me/meetings', payload)
  return res.data
}

export const fetchExtendedDashboard = async (branch_id) => {
  const params = branch_id ? { branch_id } : {}
  const res = await axios.get('/dashboard/extended', { params })
  return res.data
}

export const fetchBranches = async () => {
  const res = await axios.get('/branches')
  return res.data
}
export const updateStudent = async (id, payload) => {
  const res = await axios.put(`/students/${id}`, payload)
  return res.data
}

export const deleteStudent = async (id) => {
  const res = await axios.delete(`/students/${id}`)
  return res.status === 204
}

export const fetchMeetings = async (params = {}) => {
  const res = await axios.get('/dashboard/meetings', { params })
  return res.data
}
