import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'buddy_sidebar_collapsed'
const MOBILE_MQ = '(max-width: 768px)'

const SidebarContext = createContext(null)

function readIsMobile() {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_MQ).matches
}

function applySidebarWidth(collapsed, isMobile) {
  const root = document.documentElement
  root.dataset.mobile = isMobile ? '1' : '0'
  root.dataset.sidebarCollapsed = collapsed ? '1' : '0'

  root.style.setProperty(
    '--sidebar-width',
    collapsed
      ? 'var(--sidebar-collapsed-width, 72px)'
      : 'var(--sidebar-expanded-width, 240px)',
  )
}

export function SidebarProvider({ children }) {
  const [isMobile, setIsMobile] = useState(readIsMobile)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
    applySidebarWidth(collapsed, isMobile)
  }, [collapsed, isMobile])

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), [])
  const expand = useCallback(() => setCollapsed(false), [])
  const collapse = useCallback(() => setCollapsed(true), [])

  const value = useMemo(
    () => ({
      collapsed,
      expanded: !collapsed,
      isMobile,
      toggleCollapsed,
      expand,
      collapse,
      setCollapsed,
    }),
    [collapsed, isMobile, toggleCollapsed, expand, collapse],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
