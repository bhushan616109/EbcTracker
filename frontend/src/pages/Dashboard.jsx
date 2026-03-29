import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchDashboard, fetchExtendedDashboard, fetchStudents, createStudent, updateStatus, fetchBranches, deleteStudent, fetchMeetings } from '../services/api'
import StatusCards from '../components/StatusCards'
import StatusChart from '../components/StatusChart'
import BreakdownChart from '../components/BreakdownChart'
import StudentsTable from '../components/StudentsTable'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totals, setTotals] = useState({})
  const [extendedTotals, setExtendedTotals] = useState(null)
  const [breakdown, setBreakdown] = useState([])
  const [students, setStudents] = useState({ items: [], page: 1, limit: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [branchFilter, setBranchFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')

  const canWrite = user?.role === 'ADMIN'
  const showBranchFilter = user?.role === 'DEAN' || user?.role === 'PRINCIPAL'
  const showAdminBreakdown = user?.role === 'HOD'
  const [error, setError] = useState('')
  const [branches, setBranches] = useState([])
  const [semesterSel, setSemesterSel] = useState('I')
  const [exporting, setExporting] = useState(false)
  const [meetings, setMeetings] = useState([])

  const load = async (page = 1) => {
    setLoading(true)
    try {
      const dash = await fetchDashboard(showBranchFilter && branchFilter ? Number(branchFilter) : undefined)
      setTotals(dash.totals)
      setBreakdown(dash.breakdown)
      if (user?.role === 'HOD' || user?.role === 'DEAN' || user?.role === 'PRINCIPAL') {
        const ext = await fetchExtendedDashboard(showBranchFilter && branchFilter ? Number(branchFilter) : undefined)
        setExtendedTotals(ext.totals)
      } else {
        setExtendedTotals(null)
      }
      const stu = await fetchStudents({ 
        status: filters.status || undefined, 
        search: filters.search || undefined, 
        page, 
        limit: students.limit,
        branch_id: showBranchFilter && branchFilter ? Number(branchFilter) : undefined,
        year: user?.role === 'PRINCIPAL' && yearFilter ? yearFilter : undefined,
        batch: user?.role === 'PRINCIPAL' && batchFilter ? batchFilter : undefined
      })
      setStudents(stu)
      if (user?.role === 'PRINCIPAL') {
        const m = await fetchMeetings({ branch_id: showBranchFilter && branchFilter ? Number(branchFilter) : undefined })
        setMeetings(m.items || m || [])
      } else {
        setMeetings([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, []) // initial
  useEffect(() => { load(1) }, [filters, branchFilter, yearFilter, batchFilter]) // reload on filter change
  useEffect(() => {
    const init = async () => {
      const list = await fetchBranches()
      setBranches(showBranchFilter ? [{ id: '', branch_name: 'All' }, ...list] : list)
    }
    init()
  }, [showBranchFilter])

  const onCreate = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.target)
    const payload = {
      name: form.get('name'),
      roll_no: form.get('roll_no'),
      branch_id: Number(user?.branch_id),
      year: form.get('year'),
      batch: form.get('batch'),
      enrollment_no: form.get('enrollment_no'),
      class: form.get('class'),
      semester: form.get('semester'),
      mobile: form.get('mobile'),
      parent_mobile: form.get('parent_mobile'),
      local_address: form.get('local_address'),
      permanent_address: form.get('permanent_address'),
      parent_occupation: form.get('parent_occupation'),
      scholarship_id: form.get('scholarship_id'),
      scholarship_password: form.get('scholarship_password'),
      scholarship_status: form.get('scholarship_status'),
      exam_form_status: form.get('exam_form_status'),
      prev_results: (() => {
        const map = {}
        const roman = ['I','II','III','IV','V','VI']
        const idx = roman.indexOf(form.get('semester')) + 1
        for (let i = 1; i < idx; i++) {
          const v = form.get(`prev_${i}`)
          if (v && String(v).trim().length) map[String(i)] = Number(v)
        }
        return map
      })()
    }
    try {
      await createStudent(payload)
      e.target.reset()
      await load(students.page)
    } catch (err) {
      const v = err?.response?.data?.errors
      if (Array.isArray(v) && v.length) setError(v.map((x) => x.msg).join(', '))
      else setError(err?.response?.data?.message || 'Create failed')
    }
  }

  const toCsv = (rows) => {
    const cols = ['ID','Roll No','Name','Branch','Class','Semester','EBC Status','Scholarship Status','Created At']
    const header = cols.join(',')
    const data = rows.map((r) => [
      r.id,
      `"${r.roll_no || ''}"`,
      `"${(r.name || '').replace(/"/g,'""')}"`,
      `"${r.branch_name || ''}"`,
      `"${r.class || ''}"`,
      `"${r.semester || ''}"`,
      `"${r.ebc_status || ''}"`,
      `"${r.scholarship_status || ''}"`,
      `"${new Date(r.created_at).toISOString()}"`
    ].join(','))
    return [header, ...data].join('\r\n')
  }
  const onExportExcel = async () => {
    setExporting(true)
    try {
      const filtersReq = { status: filters.status || undefined, search: filters.search || undefined }
      const first = await fetchStudents({ ...filtersReq, page: 1, limit: 100 })
      const pages = Math.ceil((first.total || 0) / (first.limit || 100)) || 1
      let rows = first.items || []
      for (let p = 2; p <= pages; p++) {
        const next = await fetchStudents({ ...filtersReq, page: p, limit: first.limit })
        rows = rows.concat(next.items || [])
      }
      const csv = toCsv(rows)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students.csv'
      document.body.appendChild(a)
      setTimeout(() => a.click(), 0)
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }
  const onExportPdf = async () => {
    setExporting(true)
    try {
      const win = window.open('', '_blank')
      const filtersReq = { status: filters.status || undefined, search: filters.search || undefined }
      const first = await fetchStudents({ ...filtersReq, page: 1, limit: 100 })
      const pages = Math.ceil((first.total || 0) / (first.limit || 100)) || 1
      let rows = first.items || []
      for (let p = 2; p <= pages; p++) {
        const next = await fetchStudents({ ...filtersReq, page: p, limit: first.limit })
        rows = rows.concat(next.items || [])
      }
      if (!win) {
        const htmlBlob = new Blob([''], { type: 'text/html' })
        const url = URL.createObjectURL(htmlBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'students.pdf'
        document.body.appendChild(a)
        setTimeout(() => a.click(), 0)
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        return
      }
      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Students</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h2 { margin: 0 0 12px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Students</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Roll No</th><th>Name</th><th>Branch</th><th>Class</th><th>Semester</th><th>EBC Status</th><th>Scholarship Status</th><th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>${r.id}</td>
                  <td>${r.roll_no || ''}</td>
                  <td>${r.name || ''}</td>
                  <td>${r.branch_name || ''}</td>
                  <td>${r.class || ''}</td>
                  <td>${r.semester || ''}</td>
                  <td>${r.ebc_status || ''}</td>
                  <td>${r.scholarship_status || ''}</td>
                  <td>${new Date(r.created_at).toLocaleString()}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
        </html>
      `
      win.document.write(html)
      win.document.close()
    } finally {
      setExporting(false)
    }
  }

  const onUpdateStatus = async (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    const id = form.get('id')
    const ebc_status = form.get('ebc_status')
    const remark = form.get('remark')
    await updateStatus(id, { ebc_status, remark })
    e.target.reset()
    await load(students.page)
  }
  const onDelete = async (id) => {
    setError('')
    try {
      await deleteStudent(id)
      await load(students.page)
    } catch (err) {
      setError(err?.response?.data?.message || 'Delete failed')
    }
  }
  // edit feature removed

  const branchOptions = useMemo(() => branches.map((b) => ({ id: b.id, name: b.branch_name })), [branches])

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>Dashboard</h2>
        {showBranchFilter && (
          <div style={{ marginTop: 8 }}>
            <label>Branch</label>{' '}
            <select value={branchFilter} onChange={(e) => {
              setBranchFilter(e.target.value)
              setYearFilter('')
              setBatchFilter('')
            }}>
              <option value="">All Branches</option>
              {branchOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}
        {user?.role === 'PRINCIPAL' && branchFilter && (
          <div style={{ marginTop: 8 }}>
            <label>Year</label>{' '}
            <select value={yearFilter} onChange={(e) => {
              setYearFilter(e.target.value)
              setBatchFilter('')
            }}>
              <option value="">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
        )}
        {user?.role === 'PRINCIPAL' && branchFilter && yearFilter && (
          <div style={{ marginTop: 8 }}>
            <label>Batch</label>{' '}
            <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
              <option value="">All Batches</option>
              <option value="2023-2027">2023-2027</option>
              <option value="2022-2026">2022-2026</option>
              <option value="2021-2025">2021-2025</option>
              <option value="2020-2024">2020-2024</option>
            </select>
          </div>
        )}
        {user?.role === 'HOD' && (
          <div style={{ marginTop: 8 }}>
            <Link to="/hod/guardians">Manage Guardians</Link>
          </div>
        )}
      </div>
      <StatusCards totals={totals} extendedTotals={extendedTotals} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <StatusChart totals={totals} />
        <BreakdownChart breakdown={breakdown} />
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <input placeholder="Search name or roll" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Rejected with Query">Rejected with Query</option>
        </select>
      </div>
      <div style={{ marginTop: 12 }}>
        <StudentsTable
          items={students.items}
          page={students.page}
          limit={students.limit}
          total={students.total}
          onPage={(p) => load(p)}
          canWrite={canWrite}
          onDelete={onDelete}
        />
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button onClick={onExportExcel} disabled={exporting}>Export Excel</button>
          <button onClick={onExportPdf} disabled={exporting}>Export PDF</button>
        </div>
      </div>
      {user?.role === 'PRINCIPAL' && (
        <div style={{ marginTop: 16 }}>
          <h3>Meetings</h3>
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
      )}
      {canWrite && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
          <form onSubmit={onCreate} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#f9fafb' }}>
            <h3>Create Student</h3>
            <label>Branch</label>
            <select style={{ width: '100%', marginBottom: 8 }} value={user?.branch_id} disabled>
              {branches.filter((b) => b.id === user?.branch_id).map((b) => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              {!branches.length && <option value={user?.branch_id}>{user?.branch_id}</option>}
            </select>
            <label>Year</label>
            <select name="year" style={{ width: '100%', marginBottom: 8 }}>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <input name="batch" placeholder="Batch (e.g. 2023-2027)" style={{ width: '100%', marginBottom: 8 }} />
            <input name="name" placeholder="Name" required style={{ width: '100%', marginBottom: 8 }} />
            <input name="roll_no" placeholder="Roll No" required style={{ width: '100%', marginBottom: 8 }} />
            <input name="enrollment_no" placeholder="Enrollment No" style={{ width: '100%', marginBottom: 8 }} />
            <label>Class</label>
            <select name="class" style={{ width: '100%', marginBottom: 8 }}>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
              <option value="Fourth Year">Fourth Year</option>
            </select>
            <label>Semester</label>
            <select name="semester" required style={{ width: '100%', marginBottom: 8 }} value={semesterSel} onChange={(e) => setSemesterSel(e.target.value)}>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
              <option value="V">V</option>
              <option value="VI">VI</option>
            </select>
            <input name="mobile" placeholder="Mobile No" style={{ width: '100%', marginBottom: 8 }} />
            <input name="parent_mobile" placeholder="Parent Mobile No" style={{ width: '100%', marginBottom: 8 }} />
            <input name="local_address" placeholder="Local Address" style={{ width: '100%', marginBottom: 8 }} />
            <input name="permanent_address" placeholder="Permanent Address" style={{ width: '100%', marginBottom: 8 }} />
            <input name="parent_occupation" placeholder="Parent Occupation" style={{ width: '100%', marginBottom: 8 }} />
            <input name="scholarship_id" placeholder="Scholarship Id" style={{ width: '100%', marginBottom: 8 }} />
            <input name="scholarship_password" placeholder="Scholarship Password" style={{ width: '100%', marginBottom: 8 }} />
            <label>Scholarship Status</label>
            <select name="scholarship_status" style={{ width: '100%', marginBottom: 8 }} defaultValue="Pending">
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Rejected with Query">Rejected with Query</option>
            </select>
            <input name="exam_form_status" placeholder="Exam Form Status" style={{ width: '100%', marginBottom: 8 }} />
            {['I','II','III','IV','V','VI'].indexOf(semesterSel) > 0 && (
              <div style={{ marginBottom: 8 }}>
                {[...Array(['I','II','III','IV','V','VI'].indexOf(semesterSel)).keys()].map((i) => (
                  <input key={i} name={`prev_${i+1}`} placeholder={`Result Sem ${i+1} (%)`} style={{ width: '100%', marginBottom: 6 }} />
                ))}
              </div>
            )}
            <button type="submit">Create</button>
          </form>
          <form onSubmit={onUpdateStatus} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, background: '#f9fafb' }}>
            <h3>Update EBC Status</h3>
            <input name="id" placeholder="Student ID" required style={{ width: '100%', marginBottom: 8 }} />
            <select name="ebc_status" required style={{ width: '100%', marginBottom: 8 }}>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Rejected with Query">Rejected with Query</option>
            </select>
            <input name="remark" placeholder="Remark (for query)" style={{ width: '100%', marginBottom: 8 }} />
            <button type="submit">Update</button>
          </form>
          {/* Edit Student form removed */}
        </div>
      )}
      {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
      {loading && <div style={{ marginTop: 8 }}>Loading...</div>}
    </div>
  )
}
