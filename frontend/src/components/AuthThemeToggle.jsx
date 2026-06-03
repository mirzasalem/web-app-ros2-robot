import { useTheme } from '../contexts/ThemeContext'
import './AuthThemeToggle.css'

export default function AuthThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="auth-theme-toggle glass"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="auth-theme-toggle-icon" aria-hidden>
        {isDark ? '☀' : '🌙'}
      </span>
      <span className="auth-theme-toggle-label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  )
}
