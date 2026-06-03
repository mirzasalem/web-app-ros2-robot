import { useCallback, useEffect, useState } from 'react'
import { fetchUsers, updateUser } from '../api/users'
import PageHeader from '../components/PageHeader'
import UserMap from '../components/UserMap'
import './AdminUsersPage.css'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [edits, setEdits] = useState({})
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const data = await fetchUsers()
    setUsers(data)
    const initial = {}
    data.forEach((u) => {
      initial[u.user_id] = {
        display_name: u.display_name,
        email: u.email || '',
        position_x: u.position_x,
        position_y: u.position_y,
      }
    })
    setEdits(initial)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setField = (userId, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], [field]: value },
    }))
  }

  const saveUser = async (userId) => {
    setMessage('')
    const payload = edits[userId]
    await updateUser(userId, {
      display_name: payload.display_name,
      email: payload.email,
      position_x: Number(payload.position_x),
      position_y: Number(payload.position_y),
    })
    setMessage(`Saved user #${userId}`)
    load()
  }

  const previewUsers = users.map((u) => ({
    ...u,
    display_name: edits[u.user_id]?.display_name ?? u.display_name,
    position_x: Number(edits[u.user_id]?.position_x ?? u.position_x),
    position_y: Number(edits[u.user_id]?.position_y ?? u.position_y),
  }))

  return (
    <div className="page admin-page">
      <PageHeader
        title="Manage users"
        subtitle="Edit names, email, and map X/Y for all users"
      />

      {message && <p className="success glass">{message}</p>}

      <UserMap users={previewUsers} />

      <div className="user-table glass-strong">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Display name</th>
              <th>Email</th>
              <th>X (m)</th>
              <th>Y (m)</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>
                  {u.username}
                  {u.is_admin && <span className="admin-tag">admin</span>}
                </td>
                <td>
                  <input
                    value={edits[u.user_id]?.display_name ?? ''}
                    onChange={(e) => setField(u.user_id, 'display_name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="email"
                    value={edits[u.user_id]?.email ?? ''}
                    onChange={(e) => setField(u.user_id, 'email', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={edits[u.user_id]?.position_x ?? 0}
                    onChange={(e) => setField(u.user_id, 'position_x', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.1"
                    value={edits[u.user_id]?.position_y ?? 0}
                    onChange={(e) => setField(u.user_id, 'position_y', e.target.value)}
                  />
                </td>
                <td>
                  <button type="button" className="btn-secondary" onClick={() => saveUser(u.user_id)}>
                    Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

