import { apiRequest } from './client'

export function fetchLocalizationMaps() {
  return apiRequest('/localization/maps/')
}

export function fetchLocalizationStatus() {
  return apiRequest('/localization/status/')
}

export function startLocalization(mapId) {
  return apiRequest('/localization/start/', {
    method: 'POST',
    body: JSON.stringify({ map: mapId }),
  })
}

export function stopLocalization() {
  return apiRequest('/localization/stop/', {
    method: 'POST',
    body: '{}',
  })
}
