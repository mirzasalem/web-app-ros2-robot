const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'buddy_auth_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) headers.Authorization = `Token ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (res.status === 401) {
    setToken(null)
    window.dispatchEvent(new Event('buddy:logout'))
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = body.detail || body.non_field_errors?.[0] || res.statusText
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  if (res.status === 204) return null
  return res.json()
}
