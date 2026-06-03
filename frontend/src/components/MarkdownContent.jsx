import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

/**
 * Renders markdown from src/buddy (may include simple HTML from GitHub-style READMEs).
 */
export default function MarkdownContent({ content, onDocLink }) {
  if (!content) return null

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children, ...props }) => {
            if (onDocLink && href && !href.startsWith('http') && !href.startsWith('#')) {
              const name = href.split('/').pop()?.replace(/\.md$/i, '') || ''
              const map = {
                standalone: 'standalone',
                'drive_train.md': 'drive_train',
                drive_train: 'drive_train',
                readme: 'readme',
              }
              const lower = name.toLowerCase().replace('.md', '')
              const id =
                map[lower] ||
                (lower.includes('installation') ? 'installation' : null) ||
                (lower.includes('troubleshoot') ? 'troubleshooting' : null)
              if (id) {
                return (
                  <button
                    type="button"
                    className="markdown-link-btn"
                    onClick={() => onDocLink(id)}
                  >
                    {children}
                  </button>
                )
              }
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
