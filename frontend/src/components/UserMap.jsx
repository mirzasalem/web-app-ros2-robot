import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './UserMap.css'

const SCALE = 28
const PAD = 24

export default function UserMap({ users = [], robot = null }) {
  const { user: me } = useAuth()

  const bounds = useMemo(() => {
    const pts = users.map((u) => ({ x: u.position_x, y: u.position_y }))
    if (robot) pts.push({ x: robot.x, y: robot.y })
    if (!pts.length) return { minX: -2, maxX: 2, minY: -2, maxY: 2 }
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    return {
      minX: Math.min(...xs, -1),
      maxX: Math.max(...xs, 1),
      minY: Math.min(...ys, -1),
      maxY: Math.max(...ys, 1),
    }
  }, [users, robot])

  const toSvg = (x, y) => {
    const w = 320
    const h = 220
    const rx = bounds.maxX - bounds.minX || 1
    const ry = bounds.maxY - bounds.minY || 1
    const sx = ((x - bounds.minX) / rx) * (w - PAD * 2) + PAD
    const sy = h - (((y - bounds.minY) / ry) * (h - PAD * 2) + PAD)
    return { sx, sy }
  }

  return (
    <div className="user-map glass">
      <h3>User positions (map)</h3>
      <svg viewBox="0 0 320 220" className="map-svg" role="img" aria-label="User position map">
        <rect x="0" y="0" width="320" height="220" className="map-bg" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`g${i}`}
            x1={PAD + i * 60}
            y1={PAD}
            x2={PAD + i * 60}
            y2={220 - PAD}
            className="grid-line"
          />
        ))}
        {users.map((u) => {
          const { sx, sy } = toSvg(u.position_x, u.position_y)
          const isMe = u.user_id === me?.user_id
          return (
            <g key={u.user_id} transform={`translate(${sx}, ${sy})`}>
              <circle r={isMe ? 10 : 7} className={isMe ? 'dot me' : 'dot'} />
              <text y={-14} className="dot-label">
                {u.display_name.split(' ')[0]}
              </text>
            </g>
          )
        })}
        {robot && (
          <g transform={`translate(${toSvg(robot.x, robot.y).sx}, ${toSvg(robot.x, robot.y).sy})`}>
            <rect x={-8} y={-8} width={16} height={16} className="robot-dot" />
            <text y={-14} className="dot-label">
              Robot
            </text>
          </g>
        )}
      </svg>
      <p className="map-legend">Drag sliders in Settings to adjust your X, Y. Admin can edit all users.</p>
    </div>
  )
}
