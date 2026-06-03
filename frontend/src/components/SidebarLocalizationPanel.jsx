import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchLocalizationMaps,
  fetchLocalizationStatus,
  startLocalization,
  stopLocalization,
} from '../api/localization'
import { useRobot } from '../contexts/RobotContext'
import DrawerCloseButton from './DrawerCloseButton'
import PageHeader from './PageHeader'
import TeleopPad from './TeleopPad'
import TeleopStatus from './TeleopStatus'
import './MappingControls.css'
import './SidebarTeleopPanel.css'
import './SidebarLocalizationPanel.css'

export default function SidebarLocalizationPanel({ open, onClose }) {
  const { teleopEnabled, apiOk, rosReady, robotLive } = useRobot()
  const drawerRef = useRef(null)
  const [maps, setMaps] = useState([])
  const [selectedMap, setSelectedMap] = useState('')
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const loadAll = useCallback(async () => {
    try {
      const [mapData, statusData] = await Promise.all([
        fetchLocalizationMaps(),
        fetchLocalizationStatus(),
      ])
      const list = mapData.maps ?? []
      setMaps(list)
      setStatus(statusData)
      setError(null)
      if (statusData?.running && statusData.map_id) {
        setSelectedMap(statusData.map_id)
      } else {
        setSelectedMap((prev) => prev || list[0]?.id || '')
      }
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined
    drawerRef.current?.focus()
    loadAll()
    const id = setInterval(loadAll, 2000)
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearInterval(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, loadAll])

  const handleStart = async () => {
    if (!selectedMap) {
      setError('Choose a map first.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const data = await startLocalization(selectedMap)
      setStatus(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleStop = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await stopLocalization()
      setStatus(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  const running = status?.running
  const selected = maps.find((m) => m.id === selectedMap)

  return (
    <>
      <button
        type="button"
        className="teleop-backdrop"
        aria-label="Close localization"
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        id="sidebar-localization-panel"
        className="teleop-drawer glass-strong mapping-drawer localization-drawer"
        aria-label="AMCL localization"
        tabIndex={-1}
      >
        <PageHeader
          className="page-header--panel"
          title="Localization"
          subtitle="AMCL + Nav2 on a saved map"
          actions={<DrawerCloseButton onClose={onClose} label="Close localization" />}
        />

        <div className="localization-step glass">
          <label className="localization-label" htmlFor="localization-map-select">
            1. Choose map
          </label>
          {maps.length === 0 ? (
            <p className="mapping-hint warn">
              No saved maps found in <code>src/buddy/maps</code>. Save one with map_saver_cli
              first.
            </p>
          ) : (
            <select
              id="localization-map-select"
              className="localization-select"
              value={selectedMap}
              onChange={(e) => setSelectedMap(e.target.value)}
              disabled={running || busy}
            >
              {maps.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          {selected && (
            <p className="mapping-hint localization-path">
              Resolution {selected.resolution} m/px
            </p>
          )}
        </div>

        <div className="localization-step glass">
          <span className="localization-label">2. Run AMCL + Nav2</span>
          <span className={`mapping-pill ${running ? 'on' : ''}`}>
            {running ? 'Localization active' : 'Localization stopped'}
          </span>
          {running && status?.map_id && (
            <p className="mapping-meta">
              Map <strong>{status.map_id}</strong>
              {status.started_by_display && (
                <>
                  {' '}
                  · started by <strong>{status.started_by_display}</strong>
                </>
              )}
            </p>
          )}
          {status?.ros_disabled && (
            <p className="mapping-hint warn">
              ROS disabled on server — start/stop is simulated for UI testing only.
            </p>
          )}
          {!status?.ros_disabled && (
            <p className="mapping-hint">
              Launches{' '}
              <code>
                ros2 launch buddy {status?.launch || 'robot_navigation.launch.py'} map:=…
              </code>{' '}
              (robot, map_server, AMCL, Nav2, joystick).
            </p>
          )}
        </div>

        <div className="mapping-actions">
          {!running ? (
            <button
              type="button"
              className="mapping-btn start"
              onClick={handleStart}
              disabled={busy || maps.length === 0 || !selectedMap}
            >
              {busy ? 'Starting…' : 'Start localization'}
            </button>
          ) : (
            <button
              type="button"
              className="mapping-btn stop"
              onClick={handleStop}
              disabled={busy}
            >
              {busy ? 'Stopping…' : 'Stop localization'}
            </button>
          )}
        </div>

        {error && <p className="mapping-error">{error}</p>}

        {running && (
          <section className="mapping-teleop-section">
            <h3>Drive manually</h3>
            <TeleopStatus apiOk={apiOk} rosReady={rosReady} robotLive={robotLive} />
            <TeleopPad disabled={!teleopEnabled} keyboardEnabled={open} />
            {!teleopEnabled && (
              <p className="teleop-note">
                Wait for odometry. Use RViz “2D Pose Estimate” if AMCL needs a better initial pose.
              </p>
            )}
          </section>
        )}
      </aside>
    </>
  )
}
