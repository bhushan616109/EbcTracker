import React, { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { guardianAddStudent, guardianListStudents, fetchExtendedDashboard } from '../services/api'
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

  const load = async () => {
    const res = await guardianListStudents()
    setStudents(res.items || [])
    const ext = await fetchExtendedDashboard()
    setExtendedTotals(ext.totals || null)
  }
  useEffect(() => { load() }, [])
  const totals = useMemo(() => ({
    total: students.length,
    pending: students.filter(s=>s.scholarship_status==='Pending').length,
    approved: students.filter(s=>s.scholarship_status==='Approved').length,
    rejected: students.filter(s=>s.scholarship_status==='Rejected').length,
    rejected_with_query: students.filter(s=>s.scholarship_status==='Rejected with Query').length
  }), [students])
  const donutData = useMemo(() => ({
    labels: ['Pending', 'Approved', 'Rejected', 'Rejected with Query'],
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

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const f = new FormData(e.target)
    const payload = {
      roll_no: f.get('roll_no'),
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

  if (user?.role !== 'GUARDIAN') return <div>Forbidden</div>

  return (
    <div>
      <h2>Guardian</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, alignItems: 'stretch', marginBottom: 12 }}>
        <StatusCards totals={totals} />
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Scholarship Status</div>
          <Doughnut data={donutData} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#f9fafb' }}>
          <h3>Add Student</h3>
          <form onSubmit={onSubmit}>
            <label>Roll no</label>
            <input name="roll_no" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Enrollment No</label>
            <input name="enrollment_no" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Name</label>
            <input name="name" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Division</label>
            <input name="division" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Class</label>
            <input name="class" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Semester</label>
            <select name="semester" required style={{ width: '100%', marginBottom: 8 }}>
              {['I','II','III','IV','V','VI'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label>Mobile no</label>
            <input name="mobile" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Parent Mobile no</label>
            <input name="parent_mobile" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Local address</label>
            <input name="local_address" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Permanent address</label>
            <input name="permanent_address" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Parent Occupation</label>
            <input name="parent_occupation" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Scholarship Id</label>
            <input name="scholarship_id" style={{ width: '100%', marginBottom: 8 }} />
            <label>Scholarship Status</label>
            <select name="scholarship_status" style={{ width: '100%', marginBottom: 8 }}>
              <option value="Approved">Approved</option>
              <option value="Not Approved">Not Approved</option>
            </select>
            <label>Exam Form Status</label>
            <input name="exam_form_status" style={{ width: '100%', marginBottom: 8 }} />
            {error && <div style={{ color: 'red', marginTop: 6 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginTop: 6 }}>{success}</div>}
            <button type="submit">Add</button>
          </form>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3>Students</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Roll</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Enrollment</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Class</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Semester</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Scholarship Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ padding: 8 }}>{s.roll_no}</td>
                  <td style={{ padding: 8 }}>{s.enrollment_no}</td>
                  <td style={{ padding: 8 }}>{s.name}</td>
                  <td style={{ padding: 8 }}>{s.class}</td>
                  <td style={{ padding: 8 }}>{s.semester}</td>
                  <td style={{ padding: 8, color: statusColor(s.scholarship_status) }}>{s.scholarship_status || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
     </div>
  )
}
