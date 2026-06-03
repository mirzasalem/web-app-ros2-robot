import { apiRequest } from './client'

export function fetchHealth() {
  return apiRequest('/health/')
}

export function fetchStatus() {
  return apiRequest('/status/')
}

export function fetchBattery() {
  return apiRequest('/battery/')
}

export function fetchMap() {
  return apiRequest('/map/')
}

function notifyRefresh() {
  window.dispatchEvent(new Event('buddy:notifications'))
}

export function sendTeleop(linear, angular) {
  return apiRequest('/teleop/', {
    method: 'POST',
    body: JSON.stringify({ linear, angular }),
  }).then((data) => {
    notifyRefresh()
    return data
  })
}

export function stopRobot() {
  return apiRequest('/stop/', { method: 'POST', body: '{}' }).then((data) => {
    notifyRefresh()
    return data
  })
}
