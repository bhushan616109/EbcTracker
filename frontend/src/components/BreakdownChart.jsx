import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(ArcElement, Tooltip, Legend)

export default function BreakdownChart({ breakdown }) {
  const labels = breakdown.map((b) => {
    const name = b.type === 'branch' ? b.branch_name : b.admin_name
    return `${name} (${b.total || 0})`
  })
  const totals = breakdown.map((b) => b.total)
  const data = {
    labels,
    datasets: [{ data: totals, backgroundColor: ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#f87171', '#22d3ee'] }]
  }
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
      <Doughnut data={data} />
    </div>
  )
}
