import { useLocation } from 'react-router-dom'
import { useSidebar } from '../contexts/SidebarContext'
import './MobileMenuHint.css'

const PAGE_LABELS = {
  '/': 'Dashboard',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/docs': 'Documentation',
  '/docs/buddy': 'Robot docs',
  '/mapping': 'Mapping',
  '/admin/users': 'Manage users',
}

function pageLabel(pathname) {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname]
  return 'This page'
}

export default function MobileMenuHint() {
  const { collapse } = useSidebar()
  const { pathname } = useLocation()
  const label = pageLabel(pathname)

  return (
    <div className="mobile-menu-hint glass-strong" role="status" aria-live="polite">
      <span className="mobile-menu-hint-icon" aria-hidden>
        ☰
      </span>
      <h2 className="mobile-menu-hint-title">Menu is open</h2>
      <p className="mobile-menu-hint-text">
        <strong>{label}</strong> will show when you close the sidebar.
      </p>
      <p className="mobile-menu-hint-sub">
        Tap the arrow on the menu, tap outside, or use the button below.
      </p>
      <button type="button" className="btn-primary mobile-menu-hint-btn" onClick={collapse}>
        Close menu
      </button>
    </div>
  )
}
