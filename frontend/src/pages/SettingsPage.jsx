import { useEffect, useState } from 'react'
import { updateMe } from '../api/auth'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../contexts/AuthContext'
import './SettingsPage.css'

export default function SettingsPage() {
  const { user, refreshUser, isAdmin } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [posX, setPosX] = useState(0)
  const [posY, setPosY] = useState(0)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name)
      setPosX(user.position_x)
      setPosY(user.position_y)
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    setError('')
    setSaved(false)
    try {
      const payload = {
        display_name: displayName,
        position_x: Number(posX),
        position_y: Number(posY),
      }
      await updateMe(payload)
      await refreshUser()
      setSaved(true)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page page-narrow">
      <PageHeader title="Settings" subtitle="Your profile and map position" />

      <div className="glass-strong settings-block settings-readonly">
        <h2>Your account</h2>
        <dl className="settings-dl">
          <dt>Username</dt>
          <dd>{user?.username}</dd>
          <dt>Email</dt>
          <dd>{user?.email || '—'}</dd>
          <dt>Name</dt>
          <dd>{user?.display_name}</dd>
        </dl>
      </div>

      {isAdmin ? (
        <form className="glass-strong settings-block" onSubmit={handleSave}>
          <h2>Edit your profile (admin)</h2>
          <p className="hint">You can also edit any user under Manage users.</p>
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <div className="slider-row">
            <label>
              X: {Number(posX).toFixed(2)} m
              <input
                type="range"
                min={-10}
                max={10}
                step={0.1}
                value={posX}
                onChange={(e) => setPosX(e.target.value)}
              />
            </label>
            <label>
              Y: {Number(posY).toFixed(2)} m
              <input
                type="range"
                min={-10}
                max={10}
                step={0.1}
                value={posY}
                onChange={(e) => setPosY(e.target.value)}
              />
            </label>
          </div>
          {error && <p className="error">{error}</p>}
          {saved && <p className="success">Settings saved.</p>}
          <button type="submit" className="btn-primary">
            Save changes
          </button>
        </form>
      ) : (
        <div className="glass-strong settings-block">
          <h2>Your position on the map</h2>
          <p className="hint">
            X: <strong>{Number(user?.position_x ?? 0).toFixed(2)}</strong> m · Y:{' '}
            <strong>{Number(user?.position_y ?? 0).toFixed(2)}</strong> m
          </p>
          <p className="hint settings-admin-note">
            Only an admin can change your map position. Set it when you sign up, or ask
            an admin to update it in Manage users.
          </p>
        </div>
      )}
    </div>
  )
}
