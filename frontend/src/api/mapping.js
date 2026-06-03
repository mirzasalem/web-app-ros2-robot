import { apiRequest } from './client'

export function fetchMappingStatus() {
  return apiRequest('/mapping/status/')
}

export function startMapping() {
  return apiRequest('/mapping/start/', { method: 'POST', body: '{}' })
}

export function stopMapping() {
  return apiRequest('/mapping/stop/', { method: 'POST', body: '{}' })
}
