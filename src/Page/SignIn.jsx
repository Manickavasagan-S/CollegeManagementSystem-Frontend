import React, { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import axios from 'axios'
import Logo from '../assets/Logo.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export default function SignIn() {
  const [firstname, setFirstname] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 5000)
      return () => clearTimeout(t)
    }
  }, [error])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!firstname.trim() || !lastname.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE_URL}/api/user/signup`, {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        password,
      })
      if (res.status === 201 || res.status === 200) {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      if (err.response?.status === 400) setError(err.response.data?.message || 'Email already exists.')
      else if (err.response?.status === 500) setError('Server error. Please try again later.')
      else if (err.message === 'Network Error') setError('Cannot connect to server. Make sure backend is running.')
      else setError(err.response?.data?.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-row">
          <img src={Logo} alt="IET College" />
          <span>IET College</span>
        </div>
        <h1>Create Account</h1>
        <p className="auth-subtitle">Register for the student portal</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, overflow: 'hidden' }}>
            <div className="auth-field" style={{ minWidth: 0 }}>
              <label htmlFor="si-first">First Name</label>
              <input
                id="si-first"
                placeholder="First name"
                value={firstname}
                onChange={e => setFirstname(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="auth-field" style={{ minWidth: 0 }}>
              <label htmlFor="si-last">Last Name</label>
              <input
                id="si-last"
                placeholder="Last name"
                value={lastname}
                onChange={e => setLastname(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="si-email">Email Address</label>
            <input
              id="si-email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="si-pass">Password</label>
            <input
              id="si-pass"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} />Creating account…</>
              : <><i className="fa-solid fa-user-plus" style={{ marginRight: 8 }} />Create Account</>
            }
          </button>

          <div className="auth-divider">
            Already have an account?{' '}
            <NavLink to="/login" className="auth-small-link">Sign in</NavLink>
          </div>
        </form>
      </div>
    </div>
  )
}
