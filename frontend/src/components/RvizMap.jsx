import { useEffect, useRef } from 'react'
import './RvizMap.css'

function decodeMapData(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** World (map frame) → canvas pixel */
export function worldToCanvas(map, wx, wy) {
  const mx = (wx - map.origin_x) / map.resolution
  const my = (wy - map.origin_y) / map.resolution
  return {
    cx: mx,
    cy: map.height - 1 - my,
  }
}

function toCanvasPoint(map, wx, wy, cw, ch) {
  const { cx, cy } = worldToCanvas(map, wx, wy)
  return {
    px: (cx / map.width) * cw,
    py: (cy / map.height) * ch,
  }
}

function occupancyColor(value) {
  if (value === 255) return [140, 150, 165, 255]
  if (value >= 65) return [30, 35, 45, 255]
  if (value <= 10) return [245, 247, 250, 255]
  return [180, 185, 195, 255]
}

function drawRobotArrow(ctx, px, py, yaw, len = 14) {
  ctx.save()
  ctx.translate(px, py)
  ctx.rotate(-yaw)
  ctx.fillStyle = '#34d399'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(len, 0)
  ctx.lineTo(-len * 0.6, len * 0.45)
  ctx.lineTo(-len * 0.6, -len * 0.45)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export default function RvizMap({
  map,
  robot,
  goal = null,
  planPath = [],
  users = [],
  localizationActive = false,
}) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!map?.available || !map.data_b64) return undefined
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return undefined

    const ctx = canvas.getContext('2d')
    const data = decodeMapData(map.data_b64)
    const { width, height } = map

    const draw = () => {
      const maxW = wrap.clientWidth || 600
      const maxH = Math.min(480, window.innerHeight * 0.55)
      const scale = Math.min(maxW / width, maxH / height, 4)
      const cw = Math.floor(width * scale)
      const ch = Math.floor(height * scale)

      canvas.width = cw
      canvas.height = ch

      const img = ctx.createImageData(width, height)
      for (let j = 0; j < height; j += 1) {
        for (let i = 0; i < width; i += 1) {
          const idx = j * width + i
          const [r, g, b, a] = occupancyColor(data[idx])
          const py = height - 1 - j
          const o = (py * width + i) * 4
          img.data[o] = r
          img.data[o + 1] = g
          img.data[o + 2] = b
          img.data[o + 3] = a
        }
      }

      const off = document.createElement('canvas')
      off.width = width
      off.height = height
      off.getContext('2d').putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(off, 0, 0, cw, ch)

      // Global plan path
      if (planPath.length >= 2) {
        ctx.beginPath()
        planPath.forEach((pt, i) => {
          if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return
          const { px, py } = toCanvasPoint(map, pt.x, pt.y, cw, ch)
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
        ctx.strokeStyle = 'rgba(96, 165, 250, 0.95)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([6, 4])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // User markers
      users.forEach((u) => {
        const { px, py } = toCanvasPoint(map, u.position_x, u.position_y, cw, ch)
        ctx.beginPath()
        ctx.fillStyle = 'rgba(228, 228, 231, 0.9)'
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.arc(px, py, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      })

      // Navigation goal
      if (goal && Number.isFinite(goal.x) && Number.isFinite(goal.y)) {
        const { px, py } = toCanvasPoint(map, goal.x, goal.y, cw, ch)
        ctx.beginPath()
        ctx.fillStyle = 'rgba(251, 191, 36, 0.35)'
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 2
        ctx.arc(px, py, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.beginPath()
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.moveTo(px - 6, py - 6)
        ctx.lineTo(px + 6, py + 6)
        ctx.moveTo(px + 6, py - 6)
        ctx.lineTo(px - 6, py + 6)
        ctx.stroke()
        if (Number.isFinite(goal.yaw)) {
          drawRobotArrow(ctx, px, py, goal.yaw, 10)
        }
      }

      // Robot (map pose when localizing)
      if (robot && Number.isFinite(robot.x) && Number.isFinite(robot.y)) {
        const { px, py } = toCanvasPoint(map, robot.x, robot.y, cw, ch)
        drawRobotArrow(ctx, px, py, robot.yaw ?? 0)
      }
    }

    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [map, robot, goal, planPath, users])

  if (!map?.available) {
    return (
      <div className="rviz-map glass map-empty">
        <h3>RViz map</h3>
        <p>
          {map?.detail ||
            (localizationActive
              ? 'Waiting for map…'
              : 'Map not available. Start localization or set BUDDY_MAP_YAML.')}
        </p>
      </div>
    )
  }

  const sourceLabel =
    map.source === 'ros'
      ? 'live /map'
      : map.source === 'localization'
        ? 'localization file'
        : map.source

  return (
    <div className="rviz-map glass-strong" ref={wrapRef}>
      <div className="rviz-map-header">
        <h3>RViz map</h3>
        <span className="map-meta">
          {map.map_name}
          {map.localization_active ? ' · AMCL' : ''} · {sourceLabel} · {map.resolution} m/px
        </span>
      </div>
      <canvas ref={canvasRef} className="rviz-canvas" aria-label="Occupancy grid map" />
      <p className="map-legend">
        Green = robot · Gold ✕ = Nav2 goal · Blue line = global plan · Gray dots = users
      </p>
    </div>
  )
}
