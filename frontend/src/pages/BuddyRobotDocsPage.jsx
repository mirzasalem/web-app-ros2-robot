import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DocsSubNav from '../components/DocsSubNav'
import MarkdownContent from '../components/MarkdownContent'
import PageHeader from '../components/PageHeader'
import { apiRequest } from '../api/client'
import './DocumentationPage.css'
import './BuddyRobotDocsPage.css'

const DEFAULT_DOC_ID = 'readme'

export default function BuddyRobotDocsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const docId = searchParams.get('doc') || DEFAULT_DOC_ID

  const [catalog, setCatalog] = useState([])
  const [packageRoot, setPackageRoot] = useState('')
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const selectDoc = useCallback(
    (id) => {
      setSearchParams(id === DEFAULT_DOC_ID ? {} : { doc: id }, { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    let cancelled = false
    apiRequest('/docs/buddy/')
      .then((data) => {
        if (cancelled) return
        setCatalog(data.docs || [])
        setPackageRoot(data.package_root || '')
      })
      .catch(() => {
        if (!cancelled) setCatalog([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    apiRequest(`/docs/buddy/${encodeURIComponent(docId)}/`)
      .then((data) => {
        if (cancelled) return
        setDoc(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setDoc(null)
        setError(err.message || 'Could not load document.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [docId])

  const currentMeta = catalog.find((d) => d.id === docId)

  return (
    <div className="page docs-page docs-page--wide">
      <PageHeader
        title="Robot package docs"
        subtitle="Full text from src/buddy — read the official README in your browser"
      />

      <DocsSubNav />

      <div className="buddy-docs-layout">
        <aside className="glass buddy-docs-sidebar">
          <p className="buddy-docs-sidebar-label">Choose a guide</p>
          <ul className="buddy-docs-picker">
            {catalog.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`buddy-docs-picker-btn ${item.id === docId ? 'active' : ''}`}
                  onClick={() => selectDoc(item.id)}
                  disabled={!item.available}
                  title={item.available ? item.description : 'File not found on server'}
                >
                  <span className="buddy-docs-picker-title">{item.title}</span>
                  <span className="buddy-docs-picker-desc">{item.description}</span>
                  {!item.available && (
                    <span className="buddy-docs-picker-missing">Not on server</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {packageRoot && (
            <p className="buddy-docs-root">
              Folder: <code>{packageRoot}</code>
            </p>
          )}
        </aside>

        <article className="glass docs-card buddy-docs-article">
          {loading && <p className="docs-lead">Loading…</p>}
          {error && (
            <div className="buddy-docs-error">
              <p>{error}</p>
              <p className="docs-note">
                Make sure <code>~/ros2_ws/src/buddy</code> exists on the machine running Django,
                or set <code>BUDDY_PACKAGE_DIR</code>.
              </p>
            </div>
          )}
          {!loading && !error && doc && (
            <>
              <header className="buddy-docs-header">
                <h2>{doc.title}</h2>
                <p className="docs-lead">
                  File: <code>{doc.relative_path}</code>
                </p>
              </header>
              <MarkdownContent content={doc.content} onDocLink={selectDoc} />
            </>
          )}
          {!loading && !error && !doc && currentMeta && !currentMeta.available && (
            <p className="docs-lead">
              <strong>{currentMeta.title}</strong> is not available on this server.
            </p>
          )}
        </article>
      </div>
    </div>
  )
}
