import { NavLink } from 'react-router-dom'
import './DocsSubNav.css'

export default function DocsSubNav() {
  return (
    <nav className="docs-subnav" aria-label="Documentation sections">
      <NavLink
        to="/docs"
        end
        className={({ isActive }) => `docs-subnav-link ${isActive ? 'active' : ''}`}
      >
        Website guide
      </NavLink>
      <NavLink
        to="/docs/buddy"
        className={({ isActive }) => `docs-subnav-link ${isActive ? 'active' : ''}`}
      >
        Robot package (README)
      </NavLink>
    </nav>
  )
}
