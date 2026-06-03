export function radToDeg(rad) {
  if (rad == null || !Number.isFinite(rad)) return null
  return ((rad * 180) / Math.PI).toFixed(1)
}

export function formatMeters(value, decimals = 3) {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(decimals)
}

export function formatNumber(value, decimals = 2) {
  if (value == null || !Number.isFinite(value)) return '—'
  return value.toFixed(decimals)
}

export function hasOdom(status) {
  return status != null && status.last_odom_sec != null
}
