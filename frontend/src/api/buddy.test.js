import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHealth, fetchStatus, sendTeleop, stopRobot } from './buddy'

vi.mock('./client', () => ({
  apiRequest: vi.fn(),
}))

describe('buddy api', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetchHealth calls apiRequest', async () => {
    const { apiRequest } = await import('./client')
    apiRequest.mockResolvedValue({ status: 'ok', service: 'buddy-web' })
    const data = await fetchHealth()
    expect(apiRequest).toHaveBeenCalledWith('/health/')
    expect(data.service).toBe('buddy-web')
  })

  it('sendTeleop posts values', async () => {
    const { apiRequest } = await import('./client')
    apiRequest.mockResolvedValue({ linear: 0.1, angular: 0 })
    await sendTeleop(0.1, 0)
    expect(apiRequest).toHaveBeenCalledWith('/teleop/', {
      method: 'POST',
      body: JSON.stringify({ linear: 0.1, angular: 0 }),
    })
  })

  it('stopRobot posts stop', async () => {
    const { apiRequest } = await import('./client')
    apiRequest.mockResolvedValue({ stopped: true })
    await stopRobot()
    expect(apiRequest).toHaveBeenCalledWith('/stop/', { method: 'POST', body: '{}' })
  })
})
