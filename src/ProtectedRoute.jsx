import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { getSessionUser, clearSessionUser } from './auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function ProtectedRoute({ children, role }) {
  const user = getSessionUser()
  const [valid, setValid] = useState(null) // null = checking, true = ok, false = invalid

  useEffect(() => {
    if (!user) { setValid(false); return }

    // Admin credentials are not in DB — skip DB check
    if (user.role === 'admin') { setValid(true); return }

    // Verify user still exists in DB
    axios.get(`${API_BASE_URL}/api/user/all`)
      .then(res => {
        const exists = (res.data.data || []).some(
          u => u.email.toLowerCase() === user.email.toLowerCase()
        )
        if (!exists) {
          clearSessionUser()
          setValid(false)
        } else {
          setValid(true)
        }
      })
      .catch(() => setValid(true)) // allow access if DB unreachable
  }, [])

  if (valid === null) return null // still checking

  if (!valid) return <Navigate to="/login" replace />

  if (role && user?.role !== role)
    return <Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />

  return children
}
