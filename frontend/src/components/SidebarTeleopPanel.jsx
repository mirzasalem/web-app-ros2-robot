import { useEffect, useRef } from 'react'
import { useRobot } from '../contexts/RobotContext'
import DrawerCloseButton from './DrawerCloseButton'
import PageHeader from './PageHeader'
import TeleopPad from './TeleopPad'
import TeleopStatus from './TeleopStatus'
import './SidebarTeleopPanel.css'

export default function SidebarTeleopPanel({ open, onClose }) {
  const { teleopEnabled, apiOk, rosReady, robotLive } = useRobot()
  const drawerRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    drawerRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="teleop-backdrop"
        aria-label="Close teleop"
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        id="sidebar-teleop-panel"
        className="teleop-drawer glass-strong"
        aria-label="Teleop controls"
        tabIndex={-1}
      >
        <PageHeader
          className="page-header--panel"
          title="Teleop"
          subtitle="Drive Buddy with the pad or arrow keys"
          actions={<DrawerCloseButton onClose={onClose} label="Close teleop" />}
        />

        <TeleopStatus apiOk={apiOk} rosReady={rosReady} robotLive={robotLive} />

        <div className="teleop-drawer-body">
          <TeleopPad disabled={!teleopEnabled} keyboardEnabled={open} />
        </div>

        {!teleopEnabled && (
          <p className="teleop-note">
            Connect the backend with ROS and live odometry, then use the pad or ↑ ↓ ← → to drive.
          </p>
        )}
      </aside>
    </>
  )
}
