import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import PageHeader from '../components/PageHeader'
import './NotificationsPage.css'

export default function NotificationsPage() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const { refreshNotifications } = useOutletContext() || {}

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotes(data)
      refreshNotifications?.()
    } finally {
      setLoading(false)
    }
  }, [refreshNotifications])

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (id) => {
    await markNotificationRead(id)
    load()
  }

  const markAll = async () => {
    await markAllNotificationsRead()
    load()
  }

  const unread = notes.filter((n) => !n.read).length

  return (
    <div className="page">
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        actions={
          unread > 0 ? (
            <button type="button" className="btn-secondary" onClick={markAll}>
              Mark all read
            </button>
          ) : null
        }
      />

      {loading && <p className="hint">Loading…</p>}

      <ul className="notif-list">
        {notes.map((n) => (
          <li key={n.id} className={`glass notif-item ${n.read ? 'read' : ''}`}>
            <div>
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <small>{new Date(n.created_at).toLocaleString()}</small>
            </div>
            {!n.read && (
              <button type="button" className="btn-secondary" onClick={() => markRead(n.id)}>
                Mark read
              </button>
            )}
          </li>
        ))}
      </ul>

      {!loading && notes.length === 0 && (
        <p className="glass empty-state">No notifications yet.</p>
      )}
    </div>
  )
}
