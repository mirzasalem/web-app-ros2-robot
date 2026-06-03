import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMappingStatus, startMapping, stopMapping } from '../api/mapping'
import PageHeader from '../components/PageHeader'
import TeleopPad from '../components/TeleopPad'
import TeleopStatus from '../components/TeleopStatus'
import { useRobot } from '../contexts/RobotContext'
import '../components/MappingControls.css'
import '../components/SidebarTeleopPanel.css'
import './MappingPage.css'

const FOXGLOVE_APP_URL =
  import.meta.env.VITE_FOXGLOVE_APP_URL || 'https://app.foxglove.dev'
const FOXGLOVE_WS_URL = import.meta.env.VITE_FOXGLOVE_WS_URL || ''

function foxgloveWsDisplay() {
  if (FOXGLOVE_WS_URL) return FOXGLOVE_WS_URL
  return 'ws://<ROBOT_IP>:8765'
}

export default function MappingPage() {
  const { teleopEnabled, apiOk, rosReady, robotLive } = useRobot()
  const teleopRef = useRef(null)
  const [mapping, setMapping] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [copyLabel, setCopyLabel] = useState('Copy WebSocket URL')

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchMappingStatus()
      setMapping(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    const id = setInterval(loadStatus, 2000)
    return () => clearInterval(id)
  }, [loadStatus])

  const running = mapping?.running

  useEffect(() => {
    if (!running) return
    teleopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [running])

  const handleStart = async () => {
    setBusy(true)
    setError(null)
    try {
      const data = await startMapping()
      setMapping(data)
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
      const data = await stopMapping()
      setMapping(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const openFoxglove = () => {
    window.open(FOXGLOVE_APP_URL, '_blank', 'noopener,noreferrer')
  }

  const copyFoxgloveWs = async () => {
    if (!FOXGLOVE_WS_URL) {
      setCopyLabel('Set VITE_FOXGLOVE_WS_URL first')
      setTimeout(() => setCopyLabel('Copy WebSocket URL'), 2500)
      return
    }
    try {
      await navigator.clipboard.writeText(FOXGLOVE_WS_URL)
      setCopyLabel('Copied!')
      setTimeout(() => setCopyLabel('Copy WebSocket URL'), 2000)
    } catch {
      setCopyLabel('Copy failed')
      setTimeout(() => setCopyLabel('Copy WebSocket URL'), 2000)
    }
  }

  return (
    <div className="page mapping-page">
      <PageHeader
        title="Mapping"
        subtitle="SLAM map building — drive the robot while the map is recording"
      />

      {!mapping?.ros_disabled && mapping?.setup_files_ok === false && (
        <div className="mapping-setup-warn glass" role="alert">
          <strong>ROS workspace not found on this server</strong>
          <p>
            Backend cannot find one of the setup scripts. Set environment variables before{' '}
            <code>manage.py runserver</code>:
          </p>
          <ul>
            <li>
              <code>BUDDY_ROS_SETUP</code> → e.g. <code>/opt/ros/jazzy/setup.bash</code>
            </li>
            <li>
              <code>BUDDY_WS_SETUP</code> → e.g.{' '}
              <code>/home/&lt;you&gt;/ros2_ws/install/setup.bash</code> (absolute path recommended)
            </li>
            <li>
              Optional <code>BUDDY_WS_ROOT</code> → workspace root (parent of <code>install/</code>)
            </li>
          </ul>
          <p className="mapping-setup-paths">
            Checked: <code>{mapping?.ros_setup_path}</code> · <code>{mapping?.ws_setup_path}</code>
          </p>
        </div>
      )}

      <div className="mapping-layout">
        <section className="glass mapping-controls">
          <div className="mapping-status-card">
            <span className={`mapping-pill ${running ? 'on' : ''}`}>
              {running ? 'Mapping active' : 'Mapping stopped'}
            </span>
            {running && mapping?.started_by_display && (
              <p className="mapping-meta">
                Started by <strong>{mapping.started_by_display}</strong>
              </p>
            )}
            {mapping?.ros_disabled && (
              <p className="mapping-hint warn">
                ROS disabled on server — start/stop is simulated for UI testing only.
              </p>
            )}
            {!mapping?.ros_disabled && (
              <p className="mapping-hint">
                Launches <code>ros2 launch buddy {mapping?.launch || 'robot_mapping.launch.py'}</code>{' '}
                (robot + SLAM + joystick). When you start mapping, use the teleop controls to drive.
                Save the map with map_saver when finished.
              </p>
            )}
          </div>

          <div className="mapping-actions">
            {!running ? (
              <button
                type="button"
                className="mapping-btn start"
                onClick={handleStart}
                disabled={busy}
              >
                {busy ? 'Starting…' : 'Start mapping'}
              </button>
            ) : (
              <button
                type="button"
                className="mapping-btn stop"
                onClick={handleStop}
                disabled={busy}
              >
                {busy ? 'Stopping…' : 'Stop mapping'}
              </button>
            )}
            {running && (
              <p className="mapping-stop-sidebar-hint">
                Stops the entire <code>ros2 launch buddy …</code> session (RViz, lidar, SLAM, robot
                stack).
              </p>
            )}
          </div>

          {error && <p className="mapping-error">{error}</p>}

          {!running && (
            <p className="mapping-idle-hint">
              Press <strong>Start mapping</strong> to launch SLAM and open the drive controls.
            </p>
          )}

          {running && (
            <div className="mapping-save-hint glass">
              <strong>When finished</strong>
              <p>Stop mapping here, then on the robot PC:</p>
              <code>ros2 run nav2_map_server map_saver_cli -f ~/ros2_ws/src/buddy/maps/my_map</code>
            </div>
          )}
        </section>

        <section
          ref={teleopRef}
          className={`glass mapping-teleop-panel ${running ? 'mapping-teleop-panel--active' : ''}`}
          aria-hidden={!running}
        >
          {running ? (
            <>
              <h2 className="mapping-teleop-title">Drive while mapping</h2>
              <TeleopStatus apiOk={apiOk} rosReady={rosReady} robotLive={robotLive} />
              <TeleopPad disabled={!teleopEnabled} keyboardEnabled size="large" />
              {!teleopEnabled && (
                <p className="teleop-note">
                  Wait for odometry, then use ↑ ↓ ← → to drive while the map builds.
                </p>
              )}
              <div className="mapping-teleop-stop-wrap">
                <button
                  type="button"
                  className="mapping-btn stop mapping-stop-stack-btn"
                  onClick={handleStop}
                  disabled={busy}
                >
                  {busy ? 'Stopping…' : 'Stop stack (RViz, lidar, SLAM, motors)'}
                </button>
                <p className="mapping-stop-stack-hint">
                  Same as <strong>Stop mapping</strong> on the left — sends SIGTERM to the whole{' '}
                  <code>ros2 launch</code> process group so RViz, lidar, SLAM, and controllers exit
                  together.
                </p>
              </div>
            </>
          ) : (
            <div className="mapping-teleop-placeholder">
              <span className="mapping-teleop-placeholder-icon" aria-hidden>
                🎮
              </span>
              <p>Teleop controls appear here after you start mapping.</p>
            </div>
          )}
        </section>
      </div>

      {running && (
        <section className="glass mapping-foxglove-panel">
          <h3>Live view in browser (Foxglove)</h3>
          <p>
            RViz cannot run inside this website. Use{' '}
            <strong>Foxglove Studio</strong> for map, laser scan, and TF — similar to RViz. On the
            robot PC, start the bridge (after ROS is sourced):{' '}
            <code>ros2 run foxglove_bridge foxglove_bridge</code> — install with{' '}
            <code>sudo apt install ros-jazzy-foxglove-bridge</code> (Ubuntu + ROS 2 Jazzy).
          </p>
          <p>
            In Foxglove: <strong>Open connection</strong> → <strong>Foxglove WebSocket</strong> →
            paste the URL below (default port is <strong>8765</strong>).
          </p>
          {mapping?.rviz_disabled_by_env && (
            <p className="mapping-hint warn">
              RViz is disabled on the robot for this session (<code>BUDDY_WEB_MAPPING_NO_RVIZ</code>{' '}
              or <code>BUDDY_WEB_MAPPING_USE_RVIZ=0</code>). Use Foxglove for visualization.
            </p>
          )}
          <div className="mapping-foxglove-ws-row">
            <code className="mapping-foxglove-ws">{foxgloveWsDisplay()}</code>
          </div>
          <div className="mapping-foxglove-actions">
            <button type="button" className="mapping-foxglove-btn" onClick={openFoxglove}>
              Open Foxglove Studio
            </button>
            <button
              type="button"
              className="mapping-foxglove-btn secondary"
              onClick={copyFoxgloveWs}
              disabled={!FOXGLOVE_WS_URL}
              title={
                FOXGLOVE_WS_URL
                  ? 'Copy WebSocket URL to clipboard'
                  : 'Add VITE_FOXGLOVE_WS_URL to frontend/.env'
              }
            >
              {copyLabel}
            </button>
          </div>
          <p className="mapping-foxglove-note">
            Set <code>VITE_FOXGLOVE_WS_URL</code> in <code>frontend/.env</code> so the URL matches
            your robot (e.g. <code>ws://192.168.1.50:8765</code>). From another machine, use the
            robot&apos;s LAN IP, or an SSH tunnel:{' '}
            <code>ssh -L 8765:localhost:8765 user@robot</code> then connect to{' '}
            <code>ws://127.0.0.1:8765</code>.
          </p>
        </section>
      )}
    </div>
  )
}
