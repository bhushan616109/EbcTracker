import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createGuardian, listGuardians } from '../services/api'
import axios from 'axios'

export default function HODGuardians() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [error, setError] = useState('')
  const [view, setView] = useState(null)
  const [viewError, setViewError] = useState('')

  const load = async () => {
    const data = await listGuardians()
    setList(data)
  }
  useEffect(() => { load() }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData(e.target)
    const payload = {
      name: form.get('name'),
      username: form.get('username'),
      password: form.get('password'),
      division: form.get('division'),
      batch_from: Number(form.get('batch_from')),
      batch_to: Number(form.get('batch_to'))
    }
    try {
      await createGuardian(payload)
      e.target.reset()
      await load()
    } catch (err) {
      const v = err?.response?.data?.errors
      if (Array.isArray(v) && v.length) setError(v.map((x) => x.msg).join(', '))
      else setError(err?.response?.data?.message || 'Create failed')
    }
  }

  if (user?.role !== 'HOD') return <div>Forbidden</div>

  return (
    <div>
      <h2>Guardians</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3>Add Guardian</h3>
          <form onSubmit={onSubmit}>
            <input name="name" placeholder="Name of faculty" required style={{ width: '100%', marginBottom: 8 }} />
            <input name="username" placeholder="Username" required style={{ width: '100%', marginBottom: 8 }} />
            <input name="password" placeholder="Password" type="password" required style={{ width: '100%', marginBottom: 8 }} />
            <input name="division" placeholder="Division" required style={{ width: '100%', marginBottom: 8 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input name="batch_from" placeholder="Batch From" type="number" required style={{ width: '50%' }} />
              <input name="batch_to" placeholder="Batch To" type="number" required style={{ width: '50%' }} />
            </div>
            {error && <div style={{ color: 'red', marginTop: 6 }}>{error}</div>}
            <button type="submit" style={{ marginTop: 8 }}>Add</button>
          </form>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
          <h3>Guardian List</h3>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Username</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Division</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Batch</th>
                <th style={{ textAlign: 'left', padding: 8 }}>View</th>
              </tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id}>
                  <td style={{ padding: 8 }}>{g.name}</td>
                  <td style={{ padding: 8 }}>{g.username}</td>
                  <td style={{ padding: 8 }}>{g.division}</td>
                  <td style={{ padding: 8 }}>{g.batch_from} - {g.batch_to}</td>
                  <td style={{ padding: 8 }}>
                    <button onClick={async () => {
                      try {
                        setViewError('')
                        const { data } = await axios.get(`/guardians/${g.id}/students`)
                        setView(data)
                      } catch (err) {
                        setView(null)
                        setViewError(err?.response?.data?.message || 'Failed to load guardian batch')
                      }
                    }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {viewError && <div style={{ color: 'red', marginTop: 8 }}>{viewError}</div>}
          {view && (
            <div style={{ marginTop: 16 }}>
              <h4>Guardian Batch: {view.guardian.name} ({view.guardian.division}) {view.guardian.batch_from}-{view.guardian.batch_to}</h4>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8 }}>Roll</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Class</th>
                    <th style={{ textAlign: 'left', padding: 8 }}>Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {view.items.map((s) => (
                    <tr key={s.id}>
                      <td style={{ padding: 8 }}>{s.roll_no}</td>
                      <td style={{ padding: 8 }}>{s.name}</td>
                      <td style={{ padding: 8 }}>{s.class}</td>
                      <td style={{ padding: 8 }}>{s.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
