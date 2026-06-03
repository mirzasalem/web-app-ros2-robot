import { apiRequest } from './client'

export function fetchUsers() {
  return apiRequest('/users/')
}

export function updateUser(userId, payload) {
  return apiRequest(`/users/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
