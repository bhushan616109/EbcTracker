import React, { useMemo, useState } from 'react'

export default function StudentsTable({ items, page, limit, total, onPage, canWrite, onDelete }) {
  const [expandedId, setExpandedId] = useState(null)
  const pages = useMemo(() => Math.ceil((total || 0) / (limit || 10)), [total, limit])
  const statusColor = (v) => {
    const key = String(v || '').toLowerCase()
    if (key === 'approved') return '#10b981'
    if (key === 'pending') return '#f59e0b'
    if (key === 'rejected') return '#ef4444'
    if (key === 'rejected with query') return '#6366f1'
    return '#374151'
  }
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Branch</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Admin</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Class</th>
            <th style={{ textAlign: 'left', padding: 8 }}>EBC Status</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Remark</th>
            {canWrite && <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {(items || []).map((s) => (
            <>
              <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{s.id}</td>
                <td style={{ padding: 8 }}>{s.name}</td>
                <td style={{ padding: 8 }}>{s.branch_name}</td>
                <td style={{ padding: 8 }}>{s.admin_name}</td>
                <td style={{ padding: 8 }}>{s.class}</td>
                <td style={{ padding: 8, color: statusColor(s.ebc_status) }}>{s.ebc_status}</td>
                <td style={{ padding: 8 }}>{s.remark || '-'}</td>
                {canWrite && (
                  <td style={{ padding: 8 }}>
                    <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} style={{ marginRight: 8 }}>
                      {expandedId === s.id ? 'Hide' : 'View'}
                    </button>
                    <button onClick={() => onDelete(s.id)} style={{ color: '#ef4444' }}>Delete</button>
                  </td>
                )}
              </tr>
              {expandedId === s.id && (
                <tr>
                  <td colSpan={canWrite ? 8 : 7} style={{ background: '#f9fafb', padding: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                      <span>Roll No</span><span>{s.roll_no || ''}</span>
                      <span>Enrollment No</span><span>{s.enrollment_no || ''}</span>
                      <span>Semester</span><span>{s.semester || ''}</span>
                      <span>Mobile</span><span>{s.mobile || ''}</span>
                      <span>Parent Mobile</span><span>{s.parent_mobile || ''}</span>
                      <span>Local Address</span><span>{s.local_address || ''}</span>
                      <span>Permanent Address</span><span>{s.permanent_address || ''}</span>
                      <span>Parent Occupation</span><span>{s.parent_occupation || ''}</span>
                      <span>Scholarship Id</span><span>{s.scholarship_id || ''}</span>
                      <span>Scholarship Password</span><span>{s.scholarship_password || ''}</span>
                      <span>Exam Form Status</span><span>{s.exam_form_status || ''}</span>
                      <span>Created At</span><span>{s.created_at ? new Date(s.created_at).toLocaleString() : ''}</span>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {!items?.length && (
            <tr><td style={{ padding: 12 }} colSpan="6">No students</td></tr>
          )}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8 }}>
        <span>Page {page} of {pages || 1}</span>
        <div>
          <button disabled={page <= 1} onClick={() => onPage(page - 1)}>Prev</button>
          <button disabled={page >= pages} onClick={() => onPage(page + 1)} style={{ marginLeft: 8 }}>Next</button>
        </div>
      </div>
    </div>
  )
}
