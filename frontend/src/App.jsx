import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import HODGuardians from './pages/HODGuardians'
import GuardianDashboard from './pages/GuardianDashboard'
import { useAuth } from './context/AuthContext'

function PrivateRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, logout } = useAuth()
  return (
    <div style={{ fontFamily: 'system-ui', minHeight: '100vh' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'linear-gradient(90deg,#4f46e5,#6d28d9)', color: '#fff', boxShadow: '0 4px 10px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={import.meta.env.VITE_LOGO_URL || '/branding/sanjeevan.png'} alt="Sanjeevan Polytechnic" style={{ height: 36, width: 'auto', borderRadius: 6, boxShadow: '0 4px 10px rgba(0,0,0,0.15)', background: '#fff' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <Link to="/" style={{ textDecoration: 'none', fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>College Guardian</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user && (
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: 999 }}>
              {user.name} ({user.role === 'ADMIN' ? 'Guardian' : user.role})
            </span>
          )}
          {user ? (
            <>
              <button onClick={logout} style={{ background: '#0ea5a4', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 999, boxShadow: '0 2px 6px rgba(14,165,164,0.3)' }}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none', background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: 999 }}>Login</Link>
          )}
        </div>
      </header>
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                {user?.role === 'GUARDIAN' || user?.role === 'ADMIN' ? <GuardianDashboard /> : <Dashboard />}
              </PrivateRoute>
            }
          />
          <Route
            path="/hod/guardians"
            element={
              <PrivateRoute>
                <HODGuardians />
              </PrivateRoute>
            }
          />
          
        </Routes>
      </main>
    </div>
  )
}
