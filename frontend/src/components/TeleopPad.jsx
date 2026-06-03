import { useCallback, useEffect, useRef, useState } from 'react'
import { sendTeleop, stopRobot } from '../api/buddy'
import './TeleopPad.css'

const LINEAR = 0.12
const ANGULAR = 0.6

const KEY_MAP = {
  ArrowUp: 'forward',
  ArrowDown: 'back',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const CONTROLS = [
  { name: 'forward', label: 'Forward', gridClass: 'teleop-slot--forward' },
  { name: 'left', label: 'Turn left', gridClass: 'teleop-slot--left' },
  { name: 'stop', label: 'Stop', gridClass: 'teleop-slot--stop', isStop: true },
  { name: 'right', label: 'Turn right', gridClass: 'teleop-slot--right' },
  { name: 'back', label: 'Reverse', gridClass: 'teleop-slot--back' },
]

function velocityFromKeys(keys) {
  let linear = 0
  let angular = 0
  if (keys.has('forward')) linear += LINEAR
  if (keys.has('back')) linear -= LINEAR
  if (keys.has('left')) angular += ANGULAR
  if (keys.has('right')) angular -= ANGULAR
  return { linear, angular }
}

function ArrowIcon({ direction }) {
  return <span className={`teleop-arrow teleop-arrow--${direction}`} aria-hidden />
}

export default function TeleopPad({ disabled, keyboardEnabled = true, size = 'default' }) {
  const activeKeysRef = useRef(new Set())
  const repeatRef = useRef(null)
  const [pressedKeys, setPressedKeys] = useState(() => new Set())

  const clearRepeat = useCallback(() => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current)
      repeatRef.current = null
    }
  }, [])

  const sendStop = useCallback(async () => {
    clearRepeat()
    activeKeysRef.current = new Set()
    setPressedKeys(new Set())
    if (!disabled) {
      try {
        await stopRobot()
      } catch {
        /* backend may be offline */
      }
    }
  }, [clearRepeat, disabled])

  const syncVelocity = useCallback(async () => {
    if (disabled) return
    const keys = activeKeysRef.current
    if (keys.size === 0) {
      try {
        await stopRobot()
      } catch {
        /* ignore */
      }
      return
    }
    const { linear, angular } = velocityFromKeys(keys)
    try {
      await sendTeleop(linear, angular)
    } catch {
      /* ignore */
    }
  }, [disabled])

  const pressKey = useCallback(
    (name) => {
      if (disabled || name === 'stop') return
      activeKeysRef.current.add(name)
      setPressedKeys(new Set(activeKeysRef.current))
      syncVelocity()
      clearRepeat()
      repeatRef.current = setInterval(syncVelocity, 150)
    },
    [clearRepeat, disabled, syncVelocity],
  )

  const releaseKey = useCallback(
    (name) => {
      if (name === 'stop') return
      activeKeysRef.current.delete(name)
      setPressedKeys(new Set(activeKeysRef.current))
      if (activeKeysRef.current.size === 0) {
        clearRepeat()
        sendStop()
      } else {
        syncVelocity()
      }
    },
    [clearRepeat, sendStop, syncVelocity],
  )

  const startHold = useCallback(
    (name) => {
      pressKey(name)
    },
    [pressKey],
  )

  const endHold = useCallback(
    (name) => {
      releaseKey(name)
    },
    [releaseKey],
  )

  useEffect(() => {
    if (!keyboardEnabled) return undefined

    const onKeyDown = (e) => {
      const name = KEY_MAP[e.key]
      if (name) {
        e.preventDefault()
        e.stopPropagation()
        if (!activeKeysRef.current.has(name)) {
          pressKey(name)
        }
        return
      }
      if (e.key === ' ' && !disabled) {
        e.preventDefault()
        sendStop()
      }
    }

    const onKeyUp = (e) => {
      const name = KEY_MAP[e.key]
      if (name) {
        e.preventDefault()
        e.stopPropagation()
        releaseKey(name)
      }
    }

    const onBlur = () => {
      if (activeKeysRef.current.size > 0) sendStop()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      clearRepeat()
    }
  }, [keyboardEnabled, disabled, pressKey, releaseKey, sendStop, clearRepeat])

  useEffect(
    () => () => {
      clearRepeat()
      stopRobot()
    },
    [clearRepeat],
  )

  const padClass = [
    'teleop-pad',
    size === 'large' ? 'teleop-pad--large' : '',
    disabled ? 'teleop-pad--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={padClass}>
      <div className="teleop-dpad-plate">
        <div className="teleop-dpad-grid">
          {CONTROLS.map(({ name, label, gridClass, isStop }) => {
            const pressed = !isStop && pressedKeys.has(name)
            const dir =
              name === 'forward'
                ? 'up'
                : name === 'back'
                  ? 'down'
                  : name === 'left'
                    ? 'left'
                    : name === 'right'
                      ? 'right'
                      : null

            return (
              <div key={name} className={`teleop-slot ${gridClass}`}>
                <button
                  type="button"
                  className={[
                    'teleop-btn',
                    isStop ? 'teleop-btn--stop' : 'teleop-btn--drive',
                    pressed ? 'pressed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={disabled}
                  aria-label={label}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    if (isStop) sendStop()
                    else startHold(name)
                  }}
                  onPointerUp={() => !isStop && endHold(name)}
                  onPointerLeave={() => !isStop && endHold(name)}
                  onPointerCancel={() => !isStop && endHold(name)}
                  onClick={isStop ? sendStop : undefined}
                >
                  {isStop ? (
                    <span className="teleop-stop-label">STOP</span>
                  ) : (
                    <ArrowIcon direction={dir} />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="teleop-keyboard-hint">
        <span className="teleop-keyboard-hint-label">Keyboard</span>
        <div className="teleop-key-chips">
          {[
            { key: 'forward', symbol: '↑' },
            { key: 'left', symbol: '←' },
            { key: 'right', symbol: '→' },
            { key: 'back', symbol: '↓' },
          ].map(({ key, symbol }) => (
            <kbd key={key} className={pressedKeys.has(key) ? 'active' : ''}>
              {symbol}
            </kbd>
          ))}
          <kbd className="teleop-key--space">Space</kbd>
        </div>
        <p className="teleop-keyboard-hint-text">Hold arrows to drive · Space to stop</p>
      </div>
    </div>
  )
}
