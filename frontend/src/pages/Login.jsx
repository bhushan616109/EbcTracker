import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loginGuardian } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const selectRole = (r) => {
    setRole(r)
    setMode(r === 'GUARDIAN' ? 'guardian' : 'user')
    const sample = {
      PRINCIPAL: 'principal@example.com',
      DEAN: 'dean@example.com',
      HOD: 'hod.cse@example.com',
      GUARDIAN: 'guardian.cse1'
    }
    setEmail(sample[r] || '')
    setPassword('Password123!')
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Login</h2>
      {!mode && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center', marginTop: 24 }}>
          <div style={{ textAlign: 'center', padding: 16 }}>
            <img src="/branding/sanjeevan.png" alt="Sanjeevan Polytechnic" width="320" height="auto" style={{ maxWidth: '100%', display: 'inline-block', borderRadius: 8, boxShadow: '0 6px 12px rgba(0,0,0,0.12)' }} />
            <p style={{ color: '#374151', fontWeight: 600, marginTop: 8 }}>College Platform</p>
            <p style={{ color: '#6b7280', marginTop: 2 }}>Manage guardians, students and EBC statuses</p>
          </div>
          <div style={{ paddingRight: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              <button onClick={() => selectRole('PRINCIPAL')} style={{ padding: 16, borderRadius: 10, border: 'none', background: '#6d28d9', color: '#fff', boxShadow: '0 6px 12px rgba(109,40,217,0.25)' }}>Principal</button>
              <button onClick={() => selectRole('DEAN')} style={{ padding: 16, borderRadius: 10, border: 'none', background: '#0ea5a4', color: '#fff', boxShadow: '0 6px 12px rgba(14,165,164,0.25)' }}>Dean</button>
              <button onClick={() => selectRole('HOD')} style={{ padding: 16, borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', boxShadow: '0 6px 12px rgba(37,99,235,0.25)' }}>HOD</button>
              <button onClick={() => selectRole('GUARDIAN')} style={{ padding: 16, borderRadius: 10, border: 'none', background: '#0ea5a4', color: '#fff', boxShadow: '0 6px 12px rgba(14,165,164,0.25)' }}>Guardian</button>
            </div>
            <p style={{ marginTop: 12, color: '#1f2937', textAlign: 'center', fontWeight: 600, fontSize: 16 }}>Choose your role to continue</p>
          </div>
        </div>
      )}
      {mode && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginTop: 24, background: '#ffffff', boxShadow: '0 10px 20px rgba(0,0,0,0.06)', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          <div style={{ marginBottom: 12 }}>
            <strong>{role}</strong>
            <button
              type="button"
              onClick={() => { setMode(null); setRole(null); setEmail(''); setPassword('') }}
              style={{ float: 'right', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 10px' }}
            >
              Change
            </button>
          </div>
          <form onSubmit={onSubmit}>
            <label>Email or Username</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="text" required style={{ width: '100%', marginBottom: 8 }} />
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required style={{ width: '100%', marginBottom: 12 }} />
            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#6d28d9', color: '#fff' }}>{loading ? 'Logging in...' : 'Login'}</button>
            <p style={{ marginTop: 8, color: '#6b7280' }}>
              Samples: principal@example.com, dean@example.com, hod.cse@example.com, admin.a.cse@example.com
            </p>
          </form>
        </div>
      )}
    </div>
  )
}
