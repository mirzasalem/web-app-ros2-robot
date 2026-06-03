import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import AuthThemeToggle from '../components/AuthThemeToggle'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'
import './SignupPage.css'

export default function SignupPage() {
  const { user, setUser } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== password2) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      const x = posX === '' ? 0 : Number(posX)
      const y = posY === '' ? 0 : Number(posY)
      if (Number.isNaN(x) || Number.isNaN(y)) {
        setError('X and Y must be valid numbers.')
        setLoading(false)
        return
      }
      const data = await apiRegister({
        display_name: displayName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        position_x: x,
        position_y: y,
      })
      setUser(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <AuthThemeToggle />
      <div className="bg-liquid" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <form className="login-card glass-strong signup-card" onSubmit={handleSubmit}>
        <div className="logo-ring">
          <img src="/buddy-logo.png" alt="" className="login-logo" width={72} height={72} />
        </div>
        <h1>Create account</h1>
        <p className="subtitle">Join Buddy Web — set your map position</p>
        {error && <p className="login-error">{error}</p>}

        <label>
          Your name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            required
            placeholder="e.g. Alex"
          />
        </label>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            placeholder="letters and numbers"
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>
        <label>
          Confirm password
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>

        <div className="signup-position-block">
          <p className="signup-position-label">Your position on the map (meters)</p>
          <div className="signup-position-row">
            <label>
              X (meters)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={posX}
                onChange={(e) => setPosX(e.target.value)}
                placeholder="0"
              />
            </label>
            <label>
              Y (meters)
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={posY}
                onChange={(e) => setPosY(e.target.value)}
                placeholder="0"
              />
            </label>
          </div>
          <p className="signup-hint">An admin can change your X and Y later.</p>
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <p className="signup-login-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  )
}
