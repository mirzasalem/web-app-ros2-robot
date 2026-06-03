import { useCallback, useEffect, useState } from 'react'
import { fetchMap } from '../api/buddy'
import { fetchUsers } from '../api/users'
import { useAuth } from '../contexts/AuthContext'
import { useRobot } from '../contexts/RobotContext'
import PageHeader from '../components/PageHeader'
import RobotPositionCard from '../components/RobotPositionCard'
import RvizMap from '../components/RvizMap'
import { formatMeters, hasOdom, radToDeg } from '../utils/robotFormat'
import './DashboardPage.css'

function StatusCard({ label, value, ok, detail }) {
  return (
    <div className={`status-card glass ${ok ? 'ok' : 'warn'}`}>
      <span className="status-card-label">{label}</span>
      <span className="status-card-value">{value}</span>
      {detail && <span className="status-card-detail">{detail}</span>}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { apiOk, status, error, rosReady, robotLive } = useRobot()
  const [map, setMap] = useState(null)
  const [users, setUsers] = useState([])

  const loadMapAndUsers = useCallback(async () => {
    try {
      const [u, m] = await Promise.all([
        fetchUsers(),
        fetchMap().catch(() => ({ available: false })),
      ])
      setUsers(u)
      setMap(m)
    } catch {
      /* optional */
    }
  }, [])

  const odom = hasOdom(status)
  const localizationActive = Boolean(status?.localization?.running)

  useEffect(() => {
    loadMapAndUsers()
    const pollMs = localizationActive ? 1000 : 3000
    const id = setInterval(loadMapAndUsers, pollMs)
    return () => clearInterval(id)
  }, [loadMapAndUsers, localizationActive])
  const robotOnMap =
    status?.map_pose_live && status?.map_pose
      ? status.map_pose
      : hasOdom(status)
        ? { x: status.x, y: status.y, yaw: status.yaw }
        : null
  const navGoal = status?.nav_goal ?? null
  const navPlan = status?.nav_plan ?? []
  const yawDeg = odom ? radToDeg(status.yaw) : null
  const activeRequesters = status?.active_requesters ?? []
  const activity = status?.activity
  const othersActive = Boolean(activity?.others_active)
  const otherRequesters =
    activity?.other_requesters ??
    activeRequesters.filter((r) => r.username !== user?.username)

  const firstName = user?.display_name?.split(' ')[0] || user?.username

  return (
    <div className="page dashboard-page">
      {error && <p className="dashboard-error glass">{error}</p>}

      <PageHeader
        prominent
        title="Robot control center"
        subtitle={
          <>
            Welcome, <strong>{firstName}</strong>
          </>
        }
      />

      <header className="dashboard-hero glass-strong">
        <div className="hero-telemetry">
          <div className={`hero-pose ${robotLive ? 'live' : odom ? 'stale' : ''}`}>
            <span className="hero-pose-label">Current position</span>
            <code>
              x {formatMeters(status?.x, 2)} · y {formatMeters(status?.y, 2)} · θ{' '}
              {yawDeg != null ? `${yawDeg}°` : '—'}
            </code>
            <span className="hero-pose-hint">
              {robotLive ? 'Live' : odom ? 'Stale' : 'No odom'}
            </span>
          </div>

          <div className={`hero-others-query ${othersActive ? 'yes' : 'no'}`}>
            <span className="hero-panel-label">Anyone else calling?</span>
            <span className="hero-others-answer">{othersActive ? 'Yes' : 'No'}</span>
            {othersActive && otherRequesters.length > 0 && (
              <ul className="hero-others-list">
                {otherRequesters.map((row) => (
                  <li key={row.username}>
                    <strong>{row.user}</strong>
                    <span>{row.action}</span>
                  </li>
                ))}
              </ul>
            )}
            {!othersActive && <span className="hero-panel-hint">Only you</span>}
          </div>

          <div className="hero-requests">
            <span className="hero-panel-label">Currently calling</span>
            {activeRequesters.length === 0 ? (
              <p className="hero-requests-empty">No one on the API</p>
            ) : (
              <ul className="hero-requests-list">
                {activeRequesters.map((row) => {
                  const isYou = row.username === user?.username
                  return (
                    <li key={row.username} className={isYou ? 'is-you' : ''}>
                      <strong>
                        {row.user}
                        {isYou && <span className="caller-you-badge">You</span>}
                      </strong>
                      <span>{row.action}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </header>

      <section className="status-cards">
        <StatusCard label="API" value={apiOk ? 'Online' : 'Offline'} ok={apiOk} />
        <StatusCard label="ROS 2" value={rosReady ? 'Ready' : 'Off'} ok={rosReady} />
        <StatusCard
          label="Robot"
          value={robotLive ? 'Live' : odom ? 'Stale' : 'No odom'}
          ok={robotLive}
          detail={
            robotLive
              ? 'Receiving /odom'
              : odom
                ? `x ${formatMeters(status?.x, 2)} y ${formatMeters(status?.y, 2)}`
                : undefined
          }
        />
        <StatusCard
          label="Map"
          value={map?.available ? 'Loaded' : 'Unavailable'}
          ok={map?.available}
          detail={
            map?.available
              ? localizationActive
                ? `${map.map_name} · AMCL${navGoal ? ' · goal set' : ''}`
                : `${map.map_name} (${map.source})`
              : undefined
          }
        />
      </section>

      <div className="dashboard-main">
        <div className="dashboard-map-col">
          <RvizMap
            map={map}
            robot={robotOnMap}
            goal={navGoal}
            planPath={navPlan}
            users={users}
            localizationActive={localizationActive}
          />
        </div>
        <div className="dashboard-side-col">
          <RobotPositionCard status={status} live={robotLive} />
        </div>
      </div>
    </div>
  )
}
