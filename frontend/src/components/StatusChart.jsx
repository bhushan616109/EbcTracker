import React from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function StatusChart({ totals }) {
  const data = {
    labels: ['Pending', 'Approved', 'Rejected', 'Rejected with Query'],
    datasets: [
      {
        label: 'Count',
        data: [
          totals?.pending || 0,
          totals?.approved || 0,
          totals?.rejected || 0,
          totals?.rejected_with_query || 0
        ],
        backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6366f1']
      }
    ]
  }
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <Bar data={data} />
    </div>
  )
}
