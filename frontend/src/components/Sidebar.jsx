import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSidebar } from '../contexts/SidebarContext'
import { useTheme } from '../contexts/ThemeContext'
import SidebarBattery from './SidebarBattery'
import SidebarLocalizationPanel from './SidebarLocalizationPanel'
import SidebarTeleopPanel from './SidebarTeleopPanel'
import './Sidebar.css'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
]

const settingsItem = { to: '/settings', label: 'Settings', icon: '⚙' }
const docsItem = { to: '/docs', label: 'Documentation', icon: '📖' }
const robotDocsItem = { to: '/docs/buddy', label: 'Robot docs', icon: '🤖' }

export default function Sidebar({ unreadCount = 0 }) {
  const { user, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { collapsed, isMobile, toggleCollapsed, expand, collapse } = useSidebar()
  const location = useLocation()
  const [teleopOpen, setTeleopOpen] = useState(false)
  const [localizationOpen, setLocalizationOpen] = useState(false)

  useEffect(() => {
    setTeleopOpen(false)
    setLocalizationOpen(false)
  }, [location.pathname])

  const closeDrawers = () => {
    setTeleopOpen(false)
    setLocalizationOpen(false)
  }

  const closeSidebarOnMobile = () => {
    if (isMobile) collapse()
  }

  const closePanels = () => {
    closeDrawers()
    closeSidebarOnMobile()
  }

  const toggleTeleop = () => {
    setLocalizationOpen(false)
    if (isMobile) collapse()
    setTeleopOpen((v) => !v)
  }

  const toggleLocalization = () => {
    setTeleopOpen(false)
    if (isMobile) collapse()
    setLocalizationOpen((v) => !v)
  }

  const sidebarClass = ['sidebar', 'glass-strong', collapsed ? 'sidebar--collapsed' : '']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {!collapsed && (
        <button
          type="button"
          className="sidebar-expand-backdrop"
          aria-label="Collapse sidebar"
          onClick={toggleCollapsed}
        />
      )}

      <aside className={sidebarClass}>
        <div className={`sidebar-header${collapsed ? ' sidebar-header--collapsed' : ''}`}>
          {collapsed ? (
            <>
              <img
                className="brand-logo"
                src="/buddy-logo.png"
                alt=""
                width={40}
                height={40}
                title="Buddy"
              />
              <button
                type="button"
                className="sidebar-open-btn"
                onClick={expand}
                aria-label="Open sidebar"
                title="Open menu"
              >
                <span aria-hidden>›</span>
              </button>
            </>
          ) : (
            <>
              <div className="sidebar-brand-col">
                <div className="sidebar-brand-row">
                  <img
                    className="brand-logo"
                    src="/buddy-logo.png"
                    alt=""
                    width={40}
                    height={40}
                    title="Buddy"
                  />
                  <div className="brand-text">
                    <strong>Buddy</strong>
                    <small>{user?.display_name}</small>
                  </div>
                </div>
                <SidebarBattery collapsed={false} />
              </div>
              <button
                type="button"
                className="sidebar-toggle"
                onClick={toggleCollapsed}
                aria-label="Close sidebar"
                title="Close menu"
              >
                <span aria-hidden>‹</span>
              </button>
            </>
          )}
        </div>

        {collapsed && <SidebarBattery collapsed />}

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title={item.label}
              onClick={() => {
                closePanels()
                closeSidebarOnMobile()
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 && (
                <span className="badge">{unreadCount}</span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/mapping"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title="Mapping"
              onClick={() => {
                closePanels()
                closeSidebarOnMobile()
              }}
            >
              <span className="nav-icon">🗺</span>
              <span className="nav-label">Mapping</span>
            </NavLink>
          )}

          {isAdmin && (
            <button
              type="button"
              className="nav-link nav-link-btn"
              onClick={toggleLocalization}
              aria-expanded={localizationOpen}
              aria-controls="sidebar-localization-panel"
              title="Localization (AMCL)"
            >
              <span className="nav-icon">📍</span>
              <span className="nav-label">Localization</span>
              {!collapsed && (
                <span className={`chevron ${localizationOpen ? 'open' : ''}`} aria-hidden>
                  ›
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            className="nav-link nav-link-btn"
            onClick={toggleTeleop}
            aria-expanded={teleopOpen}
            aria-controls="sidebar-teleop-panel"
            title="Teleop"
          >
            <span className="nav-icon">🎮</span>
            <span className="nav-label">Teleop</span>
            {!collapsed && (
              <span className={`chevron ${teleopOpen ? 'open' : ''}`} aria-hidden>
                ›
              </span>
            )}
          </button>

          {isAdmin && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              title="Manage users"
              onClick={() => {
                closePanels()
                closeSidebarOnMobile()
              }}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Manage users</span>
            </NavLink>
          )}

          <NavLink
            to={settingsItem.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={settingsItem.label}
            onClick={() => {
              closePanels()
              closeSidebarOnMobile()
            }}
          >
            <span className="nav-icon">{settingsItem.icon}</span>
            <span className="nav-label">{settingsItem.label}</span>
          </NavLink>

          <NavLink
            to={docsItem.to}
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={docsItem.label}
            onClick={() => {
              closePanels()
              closeSidebarOnMobile()
            }}
          >
            <span className="nav-icon">{docsItem.icon}</span>
            <span className="nav-label">{docsItem.label}</span>
          </NavLink>

          <NavLink
            to={robotDocsItem.to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={robotDocsItem.label}
            onClick={() => {
              closePanels()
              closeSidebarOnMobile()
            }}
          >
            <span className="nav-icon">{robotDocsItem.icon}</span>
            <span className="nav-label">{robotDocsItem.label}</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            <span className="btn-icon">{theme === 'dark' ? '☀' : '🌙'}</span>
            <span className="btn-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </aside>

      <SidebarLocalizationPanel open={localizationOpen} onClose={closeDrawers} />
      <SidebarTeleopPanel open={teleopOpen} onClose={closeDrawers} />
    </>
  )
}
