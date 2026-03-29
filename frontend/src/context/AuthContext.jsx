import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common.Authorization
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const res = await axios.post('/auth/login', { identifier: email, password })
      setToken(res.data.token)
      setUser(res.data.user)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    } catch (err) {
      try {
        const res2 = await axios.post('/auth/login-guardian', { username: email, password })
        setToken(res2.data.token)
        setUser(res2.data.user)
        localStorage.setItem('token', res2.data.token)
        localStorage.setItem('user', JSON.stringify(res2.data.user))
      } catch (e2) {
        throw err
      }
    }
  }

  const loginGuardian = async (username, password) => {
    const res = await axios.post('/auth/login-guardian', { username, password })
    setToken(res.data.token)
    setUser(res.data.user)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }
  // unified login via /auth/login supports email or username

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ token, user, login, loginGuardian, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
