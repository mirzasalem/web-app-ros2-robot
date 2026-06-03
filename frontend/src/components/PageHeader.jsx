import './PageHeader.css'

/**
 * Standard page title block — used on every main page and sidebar panel.
 */
export default function PageHeader({
  title,
  subtitle,
  actions,
  prominent = false,
  className = '',
}) {
  const hasRow = Boolean(actions)
  const classes = [
    'page-header',
    'glass-strong',
    prominent ? 'page-header--prominent' : '',
    hasRow ? 'page-header--row' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <header className={classes}>
      <div className="page-header-text">
        <h1>{title}</h1>
        {subtitle != null && subtitle !== '' && (
          <p className="subtitle">{subtitle}</p>
        )}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  )
}
