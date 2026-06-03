import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { fetchHealth, fetchStatus } from '../api/buddy'

const RobotContext = createContext(null)

export function RobotProvider({ children }) {
  const [apiOk, setApiOk] = useState(false)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)

  const poll = useCallback(async () => {
    try {
      await fetchHealth()
      setApiOk(true)
      setError(null)
      const s = await fetchStatus()
      setStatus(s)
    } catch (e) {
      setApiOk(false)
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    poll()
    const id = setInterval(poll, 500)
    return () => clearInterval(id)
  }, [poll])

  const rosReady = status?.ros_available
  const robotLive = status?.connected
  const teleopEnabled = apiOk && rosReady && robotLive

  const value = useMemo(
    () => ({
      apiOk,
      status,
      error,
      rosReady,
      robotLive,
      teleopEnabled,
      refresh: poll,
    }),
    [apiOk, status, error, rosReady, robotLive, teleopEnabled, poll],
  )

  return <RobotContext.Provider value={value}>{children}</RobotContext.Provider>
}

export function useRobot() {
  const ctx = useContext(RobotContext)
  if (!ctx) throw new Error('useRobot must be used within RobotProvider')
  return ctx
}
