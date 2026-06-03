import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthThemeToggle from '../components/AuthThemeToggle'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'
import './SignupPage.css'

const DEMO_HINTS = [
  { user: 'admin', pass: 'admin123', role: 'Admin' },
  { user: 'alice', pass: 'demo123', role: 'User' },
  { user: 'bob', pass: 'demo123', role: 'User' },
]

export default function LoginPage() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (u, p) => {
    setUsername(u)
    setPassword(p)
  }

  return (
    <div className="login-page">
      <AuthThemeToggle />
      <div className="bg-liquid" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <form className="login-card glass-strong" onSubmit={handleSubmit}>
        <div className="logo-ring">
          <img src="/buddy-logo.png" alt="" className="login-logo" width={72} height={72} />
        </div>
        <h1>Buddy Web</h1>
        <p className="subtitle">Sign in to control your robot</p>
        {error && <p className="login-error">{error}</p>}
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="signup-login-link">
          New here? <Link to="/signup">Create an account</Link>
        </p>
        <div className="demo-users">
          <p>Demo accounts (click to fill):</p>
          <div className="demo-chips">
            {DEMO_HINTS.map((d) => (
              <button
                key={d.user}
                type="button"
                className="demo-chip"
                onClick={() => fillDemo(d.user, d.pass)}
              >
                {d.user} · {d.role}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}

