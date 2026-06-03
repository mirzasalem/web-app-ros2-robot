export default function DrawerCloseButton({ onClose, label = 'Close' }) {
  return (
    <button type="button" className="teleop-close" onClick={onClose} aria-label={label}>
      ✕
    </button>
  )
}
