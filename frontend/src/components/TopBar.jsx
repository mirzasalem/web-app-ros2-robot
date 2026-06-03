import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { formatMeters } from '../utils/robotFormat'
import './TopBar.css'

export default function TopBar() {
  const { user, isAdmin, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div className="top-bar" ref={menuRef}>
      <button
        type="button"
        className={`top-bar-trigger glass-strong ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span className="top-bar-avatar" aria-hidden>
          {(user.display_name || user.username || '?').charAt(0).toUpperCase()}
        </span>
        <span className="top-bar-trigger-name">{user.display_name}</span>
        <span className={`top-bar-chevron ${open ? 'open' : ''}`} aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div className="top-bar-menu glass-strong" role="menu">
          <div className="top-bar-menu-header">
            <strong>{user.display_name}</strong>
            <span>@{user.username}</span>
            <span className="top-bar-menu-meta">
              {isAdmin ? 'Administrator' : 'Operator'}
              {' · '}
              Map ({formatMeters(user.position_x, 1)}, {formatMeters(user.position_y, 1)})
            </span>
          </div>
          <Link
            to="/settings"
            className="top-bar-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Account settings
          </Link>
          <button
            type="button"
            className="top-bar-menu-item logout"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
