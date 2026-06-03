import { useEffect, useState } from 'react'
import { fetchBattery } from '../api/buddy'
import './SidebarBattery.css'

function formatVoltage(voltage) {
  if (voltage == null || Number.isNaN(voltage)) return '—'
  return `${Number(voltage).toFixed(1)} V`
}

function formatPercent(percentage) {
  if (percentage == null || Number.isNaN(percentage)) return '—'
  return `${Math.round(Number(percentage))}%`
}

export default function SidebarBattery({ collapsed = false }) {
  const [battery, setBattery] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchBattery()
        if (!cancelled) setBattery(data)
      } catch {
        if (!cancelled) setBattery(null)
      }
    }
    load()
    const id = setInterval(load, 2000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  const available = battery?.available
  const live = battery?.live
  const level =
    battery?.percentage != null
      ? Math.max(0, Math.min(100, Number(battery.percentage)))
      : null

  const levelClass =
    level == null ? '' : level <= 20 ? 'low' : level <= 50 ? 'mid' : 'ok'

  if (collapsed) {
    const pctLabel = available ? formatPercent(battery?.percentage) : '—'
    const barWidth = level != null ? `${level}%` : '0%'

    return (
      <div className="sidebar-battery-rail" aria-label="Battery status">
        <div
          className={`sidebar-battery-compact ${live ? 'live' : ''} ${levelClass}`}
          title={
            available
              ? `Battery ${formatVoltage(battery?.voltage)}, ${pctLabel}`
              : 'Battery — waiting for data'
          }
        >
          <div className="sidebar-battery-compact-head">
            <span className="sidebar-battery-icon" aria-hidden>
              🔋
            </span>
            <span className="sidebar-battery-pct-compact">{pctLabel}</span>
          </div>
          <div className="sidebar-battery-bar-track" aria-hidden>
            <span className="sidebar-battery-bar-fill" style={{ width: barWidth }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`sidebar-battery ${live ? 'live' : ''} ${levelClass}`}
      title={battery?.topic ? `ROS topic: ${battery.topic}` : 'Battery'}
    >
      <span className="sidebar-battery-icon" aria-hidden>
        🔋
      </span>
      <span className="sidebar-battery-details">
        <span className="sidebar-battery-row">
          <span className="sidebar-battery-label">Voltage</span>
          <span className="sidebar-battery-value">
            {available ? formatVoltage(battery?.voltage) : '—'}
          </span>
        </span>
        <span className="sidebar-battery-row">
          <span className="sidebar-battery-label">Remaining</span>
          <span className="sidebar-battery-value">
            {available ? formatPercent(battery?.percentage) : '—'}
          </span>
        </span>
      </span>
      {!available && <span className="sidebar-battery-wait">No data yet</span>}
    </div>
  )
}
