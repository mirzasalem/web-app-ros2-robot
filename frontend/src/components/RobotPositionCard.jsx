import { formatMeters, formatNumber, hasOdom, radToDeg } from '../utils/robotFormat'
import './RobotPositionCard.css'

export default function RobotPositionCard({ status, live }) {
  const odom = hasOdom(status)
  const yawDeg = odom ? radToDeg(status.yaw) : null

  return (
    <section className={`robot-position glass-strong ${live ? 'live' : odom ? 'stale' : ''}`}>
      <div className="robot-position-header">
        <h3>Robot position</h3>
        <span className={`live-dot ${live ? 'on' : odom ? 'stale' : ''}`}>
          {live ? 'Live' : odom ? 'Last known' : 'No odom'}
        </span>
      </div>
      <div className="coords-grid">
        <div className="coord">
          <span className="coord-label">X</span>
          <span className="coord-value">{formatMeters(status?.x)}</span>
          <span className="coord-unit">m</span>
        </div>
        <div className="coord">
          <span className="coord-label">Y</span>
          <span className="coord-value">{formatMeters(status?.y)}</span>
          <span className="coord-unit">m</span>
        </div>
        <div className="coord">
          <span className="coord-label">θ</span>
          <span className="coord-value">{yawDeg ?? '—'}</span>
          <span className="coord-unit">°</span>
        </div>
        <div className="coord">
          <span className="coord-label">v</span>
          <span className="coord-value">{formatNumber(status?.linear_x)}</span>
          <span className="coord-unit">m/s</span>
        </div>
        <div className="coord">
          <span className="coord-label">ω</span>
          <span className="coord-value">{formatNumber(status?.angular_z)}</span>
          <span className="coord-unit">rad/s</span>
        </div>
      </div>
      <p className="frame-hint">
        Frame: odom · {live ? 'Updating from' : odom ? 'Last update from' : 'Waiting for'}{' '}
        <code>/odom</code>
      </p>
    </section>
  )
}
