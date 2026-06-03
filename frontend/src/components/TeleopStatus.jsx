export default function TeleopStatus({ apiOk, rosReady, robotLive }) {
  const items = [
    { id: 'api', label: 'API', ok: apiOk },
    { id: 'ros', label: 'ROS', ok: rosReady },
    { id: 'robot', label: 'Robot', ok: robotLive },
  ]

  return (
    <ul className="teleop-status-bar" aria-label="Connection status">
      {items.map(({ id, label, ok }) => (
        <li key={id} className={`teleop-status-item ${ok ? 'ok' : 'warn'}`}>
          <span className="teleop-status-dot" aria-hidden />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}
