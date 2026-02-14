import React from 'react'

export default function StatusCards({ totals, extendedTotals }) {
  const items = [
    { label: 'Total Students', value: totals?.total || 0 },
    { label: 'Pending', value: totals?.pending || 0 },
    { label: 'Approved', value: totals?.approved || 0 },
    { label: 'Rejected', value: totals?.rejected || 0 },
    { label: 'Rejected with Query', value: totals?.rejected_with_query || 0 }
  ]
  const ext = extendedTotals
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      {items.map((it) => (
        <div key={it.label} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 12, color: '#666' }}>{it.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{it.value}</div>
        </div>
      ))}
      {ext && (
        <>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Guardians</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{ext.guardians || 0}</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Batches</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{ext.batches || 0}</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Scholarship Approved</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{ext.scholarship_approved || 0}</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Scholarship Not Approved</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{ext.scholarship_not_approved || 0}</div>
          </div>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Weak Students</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{ext.weak_students || 0}</div>
          </div>
        </>
      )}
    </div>
  )
}
