import { useCallback, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { fetchNotifications } from '../api/notifications'
import { RobotProvider } from '../contexts/RobotContext'
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext'
import MobileMenuHint from './MobileMenuHint'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import './Layout.css'

function LayoutInner() {
  const { isMobile, collapsed } = useSidebar()
  const [unreadCount, setUnreadCount] = useState(0)
  const menuOpenOnMobile = isMobile && !collapsed
  const loadUnread = useCallback(async () => {
    try {
      const notes = await fetchNotifications()
      setUnreadCount(notes.filter((n) => !n.read).length)
    } catch {
      setUnreadCount(0)
    }
  }, [])

  useEffect(() => {
    loadUnread()
    const id = setInterval(loadUnread, 10000)
    const onRefresh = () => loadUnread()
    window.addEventListener('buddy:notifications', onRefresh)
    return () => {
      clearInterval(id)
      window.removeEventListener('buddy:notifications', onRefresh)
    }
  }, [loadUnread])

  return (
    <div className="layout">
      <div className="bg-liquid" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <Sidebar unreadCount={unreadCount} />
      <TopBar />
      <main
        className={`main-content${menuOpenOnMobile ? ' main-content--menu-open' : ''}`}
        aria-hidden={menuOpenOnMobile ? true : undefined}
      >
        {menuOpenOnMobile ? (
          <MobileMenuHint />
        ) : (
          <Outlet context={{ refreshNotifications: loadUnread }} />
        )}
      </main>
    </div>
  )
}

export default function Layout() {
  return (
    <RobotProvider>
      <SidebarProvider>
        <LayoutInner />
      </SidebarProvider>
    </RobotProvider>
  )
}
