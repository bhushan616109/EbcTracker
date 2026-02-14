import React, { useMemo } from 'react'

export default function StudentsTable({ items, page, limit, total, onPage, canWrite, onEdit, onDelete }) {
  const pages = useMemo(() => Math.ceil((total || 0) / (limit || 10)), [total, limit])
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f8fafc' }}>
          <tr>
            <th style={{ textAlign: 'left', padding: 8 }}>ID</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Roll No</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Branch</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Admin</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Remark</th>
            {canWrite && <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {(items || []).map((s) => (
            <tr key={s.id} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{s.id}</td>
              <td style={{ padding: 8 }}>{s.name}</td>
              <td style={{ padding: 8 }}>{s.roll_no}</td>
              <td style={{ padding: 8 }}>{s.branch_name}</td>
              <td style={{ padding: 8 }}>{s.admin_name}</td>
              <td style={{ padding: 8 }}>{s.ebc_status}</td>
              <td style={{ padding: 8 }}>{s.remark || '-'}</td>
              {canWrite && (
                <td style={{ padding: 8 }}>
                  <button onClick={() => onEdit(s)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => onDelete(s.id)} style={{ color: '#ef4444' }}>Delete</button>
                </td>
              )}
            </tr>
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
