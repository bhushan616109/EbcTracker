import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { guardianAddStudent, guardianListStudents, guardianUpdateStudent, guardianDeleteStudent, fetchStudentById, fetchExtendedDashboard, guardianAddMeeting, guardianListMeetings } from '../services/api'
import StatusCards from '../components/StatusCards'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

export default function GuardianDashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [extendedTotals, setExtendedTotals] = useState(null)
  const [viewStudent, setViewStudent] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [meetingSuccess, setMeetingSuccess] = useState('')
  const [edit, setEdit] = useState({
    id: '',
    roll_no: '',
    year: '',
    batch: '',
    enrollment_no: '',
    name: '',
    division: '',
    class: '',
    semester: '',
    mobile: '',
    parent_mobile: '',
    local_address: '',
    permanent_address: '',
    parent_occupation: '',
    scholarship_id: '',
    scholarship_status: '',
    exam_form_status: '',
    ebc_status: '',
    remark: ''
  })

  const load = async () => {
    const res = await guardianListStudents()
    setStudents(res.items || res || [])
    const ext = await fetchExtendedDashboard()
    setExtendedTotals(ext.totals || null)
    const m = await guardianListMeetings()
    setMeetings(m.items || [])
  }
  useEffect(() => { load() }, [])
  const totals = useMemo(() => ({
    total: students.length,
    pending: students.filter(s=>s.ebc_status==='Pending').length,
    approved: students.filter(s=>s.ebc_status==='Approved').length,
    rejected: students.filter(s=>s.ebc_status==='Rejected').length,
    rejected_with_query: students.filter(s=>s.ebc_status==='Rejected with Query').length
  }), [students])
  const donutData = useMemo(() => ({
    labels: [
      `Pending (${totals.pending})`,
      `Approved (${totals.approved})`,
      `Rejected (${totals.rejected})`,
      `Rejected with Query (${totals.rejected_with_query})`
    ],
    datasets: [{
      data: [totals.pending, totals.approved, totals.rejected, totals.rejected_with_query],
      backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6366f1']
    }]
  }), [totals])
  const statusColor = (v) => {
    const key = String(v || '').toLowerCase()
    if (key === 'approved') return '#10b981'
    if (key === 'pending') return '#f59e0b'
    if (key === 'rejected') return '#ef4444'
    if (key === 'rejected with query') return '#6366f1'
    return '#374151'
  }
  const inputStyle = { width: '100%', marginBottom: 10, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }
  const selectStyle = { ...inputStyle }
  const cardStyle = { border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, background: '#ffffff', boxShadow: '0 10px 20px rgba(0,0,0,0.06)' }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const f = new FormData(e.target)
    const payload = {
      roll_no: f.get('roll_no'),
      year: f.get('year'),
      batch: f.get('batch'),
      enrollment_no: f.get('enrollment_no'),
      name: f.get('name'),
      division: f.get('division'),
      class: f.get('class'),
      semester: f.get('semester'),
      mobile: f.get('mobile'),
      parent_mobile: f.get('parent_mobile'),
      local_address: f.get('local_address'),
      permanent_address: f.get('permanent_address'),
      parent_occupation: f.get('parent_occupation'),
      scholarship_id: f.get('scholarship_id'),
      scholarship_status: f.get('scholarship_status'),
      exam_form_status: f.get('exam_form_status')
    }
    try {
      await guardianAddStudent(payload)
      e.target.reset()
      setSuccess('Student added successfully')
      await load()
    } catch (err) {
      const v = err?.response?.data?.errors
      if (Array.isArray(v) && v.length) setError(v.map((x) => x.msg).join(', '))
      else setError(err?.response?.data?.message || 'Create failed')
    }
  }

  const onEdit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const id = edit.id
    const payload = {
      roll_no: edit.roll_no,
      year: edit.year,
      batch: edit.batch,
      enrollment_no: edit.enrollment_no,
      name: edit.name,
      division: edit.division,
      class: edit.class,
      semester: edit.semester,
      mobile: edit.mobile,
      parent_mobile: edit.parent_mobile,
      local_address: edit.local_address,
      permanent_address: edit.permanent_address,
      parent_occupation: edit.parent_occupation,
      scholarship_id: edit.scholarship_id,
      scholarship_status: edit.scholarship_status,
      exam_form_status: edit.exam_form_status,
      ebc_status: edit.ebc_status,
      remark: edit.remark
    }
    try {
      await guardianUpdateStudent(id, payload)
      setEdit({
        id: '',
        roll_no: '',
        year: '',
        batch: '',
        enrollment_no: '',
        name: '',
        division: '',
        class: '',
        semester: '',
        mobile: '',
        parent_mobile: '',
        local_address: '',
        permanent_address: '',
        parent_occupation: '',
        scholarship_id: '',
        scholarship_status: '',
        exam_form_status: '',
        ebc_status: '',
        remark: ''
      })
      setSuccess('Student updated successfully')
      await load()
    } catch (err) {
      const v = err?.response?.data?.errors
      if (Array.isArray(v) && v.length) setError(v.map((x) => x.msg).join(', '))
      else setError(err?.response?.data?.message || 'Update failed')
    }
  }
  const loadEdit = async (id) => {
    try {
      const s = await fetchStudentById(id)
      setEdit({
        id: String(s.id || ''),
        roll_no: s.roll_no || '',
        year: s.year || '',
        batch: s.batch || '',
        enrollment_no: s.enrollment_no || '',
        name: s.name || '',
        division: s.division || '',
        class: s.class || '',
        semester: s.semester || '',
        mobile: s.mobile || '',
        parent_mobile: s.parent_mobile || '',
        local_address: s.local_address || '',
        permanent_address: s.permanent_address || '',
        parent_occupation: s.parent_occupation || '',
        scholarship_id: s.scholarship_id || '',
        scholarship_status: s.scholarship_status || '',
        exam_form_status: s.exam_form_status || '',
        ebc_status: s.ebc_status || '',
        remark: s.remark || ''
      })
    } catch {}
  }
  const onAddMeeting = async (e) => {
    e.preventDefault()
    setMeetingSuccess('')
    const f = new FormData(e.target)
    const payload = {
      student_id: f.get('student_id'),
      meeting_date: f.get('meeting_date'),
      attendance: f.get('attendance'),
      ebc_notes: f.get('ebc_notes'),
      result_notes: f.get('result_notes'),
      personal_notes: f.get('personal_notes')
    }
    await guardianAddMeeting(payload)
    e.target.reset()
    setMeetingSuccess('Meeting saved')
    const m = await guardianListMeetings()
    setMeetings(m.items || [])
  }

  if (!(user?.role === 'GUARDIAN' || user?.role === 'ADMIN')) return <div>Forbidden</div>

  return (
    <div style={{ maxWidth: 1200, margin: '20px auto' }}>
      <h2 style={{ marginBottom: 10 }}>Guardian</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, alignItems: 'stretch', marginBottom: 16 }}>
        <StatusCards totals={totals} extendedTotals={extendedTotals} />
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>EBC Status</div>
          <Doughnut data={donutData} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Add Student</h3>
          <form onSubmit={onSubmit}>
            <label>Year</label>
            <select name="year" style={selectStyle}>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <label>Batch</label>
            <input name="batch" placeholder="2023-2027" style={inputStyle} />
            <label>Roll no</label>
            <input name="roll_no" required style={inputStyle} />
            <label>Enrollment No</label>
            <input name="enrollment_no" required style={inputStyle} />
            <label>Name</label>
            <input name="name" required style={inputStyle} />
            <label>Division</label>
            <input name="division" required style={inputStyle} />
            <label>Class</label>
            <input name="class" required style={inputStyle} />
            <label>Semester</label>
            <select name="semester" required style={selectStyle}>
              {['I','II','III','IV','V','VI'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label>Mobile no</label>
            <input name="mobile" required style={inputStyle} />
            <label>Parent Mobile no</label>
            <input name="parent_mobile" required style={inputStyle} />
            <label>Local address</label>
            <input name="local_address" required style={inputStyle} />
            <label>Permanent address</label>
            <input name="permanent_address" required style={inputStyle} />
            <label>Parent Occupation</label>
            <input name="parent_occupation" required style={inputStyle} />
            <label>Scholarship Id</label>
            <input name="scholarship_id" style={inputStyle} />
            <label>Scholarship Status</label>
            <select name="scholarship_status" style={selectStyle}>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Rejected with Query">Rejected with Query</option>
            </select>
            <label>Exam Form Status</label>
            <input name="exam_form_status" style={inputStyle} />
            <label>Remark</label>
            <input name="remark" style={inputStyle} />
            {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
            {success && <div style={{ color: '#10b981', marginTop: 8 }}>{success}</div>}
            <button type="submit" style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#6d28d9', color: '#fff' }}>Add</button>
          </form>
        </div>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Edit Student</h3>
          <form onSubmit={onEdit}>
            <input name="id" placeholder="Student ID" required style={inputStyle} value={edit.id} onChange={(e) => { setEdit({ ...edit, id: e.target.value }); if (e.target.value) loadEdit(e.target.value) }} />
            <label>Year</label>
            <select name="year" style={selectStyle} value={edit.year} onChange={(e) => setEdit({ ...edit, year: e.target.value })}>
              <option value="">Keep same</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <label>Batch</label>
            <input name="batch" placeholder="2023-2027" style={inputStyle} value={edit.batch} onChange={(e) => setEdit({ ...edit, batch: e.target.value })} />
            <input name="roll_no" placeholder="Roll No" style={inputStyle} value={edit.roll_no} onChange={(e) => setEdit({ ...edit, roll_no: e.target.value })} />
            <input name="enrollment_no" placeholder="Enrollment No" style={inputStyle} value={edit.enrollment_no} onChange={(e) => setEdit({ ...edit, enrollment_no: e.target.value })} />
            <input name="name" placeholder="Name" style={inputStyle} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <input name="division" placeholder="Division" style={inputStyle} value={edit.division} onChange={(e) => setEdit({ ...edit, division: e.target.value })} />
            <input name="class" placeholder="Class" style={inputStyle} value={edit.class} onChange={(e) => setEdit({ ...edit, class: e.target.value })} />
            <select name="semester" style={selectStyle} value={edit.semester} onChange={(e) => setEdit({ ...edit, semester: e.target.value })}>
              <option value="">Semester</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
              <option value="VI">VI</option>
            </select>
            <input name="mobile" placeholder="Mobile" style={inputStyle} value={edit.mobile} onChange={(e) => setEdit({ ...edit, mobile: e.target.value })} />
            <input name="parent_mobile" placeholder="Parent Mobile" style={inputStyle} value={edit.parent_mobile} onChange={(e) => setEdit({ ...edit, parent_mobile: e.target.value })} />
            <input name="local_address" placeholder="Local Address" style={inputStyle} value={edit.local_address} onChange={(e) => setEdit({ ...edit, local_address: e.target.value })} />
            <input name="permanent_address" placeholder="Permanent Address" style={inputStyle} value={edit.permanent_address} onChange={(e) => setEdit({ ...edit, permanent_address: e.target.value })} />
            <input name="parent_occupation" placeholder="Parent Occupation" style={inputStyle} value={edit.parent_occupation} onChange={(e) => setEdit({ ...edit, parent_occupation: e.target.value })} />
            <input name="scholarship_id" placeholder="Scholarship Id" style={inputStyle} value={edit.scholarship_id} onChange={(e) => setEdit({ ...edit, scholarship_id: e.target.value })} />
            <select name="scholarship_status" style={selectStyle} value={edit.scholarship_status} onChange={(e) => setEdit({ ...edit, scholarship_status: e.target.value })}>
              <option value="">Scholarship Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Rejected with Query">Rejected with Query</option>
            </select>
            <input name="exam_form_status" placeholder="Exam Form Status" style={inputStyle} value={edit.exam_form_status} onChange={(e) => setEdit({ ...edit, exam_form_status: e.target.value })} />
            <label>EBC Status</label>
            <select name="ebc_status" style={selectStyle} value={edit.ebc_status} onChange={(e) => setEdit({ ...edit, ebc_status: e.target.value })}>
              <option value="">Keep same</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Rejected with Query">Rejected with Query</option>
            </select>
            <input name="remark" placeholder="Remark" style={inputStyle} value={edit.remark} onChange={(e) => setEdit({ ...edit, remark: e.target.value })} />
            <button type="submit" style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#0ea5a4', color: '#fff' }}>Update</button>
          </form>
        </div>
        <div style={{ gridColumn: '1 / -1', ...cardStyle }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Students</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Roll</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Enrollment</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Year</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Batch</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Class</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Semester</th>
                <th style={{ textAlign: 'left', padding: 8 }}>EBC Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: 8 }}>{s.id}</td>
                  <td style={{ padding: 8 }}>{s.roll_no}</td>
                  <td style={{ padding: 8 }}>{s.enrollment_no}</td>
                  <td style={{ padding: 8 }}>{s.name}</td>
                  <td style={{ padding: 8 }}>{s.year || ''}</td>
                  <td style={{ padding: 8 }}>{s.batch || ''}</td>
                  <td style={{ padding: 8 }}>{s.class}</td>
                  <td style={{ padding: 8 }}>{s.semester}</td>
                  <td style={{ padding: 8, color: statusColor(s.ebc_status) }}>{s.ebc_status || '-'}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={async () => { const data = await fetchStudentById(s.id); setViewStudent(data) }} style={{ marginRight: 8 }}>View</button>
                    <button onClick={async () => { await guardianDeleteStudent(s.id); await load() }} style={{ color: '#ef4444' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ gridColumn: '1 / -1', ...cardStyle }}>
          <h3 style={{ marginTop: 0, marginBottom: 10 }}>Meetings</h3>
          <form onSubmit={onAddMeeting} style={{ marginBottom: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <input name="student_id" placeholder="Student ID" required style={inputStyle} />
              <input name="meeting_date" type="date" required style={inputStyle} />
              <select name="attendance" required style={selectStyle}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
            <input name="ebc_notes" placeholder="EBC discussion notes" style={inputStyle} />
            <input name="result_notes" placeholder="Result discussion notes" style={inputStyle} />
            <input name="personal_notes" placeholder="Personal problems notes" style={inputStyle} />
            {meetingSuccess && <div style={{ color: '#10b981', marginTop: 8 }}>{meetingSuccess}</div>}
            <button type="submit" style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff' }}>Save Meeting</button>
          </form>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Date</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Student</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Attendance</th>
                <th style={{ textAlign: 'left', padding: 8 }}>EBC</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Result</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Personal</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((m) => (
                <tr key={m.id}>
                  <td style={{ padding: 8 }}>{m.meeting_date ? String(m.meeting_date).slice(0, 10) : ''}</td>
                  <td style={{ padding: 8 }}>{m.student_name || m.student_id}</td>
                  <td style={{ padding: 8 }}>{m.attendance}</td>
                  <td style={{ padding: 8 }}>{m.ebc_notes || '-'}</td>
                  <td style={{ padding: 8 }}>{m.result_notes || '-'}</td>
                  <td style={{ padding: 8 }}>{m.personal_notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {viewStudent && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, width: 720, maxWidth: '95%' }}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Student Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 14 }}>
                <span>ID</span><span>{viewStudent.id}</span>
                <span>Name</span><span>{viewStudent.name || ''}</span>
                <span>Roll</span><span>{viewStudent.roll_no || ''}</span>
                <span>Enrollment</span><span>{viewStudent.enrollment_no || ''}</span>
                <span>Year</span><span>{viewStudent.year || ''}</span>
                <span>Batch</span><span>{viewStudent.batch || ''}</span>
                <span>Division</span><span>{viewStudent.division || ''}</span>
                <span>Branch</span><span>{viewStudent.branch_name || ''}</span>
                <span>Class</span><span>{viewStudent.class || ''}</span>
                <span>Semester</span><span>{viewStudent.semester || ''}</span>
                <span>Mobile</span><span>{viewStudent.mobile || ''}</span>
                <span>Parent Mobile</span><span>{viewStudent.parent_mobile || ''}</span>
                <span>Local Address</span><span>{viewStudent.local_address || ''}</span>
                <span>Permanent Address</span><span>{viewStudent.permanent_address || ''}</span>
                <span>Parent Occupation</span><span>{viewStudent.parent_occupation || ''}</span>
                <span>Scholarship Id</span><span>{viewStudent.scholarship_id || ''}</span>
                <span>Scholarship Status</span><span>{viewStudent.scholarship_status || ''}</span>
                <span>Exam Form Status</span><span>{viewStudent.exam_form_status || ''}</span>
                <span>EBC Status</span><span>{viewStudent.ebc_status || ''}</span>
                <span>Remark</span><span>{viewStudent.remark || ''}</span>
                <span>Created By</span><span>{viewStudent.guardian_name || viewStudent.admin_name || ''}</span>
                <span>Created At</span><span>{viewStudent.created_at ? new Date(viewStudent.created_at).toLocaleString() : ''}</span>
              </div>
              <div style={{ textAlign: 'right', marginTop: 12 }}>
                <button onClick={() => setViewStudent(null)} style={{ padding: '8px 12px' }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
