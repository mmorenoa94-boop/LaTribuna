import Link from 'next/link'
import { readFileSync } from 'fs'
import { join } from 'path'

// ── Markdown Parser ──────────────────────────────────────────────────────────

type Block =
  | { type: 'h1'; content: string }
  | { type: 'h2'; content: string; id: string }
  | { type: 'h3'; content: string }
  | { type: 'p'; content: string }
  | { type: 'li'; content: string; ordered?: boolean; index?: number }
  | { type: 'hr' }
  | { type: 'table'; headers: string[]; rows: string[][] }

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

function parseMarkdown(md: string): Block[] {
  const lines = md.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) { i++; continue }

    // Horizontal rule
    if (trimmed === '---') {
      blocks.push({ type: 'hr' })
      i++; continue
    }

    // Table detection: line starts with | and next line is separator
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|[-\s|]+\|$/.test(lines[i + 1].trim())) {
      const headers = trimmed.split('|').filter(c => c.trim()).map(c => c.trim())
      i += 2 // skip header + separator
      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim().split('|').filter(c => c.trim()).map(c => c.trim())
        rows.push(row)
        i++
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', content: trimmed.slice(4) })
      i++; continue
    }
    if (trimmed.startsWith('## ')) {
      const content = trimmed.slice(3)
      blocks.push({ type: 'h2', content, id: slugify(content) })
      i++; continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', content: trimmed.slice(2) })
      i++; continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s(.+)/)
      if (match) {
        blocks.push({ type: 'li', content: match[2], ordered: true, index: parseInt(match[1]) })
      }
      i++; continue
    }

    // Unordered list
    if (trimmed.startsWith('- ')) {
      blocks.push({ type: 'li', content: trimmed.slice(2) })
      i++; continue
    }

    // Paragraph
    blocks.push({ type: 'p', content: trimmed })
    i++
  }

  return blocks
}

// ── Inline Renderer ──────────────────────────────────────────────────────────

function renderInline(text: string) {
  // Handle **bold** and [links](url)
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-lt-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lt-green underline underline-offset-2 hover:text-lt-green/80 transition-colors"
        >
          {linkMatch[1]}
        </a>
      )
    }
    return part
  })
}

// ── Block Renderer ───────────────────────────────────────────────────────────

function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h1':
            return (
              <div key={i} className="mb-6">
                <h1 className="font-bebas text-3xl text-lt-white leading-tight tracking-wide">
                  {block.content}
                </h1>
                <div className="mt-2 h-0.5 w-16 bg-lt-green rounded-full" />
              </div>
            )

          case 'h2':
            return (
              <h2
                key={i}
                id={block.id}
                className="font-condensed text-lg font-700 text-lt-white mt-8 mb-3 flex items-center gap-2.5 scroll-mt-20"
              >
                <span className="w-1 h-5 bg-lt-green rounded-full inline-block flex-shrink-0" />
                {block.content}
              </h2>
            )

          case 'h3':
            return (
              <h3 key={i} className="font-condensed text-base font-700 text-lt-muted mt-5 mb-2">
                {block.content}
              </h3>
            )

          case 'li':
            return block.ordered ? (
              <div key={i} className="flex gap-3 pl-1 mb-1.5">
                <span className="text-lt-green font-condensed font-700 text-sm min-w-[1.25rem] text-right flex-shrink-0">
                  {block.index}.
                </span>
                <p className="text-lt-muted2 text-sm leading-relaxed flex-1">
                  {renderInline(block.content)}
                </p>
              </div>
            ) : (
              <div key={i} className="flex gap-2.5 pl-2 mb-1.5">
                <span className="text-lt-green text-xs mt-1.5 flex-shrink-0">●</span>
                <p className="text-lt-muted2 text-sm leading-relaxed flex-1">
                  {renderInline(block.content)}
                </p>
              </div>
            )

          case 'hr':
            return (
              <div key={i} className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent" />
              </div>
            )

          case 'table':
            return (
              <div key={i} className="my-4 overflow-x-auto rounded-lg border border-[rgba(255,255,255,0.07)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-lt-card2">
                      {block.headers.map((h, j) => (
                        <th
                          key={j}
                          className="text-left text-lt-muted font-condensed font-700 text-xs uppercase tracking-wider px-3.5 py-2.5 border-b border-[rgba(255,255,255,0.07)]"
                        >
                          {renderInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, j) => (
                      <tr
                        key={j}
                        className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                      >
                        {row.map((cell, k) => (
                          <td key={k} className="text-lt-muted2 text-sm px-3.5 py-2.5 leading-relaxed">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )

          case 'p':
          default:
            return (
              <p key={i} className="text-lt-muted2 text-sm leading-relaxed mb-2">
                {renderInline(block.content)}
              </p>
            )
        }
      })}
    </>
  )
}

// ── Table of Contents ────────────────────────────────────────────────────────

function TableOfContents({ blocks }: { blocks: Block[] }) {
  const headings = blocks.filter((b): b is Block & { type: 'h2' } => b.type === 'h2')
  if (headings.length === 0) return null

  return (
    <nav className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 mb-6">
      <p className="text-lt-muted2 font-condensed text-[10px] uppercase tracking-widest mb-3">
        Contenido
      </p>
      <div className="space-y-1.5">
        {headings.map((h, i) => (
          <a
            key={i}
            href={`#${h.id}`}
            className="block text-lt-muted font-condensed text-sm hover:text-lt-green transition-colors pl-2 border-l-2 border-transparent hover:border-lt-green/50"
          >
            {h.content}
          </a>
        ))}
      </div>
    </nav>
  )
}

// ── Layout ───────────────────────────────────────────────────────────────────

export default function LegalPageLayout({
  title,
  icon,
  docFile,
}: {
  title: string
  icon: string
  docFile: string
}) {
  const filePath = join(process.cwd(), 'docs', docFile)
  const md = readFileSync(filePath, 'utf-8')
  const blocks = parseMarkdown(md)

  // Extract version line (first bold paragraph)
  const versionBlock = blocks.find(
    (b): b is Block & { type: 'p'; content: string } =>
      b.type === 'p' && 'content' in b && b.content.startsWith('**Versión')
  )
  const contentBlocks = blocks.filter((b) => b !== versionBlock)

  return (
    <div className="min-h-screen bg-lt-black pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-lt-card/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.07)] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Link
            href="/perfil"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-lt-card2 border border-[rgba(255,255,255,0.07)] text-lt-muted2 hover:text-lt-white hover:border-lt-green/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{icon}</span>
            <h1 className="font-condensed text-sm font-700 text-lt-white truncate">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Version badge */}
      {versionBlock && (
        <div className="px-4 pt-5 pb-1">
          <div className="inline-flex items-center gap-2 bg-lt-green/10 border border-lt-green/20 rounded-full px-3.5 py-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-lt-green" />
            <span className="text-lt-green font-condensed text-xs font-600">
              {versionBlock.content.replace(/\*\*/g, '')}
            </span>
          </div>
        </div>
      )}

      {/* Table of contents */}
      <div className="px-4 pt-5">
        <TableOfContents blocks={contentBlocks} />
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        <BlockRenderer blocks={contentBlocks} />
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)] p-4 text-center">
          <p className="text-lt-muted2 font-condensed text-xs">
            {icon} {title}
          </p>
          <p className="text-lt-muted2 font-condensed text-[10px] mt-1">
            La Tribuna — El juego de los que sí saben
          </p>
        </div>
      </div>
    </div>
  )
}
