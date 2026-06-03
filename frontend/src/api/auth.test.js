import { describe, expect, it, vi, afterEach } from 'vitest'
import { login } from './auth'

vi.mock('./client', () => ({
  apiRequest: vi.fn(),
  setToken: vi.fn(),
}))

describe('auth api', () => {
  afterEach(() => vi.clearAllMocks())

  it('login stores token', async () => {
    const { apiRequest, setToken } = await import('./client')
    apiRequest.mockResolvedValue({ token: 'abc', user: { username: 'admin' } })
    const data = await login('admin', 'admin123')
    expect(setToken).toHaveBeenCalledWith('abc')
    expect(data.user.username).toBe('admin')
  })
})
