import { apiRequest, setToken } from './client'

export function register(payload) {
  return apiRequest('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((data) => {
    setToken(data.token)
    return data
  })
}

export function login(username, password) {
  return apiRequest('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then((data) => {
    setToken(data.token)
    return data
  })
}

export function logout() {
  return apiRequest('/auth/logout/', { method: 'POST', body: '{}' }).finally(() =>
    setToken(null),
  )
}

export function fetchMe() {
  return apiRequest('/auth/me/')
}

export function updateMe(payload) {
  return apiRequest('/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
