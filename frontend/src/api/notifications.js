import { apiRequest } from './client'

export function fetchNotifications() {
  return apiRequest('/notifications/')
}

export function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read/`, { method: 'POST', body: '{}' })
}

export function markAllNotificationsRead() {
  return apiRequest('/notifications/read-all/', { method: 'POST', body: '{}' })
}
